# CareRecall — Free Care Assistant Interview Practice Website

A responsive, no-subscription website that helps you recall **72 care assistant interview questions** from your supplied notes, including a continuous audio **Listen & Learn** page.

## What you get

- **Dashboard:** progress, confidence, reviews due, seven-day activity and a suggested study method.
- **Recall Practice:** unexpected questions, answer before revealing, short natural answers, 3 recall cues, original answers, self-rating and scheduled follow-up practice.
- **Mock Interview:** mixed topics, 60-second countdown and optional speech dictation of your own response.
- **Listen & Learn:** uses Kokoro AI British English voices to read questions, pause for your answer, read model answers and continue automatically. Choose topics, answer length, speed and shuffle. Cartesia and TwoShot recordings can also be loaded as an MP3/WAV playlist.
- **Question Library:** search all 72 questions and browse nine families of questions that share similar answer approaches.
- **Private progress:** no CareRecall login, database, ads or embedded API keys. Review history is stored in your browser's local storage. Export and import a JSON backup. Kokoro's code and model download from external public hosting when you use that option.
- **Installable/offline:** when served over HTTPS, the service worker caches the website's static files. Kokoro's external model requires an initial download and may not work offline; previously selected audio files must be loaded again after a page reload.

## Open it right now

1. Unzip `care-recall-website.zip`.
2. Open `index.html` in Chrome, Safari or Edge on your computer.
3. Select **Recall practice**, **Listen & Learn**, or **Question library**.

For the best experience and phone use, publish it free using GitHub Pages as explained below.

## Publish it FREE on GitHub Pages (beginner-friendly)

You do not need to write or edit any code.

