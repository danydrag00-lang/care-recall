"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");
const page = fs.readFileSync(path.join(ROOT, "listen.html"), "utf8");
const code = fs.readFileSync(path.join(ROOT, "assets/saved-audio.js"), "utf8");
const rawData = fs.readFileSync(path.join(ROOT, "assets/data.js"), "utf8");
const bank = JSON.parse(rawData.replace(/^[\s\S]*?window\.CARE_DATA\s*=\s*/, "").replace(/;\s*$/, ""));
const questions = bank.questions;

function harness(options = {}) {
  const els = new Map();
  const pending = new Map();
  let timerId = 0;
  const recordedFetches = [];
  const unavailable = options.unavailable || (() => false);

  function get(id) {
    if (!els.has(id)) {
      const classes = new Set();
      const item = {
        id, value: "", textContent: "", disabled: false, hidden: true,
        src: "", playbackRate: 1, currentTime: 0, ended: false, checked: false,
        options: [], children: [], listeners: {}, attributes: {}, playing: false, plays: 0,
        classList: {
          toggle(name, on) { if (on) classes.add(name); else classes.delete(name); },
          contains(name) { return classes.has(name); },
        },
        addEventListener(event, callback) { this.listeners[event] = callback; },
        setAttribute(name, value) { this.attributes[name] = value; },
        appendChild(child) {
          this.children.push(child);
          this.options.push(child);
          if (this.options.length === 1 && !this.value) this.value = child.value;
        },
        replaceChildren() { this.children = []; this.options = []; this.value = ""; },
        pause() { this.playing = false; },
        load() { this.ended = false; },
        removeAttribute(key) { if (key === "src") this.src = ""; },
        play() {
          this.plays++;
          if (options.rejectNextPlay) {
            options.rejectNextPlay = false;
            return Promise.reject(new Error("Playback rejected"));
          }
          this.playing = true; this.ended = false;
          return Promise.resolve();
        },
        scrollIntoView() { this.scrolled = true; },
      };
      els.set(id, item);
    }
    return els.get(id);
  }

  get("saved-topic").value = "all";
  get("saved-voice").value = "bf_emma";
  get("saved-rate").value = "1";
  get("saved-think").value = "0";
  get("saved-repeat").checked = true;

  const context = {
    document: {
      getElementById: get,
      createElement: () => ({value: "", textContent: ""}),
    },
    window: {
      CARE_DATA: bank,
      location: {search: options.search || ""},
      addEventListener() {},
    },
    fetch: async (url, args = {}) => {
      const address = String(url);
      recordedFetches.push(address);
      if (args.method === "HEAD") {
        const ok = !unavailable(address);
        return {
          ok, status: ok ? 200 : 404,
          headers: {get: () => ok ? "audio/mpeg" : "text/html"},
        };
      }
      return {
        ok: true,
        json: async () => ({
          question_count: questions.length,
          answer_styles: ["short", "full"],
          files: questions.map(q => ({id: q.id})),
        }),
      };
    },
    setTimeout(callback) { const id = ++timerId; pending.set(id, callback); return id; },
    clearTimeout(id) { pending.delete(id); },
    URLSearchParams,
    Date,
  };

  vm.runInNewContext(code, context, {filename: "assets/saved-audio.js", timeout: 1000});

  async function flush() {
    for (let i = 0; i < 12; i++) await Promise.resolve();
    await new Promise(resolve => setImmediate(resolve));
  }
  function click(id) {
    const fn = get(id).listeners.click;
    assert.equal(typeof fn, "function", "missing click handler for " + id);
    fn();
  }
  function change(id, value) {
    const element = get(id);
    element.value = value;
    assert.equal(typeof element.listeners.change, "function");
    element.listeners.change();
  }
  function input(id, value) {
    const element = get(id);
    element.value = value;
    element.listeners.input();
  }
  function endAudio() {
    get("saved-audio").ended = true;
    get("saved-audio").listeners.ended();
  }
  function advanceTimeout() {
    const first = pending.entries().next().value;
    assert(first, "there should be a scheduled audio transition");
    pending.delete(first[0]);
    first[1]();
  }
  return {get, click, change, input, flush, endAudio, advanceTimeout, recordedFetches, options};
}

