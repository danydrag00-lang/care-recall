/* CareRecall saved-audio interview player.
 * Uses 144 pre-generated Kokoro British English recordings (one question and answer per item).
 * Repeats the same question + answer until the learner presses Next when Repeat is on.
 * Never generates audio or calls a paid service in the visitor's browser.
 */
(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  if (!$("saved-play")) return;
  const play = $("saved-play"), playAnswer = $("saved-play-answer"), stop = $("saved-stop"), next = $("saved-next"), prev = $("saved-prev");
  const audio = $("saved-audio"), status = $("saved-status"), question = $("saved-question");
  const answer = $("saved-answer"), original = $("saved-full-answer");
  const count = $("saved-position"), stageLabel = $("saved-stage"), progress = $("saved-progress");
  const topic = $("saved-topic"), rate = $("saved-rate"), think = $("saved-think");
  const repeat = $("saved-repeat"), playlistLoop = $("saved-loop"), reload = $("saved-reload");
  const voice = $("saved-voice"), voiceLabel = $("saved-voice-label");
  const VOICES = { bf_emma: "Emma", bf_isabella: "Isabella", bm_george: "George" };
  const all = window.CARE_DATA?.questions ?? [];
  let items = [], index = 0, available = true, active = false, paused = false;
  let stage = "idle", gapTimer = null, gapStart = 0, gapRemaining = 0, gapTarget = null, generation = 0;
  let currentAudio = "";
  let manifest = null;

  const setStatus = message => { status.textContent = message; };
  const filePath = (kind, id) => {
    const selected = Object.hasOwn(VOICES, voice.value) ? voice.value : "bf_emma";
    const root = selected === "bf_emma" ? "audio/" : "audio/voices/" + selected + "/";
    return root + (kind === "question" ? "questions/" : "answers/") + String(id).padStart(3,"0") + ".mp3";
  };
  const answerText = q => q.short ?? "";
  function timerClear() { if (gapTimer !== null) clearTimeout(gapTimer); gapTimer = null;gapTarget = null; gapRemaining = 0; }
  function ui() {
    play.disabled = !items.length;
    playAnswer.disabled = !items.length;
    stop.disabled = !active;
    next.disabled = !items.length;
    prev.disabled = index <= 0;
    play.textContent = active && !paused ? "❚❚ Pause" : (active && paused ? "▶ Resume" : "▶ Play question & answer");
    stageLabel.textContent = stage === "question" ? "QUESTION" : stage === "answer" ? "ANSWER" : stage === "thinking" ? "TIME TO THINK" : "READY";
  }
  function render() {
    const q = items[index];
    if (!q) {
      question.textContent = "No questions in this topic";
      answer.textContent = "Choose another topic.";
      original.textContent = "";
      count.textContent = "0 of 0";
      progress.value = 0;
      ui();return;
    }
    count.textContent = "Question " + (index + 1) + " of " + items.length + " · Q" + q.id;
    question.textContent = q.question;
    answer.textContent = answerText(q);
    original.textContent = q.full ?? "";
    progress.value = items.length ? index / items.length : 0;
    ui();
  }
  function stopped(resetAudio = true) {
    generation++;
    audio.pause();timerClear();
    active = false;paused = false;stage = "idle";
    if (resetAudio) {audio.removeAttribute("src");currentAudio = "";audio.load();}
    ui();
  }
  function src(kind) {
    const q = items[index]; if (!q) return;
    const path = filePath(kind,q.id);
    if (path !== currentAudio) {
      currentAudio = path;
      audio.src = path;audio.load();
    }
    audio.playbackRate = Number(rate.value) || 1;
  }
  function startSound(kind) {
    if (!active || paused) return;
    timerClear();
    stage = kind;src(kind);ui();
    setStatus(kind === "question" ? "Playing the question…" : "Playing the saved answer…");
    const result = audio.play();
    if (result && result.catch) result.catch(error => {
      if (active && !paused) setStatus("Audio could not start. Press Play again, or retry after the recordings are published.");
    });
  }
  function startQuestion() {startSound("question");}
  function startAnswer() {startSound("answer");}
  function setGap(milliseconds, fn) {
    timerClear();
    gapRemaining = milliseconds;gapTarget = fn;
    if (paused || !active) return;
    if (milliseconds === 0) {gapTarget = null;fn();return;}
    const token = generation;
    gapStart = Date.now();
    gapTimer = setTimeout(() => {
      gapTimer = null;gapTarget = null;gapRemaining = 0;
      if (token === generation && active && !paused) fn();
    }, milliseconds);
  }
  function onEnd() {
    if (!active || paused) return;
    if (stage === "question") {
      stage = "thinking";ui();
      const delaySeconds = Number(think.value) || 0;
      setStatus(delaySeconds ? "Think of your answer · " + delaySeconds + " seconds" : "Moving to your answer…");
      setGap(delaySeconds * 1000, startAnswer);
    } else if (stage === "answer") {
      if (repeat.checked) {
        setStatus("Repeating this question and answer. Press Next to move on.");
        stage = "thinking";ui();
        setGap(700, startQuestion);
      } else {
        stage = "thinking";ui();
        setGap(650, () => move(1, true));
      }
    }
  }
  function pauseIt() {
    paused = true;
    if (gapTimer !== null) {
      clearTimeout(gapTimer); gapTimer = null;
      gapRemaining = Math.max(0,gapRemaining - (Date.now()-gapStart));
    }
    audio.pause();ui();setStatus("Paused. Press Resume to continue.");
  }
  function resumeIt() {
    paused = false;ui();
    if (stage === "thinking" && gapTarget) {
      const ms = gapRemaining, fn = gapTarget;
      setGap(ms,fn);setStatus("Continuing…");return;
    }
    const p = audio.play();
    if (p && p.catch) p.catch(() => setStatus("Press Play again to resume the recording."));
    setStatus("Playing…");
  }
  function move(delta, autoplay = active) {
    if (!items.length) return;
    let n = index + delta;
    if (n < 0) return;
    if (n >= items.length) {
      if (playlistLoop.checked) n = 0;
      else {
        stopped();progress.value = 1;
        setStatus("All selected questions completed. Great work!");
        return;
      }
    }
    stopped();index = n;render();
    if (autoplay) {active = true;paused = false;startQuestion();}
    else {src("question");setStatus("Ready. Press Play to hear this question and answer.");}
  }
  function changeTopic() {
    stopped();
    items = all.filter(q => topic.value === "all" || q.category === topic.value);
    index = 0;render();
    if (items.length) src("question");
    setStatus("Ready. Press Play to hear each question and its answer.");
  }
  for(const cat of [...new Set(all.map(q => q.category).filter(Boolean))]) {
    const opt=document.createElement("option");opt.value=cat;opt.textContent=cat;topic.appendChild(opt);
  }
  play.addEventListener("click",() => {
    if (!items.length) {setStatus("Choose a topic containing questions.");return;}
    if (active) {if (paused) resumeIt();else pauseIt();return;}
    active = true;paused = false;startQuestion();
  });
  playAnswer.addEventListener("click", () => {
    if (!items.length) return;
    stopped(); active = true; paused = false;
    startAnswer();
  });
  stop.addEventListener("click",() => {stopped();render();if(available)src("question");setStatus("Stopped. Press Play to begin again.");});
  next.addEventListener("click",() => move(1,true));
  prev.addEventListener("click",() => move(-1,true));
  topic.addEventListener("change",changeTopic);
  voice.addEventListener("change", () => {
    stopped();
    if (voiceLabel) voiceLabel.textContent = (VOICES[voice.value] || "Emma") + " · Kokoro";
    if (items.length) src("question");
    setStatus("Selected " + (VOICES[voice.value] || "Emma") + ". Press Play to hear the saved question and answer.");
  });
  rate.addEventListener("change",() => {audio.playbackRate=Number(rate.value)||1;});
  playlistLoop.addEventListener("change",ui);
  audio.addEventListener("ended",onEnd);
  audio.addEventListener("error",() => {
    if (active) {stopped();setStatus("This recording is not yet available. If you selected Isabella or George, choose Emma or check again once the new recordings are published.");}
  });
  window.addEventListener("pagehide",() => stopped());
  async function checkSavedAudio() {
    reload.disabled = true;
    setStatus("Checking the saved audio library…");
    try {
      const response = await fetch("audio/manifest.json?check=" + Date.now(), { cache: "no-store" });
      if (!response.ok) throw new Error("Manifest was not accessible");
      const payload = await response.json();
      if (payload.question_count !== all.length || !Array.isArray(payload.files) || payload.files.length !== all.length) {
        throw new Error("Unexpected manifest format");
      }
      manifest = payload;
      available = true;
      const chosen = VOICES[voice.value] || "Emma";
      setStatus("Ready · " + chosen + " · " + all.length + " saved questions and answers. Press Play.");
    } catch (err) {
      // The manifest is optional: a working MP3 must never be blocked by a failed check.
      setStatus("Press Play to listen. If a recording is missing, choose Emma or use Check recordings again.");
    } finally {
      reload.disabled = false;
      ui();
    }
  }
  reload.addEventListener("click",checkSavedAudio);
  changeTopic();checkSavedAudio();
})();
