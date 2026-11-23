# CareRecall — Free Care Assistant Interview Practice Website

A responsive, no-subscription website that helps you recall **72 care assistant interview questions** from your supplied notes, including a continuous audio **Listen & Learn** page.

## What you get

- **Dashboard:** progress, confidence, reviews due, seven-day activity and a suggested study method.
- **Recall Practice:** unexpected questions, answer before revealing, short natural answers, 3 recall cues, original answers, self-rating and scheduled follow-up practice.
- **Mock Interview:** mixed topics, 60-second countdown and optional speech dictation of your own response.
- **Listen & Learn:** one-click playback of 72 saved British English question-and-answer recordings, with both answer versions shown on screen. Repeat each question until you press Next or switch to automatic advance. Choose topics, playback speed and thinking pause.
- **Question Library:** search all 72 questions and browse nine families of questions that share similar answer approaches.
- **Private progress:** no CareRecall login, database, ads or API keys. Review history stays in your browser's local storage. Export and import a JSON backup. The stored audio files are served as ordinary static site assets.
- **Installable/offline:** when served over HTTPS, the service worker caches the website's static files. Saved audio plays over the internet; previously loaded MP3 recordings may remain in browser cache but offline audio is not guaranteed.

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

## Listen & Learn: saved British English answers

The **Listen & Learn** page displays each interview question, its short spoken answer, and the original full answer on the same screen. The answers are never hidden behind an audio player.

Press **Play** to hear the question, followed by a configurable thinking pause, followed by the short answer. The page plays **pre-generated MP3 recordings** using the free Kokoro English voice `bf_emma`. Audio is not generated in the browser, and no API key, payment account, or external voice studio is required to play it.

**Repeat this question** is enabled by default. When enabled, the same question-and-answer audio repeats until the learner presses **Next question**. Turn it off to advance automatically after each answer. The optional **Repeat the full list** control loops back to the first question after the final one.

If the audio is not ready, the page displays an explanatory message and a **Check recordings** button. The recordings are built from the question bank by the GitHub Actions workflow at `.github/workflows/build-kokoro-audio.yml`. The workflow produces 144 small MP3 files (72 question recordings and 72 answer recordings) in `audio/`, plus `audio/manifest.json`. Once these are published, pressing Play works immediately without loading an AI model.

Audio plays the concise answer (`q.short`), which is shown in full on screen. The original full answer (`q.full`) is available in the expanded section beneath it. Changing the full answer will not affect saved audio until the workflow is run again and the voice files are regenerated.

The **Dictate** button on the practice page remains a separate speech-to-text feature; it can use online recognition depending on browser. Do not dictate residents' private or medical information.

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
├── listen.html                # Saved interview audio and visible answers
├── library.html               # Searchable Q&A and similar groups
├── manifest.webmanifest       # Installable web app metadata
├── sw.js                      # Updates site cache and falls back offline
├── README.md
└── assets/
    ├── data.js                # All 72 questions: original + short answers
    ├── app.js                 # Site functions and review progress
    ├── saved-audio.js         # Play saved MP3s; repeat until Next
    ├── style.css              # Responsive layout and visual design
    └── favicon.svg            # Site icon
```

## Notes for anyone editing this website

- All logic is plain JavaScript, with no package manager, billing, build tools or frameworks.
- Questions are stored in `window.CARE_DATA` from `assets/data.js`.
- The browser stores reviews under `care-recall-progress-v1` in `localStorage`.
- If you change any file after publishing, change `CACHE` in `sw.js` from `care-recall-v1` to a new version to ensure the offline cache updates.
- Speech is pre-generated by GitHub Actions, then stored as MP3 files. Listening does not require the browser to download or run a neural model.