test("question data and listening markup are complete", () => {
  assert.equal(questions.length, 72);
  assert.equal(new Set(questions.map(q => q.id)).size, 72);
  for (const q of questions) assert(q.question && q.short && q.full);
  for (const id of [...code.matchAll(/\$\("([a-z-]+)"\)/g)].map(x => x[1])) {
    assert(page.includes('id="' + id + '"'), "missing HTML target " + id);
  }
  assert(page.includes('id="saved-repeat" checked'));
  assert(page.includes('id="saved-answer-full"'));
  assert(page.includes('id="saved-jump-search"'));
});

test("all 72 questions appear in direct jump selector", async () => {
  const h = harness();
  await h.flush();
  assert.equal(h.get("saved-jump-select").options.length, 72);
  assert.equal(h.get("saved-position").textContent, "Question 1 of 72 · Q1");
  assert.equal(h.get("saved-play").disabled, false);
});

test("opening Listen from the question library selects requested Q42", async () => {
  const h = harness({search: "?q=42"});
  await h.flush();
  assert.equal(h.get("saved-position").textContent, "Question 42 of 72 · Q42");
  assert.equal(h.get("saved-question").textContent, questions[41].question);
  assert.equal(h.get("saved-jump-select").value, "42");
});

test("search accepts Q05 and filters by topic keywords", async () => {
  const h = harness();
  h.input("saved-jump-search", "Q05");
  assert.equal(h.get("saved-jump-select").options.length, 1);
  assert.equal(h.get("saved-jump-select").value, "5");
  h.input("saved-jump-search", "safeguarding");
  assert(h.get("saved-jump-select").options.length > 1);
  h.input("saved-jump-search", "no-question-matches-this");
  assert.equal(h.get("saved-jump-go").disabled, true);
  h.input("saved-jump-search", "");
  assert.equal(h.get("saved-jump-select").options.length, 72);
});

test("jump moves to any question and retains voice, answer mode and repeat", async () => {
  const h = harness();
  h.click("saved-answer-full");
  h.change("saved-voice", "bf_isabella");
  h.input("saved-jump-search", "42");
  h.click("saved-jump-go");
  assert.equal(h.get("saved-position").textContent, "Question 42 of 72 · Q42");
  assert.equal(h.get("saved-answer").textContent, questions[41].full);
  assert.equal(h.get("saved-repeat").checked, true);
  assert.equal(h.get("saved-voice").value, "bf_isabella");
  assert.equal(h.get("saved-audio").src, "audio/voices/bf_isabella/questions/042.mp3");
});

test("Next after a searched jump clears the stale search and selects the new question", () => {
  const h = harness();
  h.input("saved-jump-search", "Q42");
  h.click("saved-jump-go");
  assert.equal(h.get("saved-jump-select").value, "42");
  h.click("saved-next");
  assert.equal(h.get("saved-jump-search").value, "");
  assert.equal(h.get("saved-jump-select").value, "43");
  assert.equal(h.get("saved-jump-select").options.length, 72);
});

test("answer tabs change both visible answer and MP3 path", async () => {
  const h = harness();
  h.click("saved-answer-full");
  assert.equal(h.get("saved-answer").textContent, questions[0].full);
  h.click("saved-play-answer");
  assert.equal(h.get("saved-audio").src, "audio/answers-full/001.mp3");
  h.click("saved-answer-short");
  h.click("saved-play-answer");
  assert.equal(h.get("saved-answer").textContent, questions[0].short);
  assert.equal(h.get("saved-audio").src, "audio/answers/001.mp3");
});

test("question audio advances into selected answer audio", () => {
  const h = harness();
  h.click("saved-play");
  assert.equal(h.get("saved-audio").src, "audio/questions/001.mp3");
  h.endAudio();
  assert.equal(h.get("saved-audio").src, "audio/answers/001.mp3");
});

