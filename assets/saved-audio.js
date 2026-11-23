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
  const answer = $("saved-answer"), answerKind = $("saved-answer-kind");
  const shortButton = $("saved-answer-short"), fullButton = $("saved-answer-full");
  const count = $("saved-position"), stageLabel = $("saved-stage"), progress = $("saved-progress");
  const topic = $("saved-topic"), rate = $("saved-rate"), think = $("saved-think");
  const repeat = $("saved-repeat"), playlistLoop = $("saved-loop"), reload = $("saved-reload");
  const voice = $("saved-voice"), voiceLabel = $("saved-voice-label");
  const availabilityLabel = $("saved-availability"), fallback = $("saved-use-available");
  const jumpSearch = $("saved-jump-search"), jumpSelect = $("saved-jump-select"), jumpGo = $("saved-jump-go"), jumpHint = $("saved-jump-hint");
  const VOICES = { bf_emma: "Emma", bf_isabella: "Isabella", bm_george: "George" };
  const all = window.CARE_DATA?.questions ?? [];
  let items = [], index = 0, available = true, active = false, paused = false;
  let answerMode = "short";
  let answerOnlyMode = false;
  let stage = "idle", gapTimer = null, gapStart = 0, gapRemaining = 0, gapTarget = null, generation = 0;
  let currentAudio = "";
  let manifest = null;
  let checkedClip = null, checkedReady = null, availabilityCheck = 0;
  const initialQuestion = Number(new URLSearchParams(window.location?.search || "").get("q"));

  const setStatus = message => { status.textContent = message; };
  const filePath = (kind, id) => {
    const selected = Object.hasOwn(VOICES, voice.value) ? voice.value : "bf_emma";
    const root = selected === "bf_emma" ? "audio/" : "audio/voices/" + selected + "/";
    const folder = kind === "question" ? "questions/" : (answerMode === "full" ? "answers-full/" : "answers/");
    return root + folder + String(id).padStart(3,"0") + ".mp3";
  };
  const answerText = q => (answerMode === "full" ? q.full : q.short) ?? "";

  const selectedName = () => (VOICES[voice.value] || "Emma") +
    " · " + (answerMode === "full" ? "uploaded answer" : "short answer");
  function tellNotReady(message) {
    checkedReady = false;
    if (availabilityLabel) availabilityLabel.textContent = message ||
      "Not available yet: " + selectedName() + ". The answer text is available, but its MP3 has not been published.";
    fallback.hidden = voice.value === "bf_emma" && answerMode === "short";
  }
  async function checkCurrentAudio() {
    const q = items[index];
    if (!q) return;
    const requestNumber = ++availabilityCheck;
    const selection = voice.value + "/" + answerMode + "/" + q.id;
    checkedClip = selection;
    checkedReady = null;
    availabilityLabel.textContent = "Checking saved audio for " + selectedName() + "…";
    fallback.hidden = true;
    try {
      const [qResponse, aResponse] = await Promise.all([
        fetch(filePath("question",q.id),{method:"HEAD",cache:"no-store"}),
        fetch(filePath("answer",q.id),{method:"HEAD",cache:"no-store"})
      ]);
      if(requestNumber !== availabilityCheck) return;
      const isAudio = response => response.ok &&
        (!response.headers || /audio|mpeg|octet-stream/i.test(response.headers.get("content-type")||""));
      if (isAudio(qResponse) && isAudio(aResponse)) {
        checkedReady = true;
        availabilityLabel.textContent = "✓ Ready to play: " + selectedName() + ".";
        fallback.hidden = true;
      } else {
        tellNotReady("Audio not published yet: " + selectedName() +
          ". You can still read this answer. Choose Emma + Short answer to listen immediately.");
      }
    } catch(err) {
      if(requestNumber !== availabilityCheck) return;
      checkedReady = null;
      availabilityLabel.textContent = "Could not verify " + selectedName() +
        " (connection unavailable). You can still try Play.";
    }
  }

  function timerClear() { if (gapTimer !== null) clearTimeout(gapTimer); gapTimer = null;gapTarget = null; gapRemaining = 0; }
  function ui() {
    play.disabled = !items.length;
    playAnswer.disabled = !items.length;
    shortButton.classList.toggle("is-active", answerMode === "short");
    fullButton.classList.toggle("is-active", answerMode === "full");
    shortButton.setAttribute("aria-pressed",String(answerMode === "short"));
    fullButton.setAttribute("aria-pressed",String(answerMode === "full"));
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
      count.textContent = "0 of 0";
      progress.value = 0;
      ui();return;
    }
    count.textContent = "Question " + (index + 1) + " of " + items.length + " · Q" + q.id;
    question.textContent = q.question;
    const inJumpOptions = [...jumpSelect.options].some(option => option.value === String(q.id));
    if (!inJumpOptions && jumpSearch.value.trim()) {
      // Pressing Next after a searched jump must not leave the old search result selected.
      jumpSearch.value = "";
      populateJumpList();
    }
    if ([...jumpSelect.options].some(option => option.value === String(q.id))) {
      jumpSelect.value = String(q.id);
    }
    answer.textContent = answerText(q);
    answerKind.textContent = answerMode === "full" ? "MY UPLOADED ANSWER" : "SHORT ANSWER";
    progress.value = items.length ? index / items.length : 0;
    ui();
    void checkCurrentAudio();
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
    } else if (stage !== "idle" && audio.ended) {
      try { audio.currentTime = 0; } catch (_) {}
    }
    audio.playbackRate = Number(rate.value) || 1;
  }
  function startSound(kind) {
    if (!active || paused) return;
    timerClear();
    stage = kind;src(kind);ui();
    setStatus(kind === "question" ? "Playing the question…" : "Playing the saved answer…");
    const playGeneration = generation;
    const result = audio.play();
    if (result && result.catch) result.catch(error => {
      if (playGeneration !== generation || !active || paused) return;
      stopped(false);
      setStatus("The recording could not start. Please check your connection or choose an available voice. Press Play to retry.");
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
        setGap(700, answerOnlyMode ? startAnswer : startQuestion);
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
    if (autoplay) {active = true;paused = false;if (answerOnlyMode) startAnswer(); else startQuestion();}
    else {src("question");setStatus("Ready. Press Play to hear this question and answer.");}
  }
  function changeTopic() {
    stopped();
    items = all.filter(q => topic.value === "all" || q.category === topic.value);
    index = 0;render();
    if (items.length) src("question");
    setStatus("Ready. Press Play to hear each question and its answer.");
  }
  function populateJumpList() {
    const search = jumpSearch.value.trim().toLocaleLowerCase("en-GB");
    const oldId = jumpSelect.value;
    const numberedSearch = search.match(/^(?:question\s*|q\s*)?#?\s*0*(\d+)$/i);
    const wantedId = numberedSearch ? Number(numberedSearch[1]) : null;
    const matching = all.filter(q =>
      !search ||
      (wantedId !== null && q.id === wantedId) ||
      q.question.toLocaleLowerCase("en-GB").includes(search) ||
      (q.category || "").toLocaleLowerCase("en-GB").includes(search)
    );
    jumpSelect.replaceChildren();
    if (!matching.length) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "No matching questions";
      jumpSelect.appendChild(option);
      jumpGo.disabled = true;
      jumpHint.textContent = "No questions match your search. Try another word or number.";
      return;
    }
    for (const q of matching) {
      const option = document.createElement("option");
      option.value = String(q.id);
      option.textContent = "Q" + String(q.id).padStart(2,"0") + " — " + q.question;
      jumpSelect.appendChild(option);
    }
    const currentId = String(items[index]?.id ?? "");
    jumpSelect.value = matching.some(q => String(q.id) === oldId) ? oldId
      : matching.some(q => String(q.id) === currentId) ? currentId
      : String(matching[0].id);
    jumpGo.disabled = false;
    jumpHint.textContent = matching.length + " question" + (matching.length === 1 ? "" : "s") +
      " available. Select one and press Jump & Play. Your settings will stay the same.";
  }
  function jumpToSelectedQuestion() {
    const targetId = Number(jumpSelect.value);
    const selected = all.find(q => q.id === targetId);
    if (!selected) {
      setStatus("Choose a question from the list first.");
      return;
    }
    stopped();
    answerOnlyMode = false;
    // A direct jump always works, even when a different topic filter is active.
    if (topic.value !== "all" && topic.value !== selected.category) {
      topic.value = "all";
      items = all.slice();
    }
    const newIndex = items.findIndex(q => q.id === selected.id);
    if (newIndex < 0) {
      topic.value = "all";
      items = all.slice();
      index = items.findIndex(q => q.id === selected.id);
    } else {
      index = newIndex;
    }
    render();
    active = true;
    paused = false;
    startQuestion();
    question.scrollIntoView?.({block:"nearest",behavior:"smooth"});
  }
  jumpSearch.addEventListener("input",populateJumpList);
  jumpSearch.addEventListener("keydown",event => {
    if (event.key === "Enter" && !jumpGo.disabled) {
      event.preventDefault();
      jumpToSelectedQuestion();
    }
  });
  jumpGo.addEventListener("click",jumpToSelectedQuestion);
  jumpSelect.addEventListener("change",() => {
    const selected = all.find(q => q.id === Number(jumpSelect.value));
    if (selected) jumpHint.textContent = "Selected Q" + selected.id +
      ". Press Jump & Play to hear it. Your current voice and answer version are preserved.";
  });
  for(const cat of [...new Set(all.map(q => q.category).filter(Boolean))]) {
    const opt=document.createElement("option");opt.value=cat;opt.textContent=cat;topic.appendChild(opt);
  }
  play.addEventListener("click",() => {
    if (!items.length) {setStatus("Choose a topic containing questions.");return;}
    if (!active && checkedReady === false) { setStatus("The selected recording is not published yet. Choose Emma with Short answer to listen now."); return; }
    if (active) {if (paused) resumeIt();else pauseIt();return;}
    answerOnlyMode = false;
    active = true;paused = false;startQuestion();
  });
  playAnswer.addEventListener("click", () => {
    if (!items.length) return;
    if (checkedReady === false) { setStatus("The selected recording is not published yet. Choose Emma with Short answer to listen now."); return; }
    stopped(); answerOnlyMode = true; active = true; paused = false;
    startAnswer();
  });
  stop.addEventListener("click",() => {stopped();answerOnlyMode = false;render();if(available)src("question");setStatus("Stopped. Press Play to begin again.");});
  next.addEventListener("click",() => move(1,true));
  prev.addEventListener("click",() => move(-1,true));
  function selectAnswer(nextMode) {
    if (nextMode !== "short" && nextMode !== "full") return;
    if (nextMode === answerMode) return;
    stopped();
    answerOnlyMode = false;
    answerMode = nextMode;
    render();
    if (items.length) src("answer");
    const label = answerMode === "full" ? "your uploaded answer" : "the short answer";
    setStatus("Showing " + label + ". Press Play answer only or Play question & answer to hear this version." +
      (answerMode === "full" && !manifest?.answer_styles?.includes("full") ? " Full-answer audio may still be publishing." : ""));
  }
  shortButton.addEventListener("click", () => selectAnswer("short"));
  fullButton.addEventListener("click", () => selectAnswer("full"));
  topic.addEventListener("change",changeTopic);
  voice.addEventListener("change", () => {
    stopped();
    if (voiceLabel) voiceLabel.textContent = (VOICES[voice.value] || "Emma") + " · Kokoro";
    if (items.length) {src("question"); void checkCurrentAudio();}
    setStatus("Selected " + (VOICES[voice.value] || "Emma") + ". Press Play to hear the saved question and answer.");
  });
  fallback.addEventListener("click", () => {
    stopped();
    answerOnlyMode = true;
    voice.value = "bf_emma";
    if(voiceLabel) voiceLabel.textContent = "Emma · Kokoro";
    answerMode = "short";
    render();
    active = true;
    paused = false;
    startAnswer();
  });
  rate.addEventListener("change",() => {audio.playbackRate=Number(rate.value)||1;});
  playlistLoop.addEventListener("change",ui);
  audio.addEventListener("ended",onEnd);
  audio.addEventListener("error",() => {
    if (active) {
      stopped();
      tellNotReady("Audio not published yet: " + selectedName() + ". Your answer text is still visible. Choose Emma + Short answer to listen now.");
      setStatus("The requested MP3 is missing. Use the available Emma short-answer recording or retry after audio publishing completes.");
    }
  });
  window.addEventListener("pagehide",() => stopped());
  // Recheck missing audio when the learner returns to the tab after publication.
  window.addEventListener("focus", () => {
    if (items.length && checkedReady !== true) void checkCurrentAudio();
  });
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
      void checkCurrentAudio();
      setStatus("The audio library includes " + all.length + " questions. Checking the selected recording…");
    } catch (err) {
      // The manifest is optional: a working MP3 must never be blocked by a failed check.
      void checkCurrentAudio();
      setStatus("Could not read the audio index. Checking the selected MP3 directly…");
    } finally {
      reload.disabled = false;
      ui();
    }
  }
  reload.addEventListener("click",checkSavedAudio);
  changeTopic();
  if (Number.isInteger(initialQuestion) && all.some(q => q.id === initialQuestion)) {
    topic.value = "all";
    items = all.slice();
    index = items.findIndex(q => q.id === initialQuestion);
    render();
    src("question");
    setStatus("Selected Q" + initialQuestion + " from the question library. Press Play to listen.");
  }
  populateJumpList();
  checkSavedAudio();
})();
