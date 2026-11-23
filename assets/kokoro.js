/* CareRecall: opt-in local Kokoro 82M neural TTS. No user text is sent to a paid speech API.
   Kokoro JS package and model are fetched on first use from public CDNs. */
(function () {
  "use strict";
  const $ = id => document.getElementById(id);
  if (!$("kokoro-start")) return;
  const questions = window.CARE_DATA?.questions || [];
  const voice = $("kokoro-voice"), topic = $("kokoro-topic"), length = $("kokoro-length");
  const thinking = $("kokoro-thinking"), rate = $("kokoro-rate");
  const player = $("kokoro-audio"), start = $("kokoro-start"), stop = $("kokoro-stop"), next = $("kokoro-next");
  const info = $("kokoro-status"), title = $("kokoro-question"), meter = $("kokoro-meter"), position = $("kokoro-position");
  const modelId = "onnx-community/Kokoro-82M-v1.0-ONNX";
  const packageURL = "https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/dist/kokoro.web.js";
  let engine = null, enginePromise = null, session = 0, running = false, paused = false, index = 0;
  let selected = questions, pendingDone = null, thoughtTimer = null, thoughtResume = null;
  let currentURL = null, currentAudio = null, thoughtRemaining = 0, thoughtStarted = 0;
  const status = message => { info.textContent = message; };
  const releaseAudio = () => {
    if (currentAudio) { currentAudio.pause(); currentAudio = null; }
    player.pause(); player.removeAttribute("src"); player.load();
    if (currentURL) { URL.revokeObjectURL(currentURL); currentURL = null; }
  };
  const flushPending = () => { if (pendingDone) { const done = pendingDone; pendingDone = null; done(false); } };
  function clearThought() {
    if (thoughtTimer) { clearTimeout(thoughtTimer); thoughtTimer = null; }
    thoughtResume = null; thoughtRemaining = 0;
  }
  function abort() {
    ++session; running = false; paused = false; flushPending(); clearThought(); releaseAudio();
    start.textContent = "▶ Start listening"; stop.disabled = true; next.disabled = true;
  }
  function progress() {
    meter.value = selected.length ? index / selected.length : 0;
    position.textContent = selected.length ? ("Question " + Math.min(index + 1, selected.length) + " of " + selected.length) : "No questions";
    title.textContent = selected[index]?.question || "Choose a topic to begin.";
  }
  const categories = [...new Set(questions.map(q => q.category))].filter(Boolean);
  categories.forEach(label => {
    const opt = document.createElement("option"); opt.value = label; opt.textContent = label; topic.appendChild(opt);
  });
  function makeList() {
    selected = questions.filter(q => topic.value === "all" || q.category === topic.value);
    if ($("kokoro-shuffle").checked) {
      for (let i = selected.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1)); [selected[i], selected[j]] = [selected[j], selected[i]];
      }
    }
    index = 0; progress();
  }
  function chunks(input) {
    let text = String(input || "").replace(/\s+/g, " ").trim();
    const result = [];
    while (text.length) {
      if (text.length <= 230) { result.push(text); break; }
      let cut = Math.max(text.lastIndexOf(". ", 230), text.lastIndexOf("! ", 230), text.lastIndexOf("? ", 230));
      if (cut > 75) cut += 1;
      else { cut = text.lastIndexOf(" ", 230); if (cut < 70) cut = 230; }
      result.push(text.slice(0, cut).trim()); text = text.slice(cut).trim();
    }
    return result.filter(Boolean);
  }
  async function loadEngine(id) {
    if (engine) return engine;
    if (!enginePromise) {
      status("Loading the speech engine. First use needs a sizeable model download…");
      enginePromise = (async () => {
        const { KokoroTTS } = await import(packageURL);
        return KokoroTTS.from_pretrained(modelId, {
          dtype: "q8", device: "wasm",
          progress_callback: p => {
            if (session !== id) return;
            if (p.status === "progress" && Number.isFinite(p.progress)) {
              status("Downloading voice model: " + Math.round(p.progress) + "% — this happens only on first use when cached.");
            } else if (p.status === "initiate") status("Preparing the local voice model…");
          }
        });
      })().then(x => { engine = x; return x; }).catch(err => { enginePromise = null; throw err; });
    }
    return enginePromise;
  }
  async function listenTo(text, id) {
    for (const chunk of chunks(text)) {
      if (!running || session !== id) return false;
      status("Generating speech on your device…");
      let audioData;
      try { audioData = await engine.generate(chunk, { voice: voice.value, speed: Number(rate.value) || 1 }); }
      catch (e) { status("Speech generation failed: " + (e?.message || "unknown error")); return false; }
      if (!running || session !== id) return false;
      const blob = audioData.toBlob();
      releaseAudio();
      currentURL = URL.createObjectURL(blob);
      player.src = currentURL; player.playbackRate = 1;
      const complete = new Promise(resolve => {
        pendingDone = resolve;
        const done = ok => {
          if (pendingDone !== resolve) return;
          pendingDone = null; resolve(ok);
        };
        player.onended = () => done(true);
        player.onerror = () => done(false);
      });
      try { await player.play(); status("Playing · " + (chunk.length > 42 ? chunk.slice(0, 42) + "…" : chunk)); }
      catch {
        status("Press ▶ on the audio bar to continue playback.");
      }
      const ok = await complete;
      if (!ok || !running || session !== id) return false;
    }
    return true;
  }
  function reflectPaused() {
    start.textContent = paused ? "▶ Resume" : "❚❚ Pause";
  }
  function pauseThought(ms, id) {
    if (!ms) return Promise.resolve(true);
    return new Promise(resolve => {
      pendingDone = resolve;
      const finish = () => { if (session !== id || !running) { flushPending(); return; }
        thoughtTimer = null; thoughtResume = null; thoughtRemaining = 0;
        if (pendingDone === resolve) { pendingDone = null; resolve(true); }
      };
      const countdown = duration => {
        thoughtRemaining = duration; thoughtStarted = Date.now();
        thoughtTimer = setTimeout(finish, duration);
      };
      thoughtResume = countdown;
      countdown(ms);
    });
  }
  async function run(id) {
    try {
      await loadEngine(id);
      if (!running || session !== id) return;
      while (running && session === id && index < selected.length) {
        const q = selected[index]; progress();
        status("Reading question " + (index + 1) + "…");
        if (!await listenTo("Question " + q.id + ". " + q.question, id)) break;
        const seconds = Number(thinking.value) || 0;
        status("Your turn: think of your answer" + (seconds ? " (" + seconds + " seconds)" : "") + "…");
        if (!await pauseThought(seconds * 1000, id)) break;
        if (!await listenTo("Answer. " + (length.value === "full" ? q.full : q.short), id)) break;
        index++; meter.value = index / selected.length;
      }
      if (session === id && running && index >= selected.length) {
        abort(); meter.value = 1; status("All questions completed. Great work!"); position.textContent = "Completed " + selected.length + " questions";
      } else if (session === id && running) {
        abort(); status("Audio stopped. Choose Start to try again.");
      }
    } catch (err) {
      if (session === id) {
        abort();
        status("Kokoro could not load: " + (err?.message || "network/model error") +
          ". You can still use downloaded MP3 recordings in the player below.");
      }
    }
  }
  function begin() {
    abort(); makeList(); if (!selected.length) { status("No questions in this category."); return; }
    running = true; stop.disabled = false; next.disabled = false;
    start.textContent = "❚❚ Pause"; const id = session; run(id);
  }
  start.addEventListener("click", () => {
    if (!running) { begin(); return; }
    paused = !paused;
    if (paused) {
      player.pause();
      if (thoughtTimer) {
        clearTimeout(thoughtTimer); thoughtTimer = null;
        thoughtRemaining = Math.max(0, thoughtRemaining - (Date.now() - thoughtStarted));
      }
      status("Paused.");
    } else {
      if (thoughtResume && !thoughtTimer) thoughtResume(thoughtRemaining);
      if (player.src && player.paused) player.play().catch(() => status("Press the audio player to resume."));
      status("Resumed.");
    }
    reflectPaused();
  });
  stop.addEventListener("click", () => { abort(); status("Stopped. Ready to start again."); progress(); });
  next.addEventListener("click", () => {
    if (!running) return;
    const upcoming = index + 1;
    abort(); index = upcoming;
    if (index >= selected.length) { status("Last question reached."); return; }
    running = true; stop.disabled = false; next.disabled = false; reflectPaused(); progress(); run(session);
  });
  for (const el of [topic, $("kokoro-shuffle")]) el.addEventListener("change", () => { if (running) abort(); makeList(); status("Topic selected. Press Start listening."); });
  window.addEventListener("pagehide", abort);
  makeList();
  status("Ready. Choose a British English voice and press Start listening.");
})();