test("repeat mode does not advance to next question until Next is clicked", () => {
  const h = harness();
  h.click("saved-play");
  h.endAudio();
  h.endAudio();
  h.advanceTimeout();
  assert.equal(h.get("saved-audio").src, "audio/questions/001.mp3");
  h.click("saved-next");
  assert.equal(h.get("saved-position").textContent, "Question 2 of 72 · Q2");
  assert.equal(h.get("saved-audio").src, "audio/questions/002.mp3");
});

test("Play answer only repeats only the chosen answer until Next", () => {
  const h = harness();
  h.click("saved-play-answer");
  assert.equal(h.get("saved-audio").src, "audio/answers/001.mp3");
  h.endAudio();
  h.advanceTimeout();
  assert.equal(h.get("saved-audio").src, "audio/answers/001.mp3");
  h.click("saved-next");
  assert.equal(h.get("saved-audio").src, "audio/answers/002.mp3");
  h.click("saved-stop");
  h.click("saved-play");
  assert.equal(h.get("saved-audio").src, "audio/questions/002.mp3");
});

test("missing Isabella full MP3 explains error and offers a working Emma fallback", async () => {
  const h = harness({unavailable:url => url.includes("/voices/") || url.includes("answers-full/")});
  h.change("saved-voice", "bf_isabella");
  h.click("saved-answer-full");
  await h.flush();
  assert.equal(h.get("saved-use-available").hidden, false);
  assert.match(h.get("saved-availability").textContent, /not published yet/);
  h.click("saved-use-available");
  await h.flush();
  assert.equal(h.get("saved-voice").value, "bf_emma");
  assert.equal(h.get("saved-answer").textContent, questions[0].short);
  assert.equal(h.get("saved-audio").src, "audio/answers/001.mp3");
});

test("retries an Emma uploaded-answer recording when it becomes published", async () => {
  let missing = true;
  const h = harness({unavailable: url => missing && url.includes("answers-full/")});
  h.click("saved-answer-full");
  await h.flush();
  assert.match(h.get("saved-availability").textContent, /not published/);
  missing = false;
  h.click("saved-play-answer");
  await h.flush();
  assert.equal(h.get("saved-audio").src, "audio/answers-full/001.mp3");
  assert.equal(h.get("saved-audio").playing, true);
  assert.match(h.get("saved-availability").textContent, /Ready to play/);
});

test("Play starts a long-answer recording synchronously from the click", async () => {
  const h = harness({unavailable: url => url.includes("answers-full/")});
  h.click("saved-answer-full");
  await h.flush();
  assert.match(h.get("saved-availability").textContent, /not published/);
  h.click("saved-play-answer");
  // Audio.play() must be called before any async HEAD check resumes:
  // browsers require direct user activation to start sound reliably.
  assert.equal(h.get("saved-audio").src, "audio/answers-full/001.mp3");
  assert.equal(h.get("saved-audio").playing, true);
});

test("browser playback rejection resets the Play button so a retry is possible", async () => {
  const o = {rejectNextPlay: true};
  const h = harness(o);
  h.click("saved-play");
  await h.flush();
  assert.equal(h.get("saved-stop").disabled, true);
  assert.equal(h.get("saved-play").disabled, false);
  h.click("saved-play");
  assert.equal(h.get("saved-audio").src, "audio/questions/001.mp3");
  assert.equal(h.get("saved-stop").disabled, false);
});

test("service worker never caches streamed audio or partial HTTP responses", () => {
  const worker = fs.readFileSync(path.join(ROOT, "sw.js"), "utf8");
  assert.match(worker, /url\.pathname\.includes\('\/audio\/'\)/);
  assert.match(worker, /request\.headers\.has\('range'\)/);
  assert.match(worker, /response\.status===200/);
  assert.match(worker, /\.catch\(\(\)=>\{\}\)/);
});

test("no device speech synthesis or external voice-service UI remains", () => {
  assert(!/id="voice-select"|speechSynthesis|ElevenLabs|Voicebox|TwoShot|Cartesia/.test(page));
  assert(page.includes('id="saved-answer-short"'));
  assert(page.includes('id="saved-answer-full"'));
});
