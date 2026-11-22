# CareRecall — Free Care Assistant Interview Practice Website

A responsive, no-subscription website that helps you recall **72 care assistant interview questions** from your supplied notes, including a continuous audio **Listen & Learn** page.

## What you get

- **Dashboard:** progress, confidence, reviews due, seven-day activity and a suggested study method.
- **Recall Practice:** unexpected questions, answer before revealing, short natural answers, 3 recall cues, original answers, self-rating and scheduled follow-up practice.
- **Mock Interview:** mixed topics, 60-second countdown and optional speech dictation of your own response.
- **Listen & Learn:** reads a question, optionally waits while you answer aloud, reads the answer and automatically continues. Choose a topic, UK English voice (where available), short/full answer, speed, shuffle, repeats, and transcript visibility.
- **Question Library:** search all 72 questions and browse nine families of questions that share similar answer approaches.
- **Private progress:** no login, server, database, ads, third-party scripts or API keys. Review history is stored in your browser's local storage. Export and import it as a JSON file to back it up.
- **Installable/offline:** when served over HTTPS, the included service worker caches website assets for offline use after the first load. Voice playback availability offline depends on your device's voices.

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

## ElevenLabs premium voice option (no API key needed)

On **Listen & Learn**, scroll to **Hear the questions in an ElevenLabs voice**.

1. Choose a batch of 4 questions and select the short or full answers.
2. Click **Copy script** and open [ElevenLabs Text to Speech](https://elevenlabs.io/text-to-speech).
3. Pick a voice there, paste the script, generate it, and download the MP3.
4. Name the recording `01.mp3` (for questions 1–4), `02.mp3` (questions 5–8), and so on.
5. Repeat for other batches. Under **Listen back to back**, select all MP3 recordings together. The player sorts them by filename and automatically plays them one after the other. Pause, skip, change speed, and loop as needed.

The recordings stay in your own browser: the site only holds temporary object URLs for selected files, not copies on a server. If you reload the page, you will need to select the MP3s again. Keep the tab open to listen. Generation and download happen entirely at ElevenLabs using your account; **CareRecall does not provide ElevenLabs voices directly**, does not automatically call their API and does not require an API key. ElevenLabs free credits may not cover every script; review their current usage and licensing terms.

## Listen & Learn voice — important detail

The audio page uses the **Web Speech API speech synthesis voices installed on or supplied by your browser/device**. They are **generated speech**, not recordings of a real human. A device that offers natural-sounding British English voices may sound close to a professional narrator; a different device may sound more computer-like.

- Try a voice marked `en-GB` with a natural, premium or enhanced description.
- On macOS, additional voices may be available under **System Settings → Accessibility → Spoken Content → System Voice → Manage Voices** (menu names depend on macOS version). After installing voices, restart the browser.
- On iOS / iPadOS, available voices depend on device settings, browser and version.
- Some mobile browsers stop speech if the display locks or the browser moves into the background. Keep the website open and screen active for reliable listening.
- If voices are missing, allow the page to load and reopen the voice menu; try another browser. No API key is needed.
- The **Dictate** button on the practice page is separate: it uses speech recognition if supported. Your browser **may send speech to a service** to transcribe it. Never dictate resident names or personal medical information.

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
├── listen.html                # Continuous UK English voice playback
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
- The audio sequence was tested with a simulated voice. Live voice quality depends on the browser and operating system.