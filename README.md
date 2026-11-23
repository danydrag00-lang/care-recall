# CareRecall — Free Care Assistant Interview Practice Website

A responsive, no-subscription website that helps you recall **72 care assistant interview questions** from your supplied notes, including a continuous audio **Listen & Learn** page.

## What you get

- **Dashboard:** progress, confidence, reviews due, seven-day activity and a suggested study method.
- **Recall Practice:** unexpected questions, answer before revealing, short natural answers, 3 recall cues, original answers, self-rating and scheduled follow-up practice.
- **Mock Interview:** mixed topics, 60-second countdown and optional speech dictation of your own response.
- **Study Room:** edit Short or My full answer and save the revision privately; the site automatically regenerates narrated speech for the new wording with browser-based Kokoro. Unchanged answers use the pre-recorded MP3s. Repeat until Next, jump to a question, or use Focus mode.
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

## Personal answer edits and updated playback

From **Study Room**, select **Short** or **My full answer**, then choose **Edit answer**. Save the rewritten answer with **Save & update voice**. The chosen text updates immediately in the Study Room, Question Library and Recall Practice. Edits are kept in the browser's `localStorage`, not saved in the public GitHub source and not synced across devices or browsers. **Restore original** removes only the selected question/version override and uses its existing pre-recorded MP3 again.

For a saved personal revision, CareRecall automatically starts Kokoro browser narration using the selected Emma, Isabella or George voice. This never deliberately plays the old MP3 against your revised text. Kokoro's first use needs to download an AI model and run local speech generation, which can be demanding on older devices. The newly generated WAV file is cached in the browser's IndexedDB so later playback can reuse it. The web app shows generation progress; if the model is unavailable, the text remains saved and the player explains that the updated narration could not be prepared. You can retry without making a new edit. No voice key, paid API account or built-in device voice is needed.

**Privacy:** edited answers are stored on this device. The existing original answers and their MP3s are in the public GitHub repository. Kokoro's code/model are downloaded from external public hosts when you first edit an answer, but the text-to-speech computation runs in the visitor's browser rather than submitting revised text to CareRecall's server. Avoid putting confidential resident or patient information into any public answers.

## Visual design

The website uses an editorial study-journal style: warm ivory paper, charcoal navigation, copper accents, serif reading typography and a simple C monogram. The former mint-green dashboard styling is replaced across Dashboard, Recall Practice, Question Library and Study Room.

## Study Room — calm, focused listening

The `listen.html` page is designed like a compact study desk rather than an audio-production dashboard: one question, its selected answer, and a single prominent Play control. The Play, Next, Back, answer-only and repeat-until-Next controls remain visible. Question jumping and study preferences are available inside compact expandable panels, not large sidebar widgets. **Focus mode** hides navigation while you study; press Escape or Exit focus to return to the normal layout. The default page shows answers immediately, rather than hiding them behind recall mode.

## Listen & Learn: choose which answer to read and hear

Every question now includes two clickable answer choices directly above the answer text:

- **Short answer** displays the concise interview-ready version from `q.short`.
- **My uploaded answer** displays the complete original answer from `q.full`, as supplied by the learner. This is not rewritten or shortened.

Selecting an option immediately updates the displayed answer. Press **Play** or **Play answer only** to hear that same selected version in the chosen Kokoro British English voice. The audio is pre-generated and saved as ordinary static MP3 recordings, so website visitors do not have to generate speech or use an API key.

**Repeat until Next** is enabled by default. This repeats the question and whichever answer type is selected until the learner presses **Next question**. Disable it to advance automatically after each answer.

Audio files use `audio/questions/001.mp3` for the Emma question, `audio/answers/001.mp3` for Emma's short answer, and `audio/answers-full/001.mp3` for Emma's complete original answer. Isabella and George use analogous paths under `audio/voices/<voice_id>/`. All three voice versions are created by `tools/generate_kokoro_audio.py` and saved by `.github/workflows/build-kokoro-audio.yml`. The build uses manageable segments for long original answers to avoid truncating their text. All 72 complete answers are published for each of the three Kokoro voices; the matching MP3 is played directly from GitHub Pages, and the selected answer text appears immediately.

**Privacy:** The website repository is public, and `assets/data.js` already includes the original answers. Saved recordings of those answers will also be publicly accessible. Do not use personal or confidential details you would not want to publish.

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