1. Sign in to [GitHub](https://github.com/).
2. Click **+** at the top right → **New repository**.
3. Call it `care-recall`, choose **Public**, and click **Create repository**.
4. In your empty repository, click **uploading an existing file** (or **Add file → Upload files** if the repository already has a file).
5. From the unzipped folder, drag **all its contents** into GitHub. Important: upload `index.html`, `practice.html`, `listen.html`, `library.html`, `manifest.webmanifest`, `sw.js`, `README.md`, and the **assets** folder. Do not upload the ZIP itself as your website.
6. Click **Commit changes**.
7. Open the repository's **Settings → Pages**.
8. Under **Build and deployment**, choose **Deploy from a branch**. Select **main** and **/(root)**, then **Save**.
9. When GitHub Pages shows a published site address, open it. It normally follows the pattern `https://YOUR-GITHUB-USERNAME.github.io/care-recall/` (replace the username; this is an example, not a live link).

GitHub Pages normally hosts static sites for free when the repository is public. Publishing may take a little time to show its first build.

## How to learn so you can answer suddenly

Use a **12–20 minute session**:

1. **3 minutes — Listen & Learn.** Select one topic; use **Short, natural answer** and a 3–6 second thinking pause.
2. **8–10 minutes — Recall Practice.** Pick Smart review. Try to answer *before* revealing the answer. Say the answer aloud in your own words, using three cue words rather than reciting every sentence.
3. **3–5 minutes — Surprise questions.** Pick Random or Timed mock. Mix topics so you can recognise what to say even if an interviewer phrases things differently.
4. Mark **Again / Hard / Good / Easy** after checking. Hard questions get scheduled sooner, questions you remember come back later.

**Study plan:** Days 1–2: personal questions and dignity. Days 3–4: safeguarding and health/safety. Day 5: dementia and communication. Day 6: nutrition, medication and teamwork. Day 7 onward: mixed mock interviews and questions due for review. Keep revisiting beyond a week rather than cramming.

This combines *retrieval practice* (remembering before viewing), *spaced practice* (reviewing over days), and *interleaving* (mixing types of questions). Merely playing audio is less effective than trying to answer out loud before the answer plays.

### Learning science sources

- Dunlosky et al., *Improving Students' Learning With Effective Learning Techniques* (2013): https://doi.org/10.1177/1529100612453266
- Carpenter et al., *The science of effective learning with spacing and retrieval practice* (Nature Reviews Psychology, 2022): https://www.nature.com/articles/s44159-022-00089-1
- The Learning Scientists, spaced and retrieval practice FAQ: https://www.learningscientists.org/faq

## Cartesia and TwoShot recordings (no API key needed in CareRecall)

On **Listen & Learn**, scroll to **Play Cartesia or TwoShot recordings**.

**Preferred Cartesia voice:** Julia — Gentle Guide (British English), voice ID `273f9ef7-9fc2-4def-88bb-ab108c6249ca`. Click **Copy voice ID** on the listening page if you need it for the Cartesia API; in the Playground, look for the voice by its name. A voice ID is not an API key. CareRecall's GitHub Pages deployment does not call Cartesia's API directly; generation requires the external Cartesia Playground or a separate, securely configured backend.


1. Choose a batch of four questions, with short or full answers.
2. Click **Copy script** or **Download script**. Paste it into [Cartesia](https://play.cartesia.ai/) or [TwoShot](https://twoshot.app/open-source-tts/).
3. Generate and download an MP3 or WAV recording if the chosen service offers an audio export, subject to its usage limits.
4. Name files `01.mp3`, `02.mp3` and so on. Select them in CareRecall's audio player to play them continuously, adjust speed or repeat the playlist.

Audio files selected in CareRecall remain in the browser, not on a server. Reloading the page clears the selected recordings. You can also use Kokoro to generate speech locally in a supported browser after the voice model downloads.

## Listen & Learn voices

The browser/device speech-synthesis voice selector has been removed. CareRecall now uses **Kokoro neural TTS** as the native speech player; its English voices generate speech locally after model loading. The model and JavaScript library are fetched from external hosts on first use and performance depends on the device and browser. If it fails, you can load audio files generated externally with Cartesia or TwoShot into the MP3/WAV player.

The **Dictate** button on the practice page is separate: it uses speech recognition if supported. Your browser **may send speech to a service** to transcribe it. Never dictate resident names or personal medical information.

## Safety and accuracy

This is an interview rehearsal tool, **not formal care training**. Short answers are rewritten for clearer spoken practice from the learner's original notes, with selected safety-conscious clarifications. The full version shows the supplied notes (some have typos or may be outdated). Always check your employer's current policies, care plans, training and scope of competence.

Useful UK references:
- CQC — Mental Capacity Act and consent: https://www.cqc.org.uk/guidance-regulation/adult-social-care/mental-capacity-act-adult-social-care-services
- CQC — safeguarding regulation: https://www.cqc.org.uk/guidance-regulation/providers/regulations-service-providers-and-managers/health-social-care-act/regulation-13
- NHS — DNACPR means CPR only, not withdrawing other care: https://www.nhs.uk/tests-and-treatments/do-not-attempt-cardiopulmonary-resuscitation-dnacpr-decisions/
- NHS guidance and local SALT/IDDSI instructions should govern swallowing support.

## Files

```text
care-recall-website/
├── index.html                 # Dashboard
├── practice.html              # Recall, random and timed mock
├── listen.html                # Kokoro and optional imported MP3 playback
├── library.html               # Searchable Q&A and similar groups
├── manifest.webmanifest       # Installable web app metadata
├── sw.js                      # Cache for offline use on HTTPS
├── README.md
└── assets/
    ├── data.js                # All 72 questions: original + short answers
    ├── app.js                 # Site functions, audio player, progress
    ├── style.css              # Responsive layout and visual design
    └── favicon.svg            # Site icon
```

## Notes for anyone editing this website

- All logic is plain JavaScript, with no package manager, billing, build tools or frameworks.
- Questions are stored in `window.CARE_DATA` from `assets/data.js`.
- The browser stores reviews under `care-recall-progress-v1` in `localStorage`.
- If you change any file after publishing, change `CACHE` in `sw.js` from `care-recall-v1` to a new version to ensure the offline cache updates.
- Kokoro speech quality and inference performance depend on the user's browser and device. The model downloads separately on first use.