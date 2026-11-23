#!/usr/bin/env python3
"""One-time batch creation of CareRecall Kokoro MP3 audio.

The generated files are checked into the public repository and played as ordinary
static media by GitHub Pages. Site visitors need no TTS engine or API key.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess
import tempfile
import time

import soundfile as sf
from kokoro_onnx import Kokoro

ROOT = Path(__file__).resolve().parents[1]
DATA_FILE = ROOT / "assets" / "data.js"
OUT_DIR = ROOT / "audio"
MODEL_FILE = ROOT / "model-cache" / "kokoro-v1.0.onnx"
VOICES_FILE = ROOT / "model-cache" / "voices-v1.0.bin"
VOICE = "bf_emma"
SPEED = 0.93


def read_questions() -> list[dict]:
    source = DATA_FILE.read_text(encoding="utf-8")
    match = re.search(r"window\.CARE_DATA\s*=\s*(\{.*\})\s*;\s*$", source, re.S)
    if not match:
        raise RuntimeError("Could not read the CareRecall interview question bank")
    questions = json.loads(match.group(1)).get("questions", [])
    if len(questions) != 72:
        raise RuntimeError(f"Expected 72 questions; found {len(questions)}")
    for question in questions:
        if not question.get("id") or not question.get("question") or not question.get("short"):
            raise RuntimeError("A question is missing its ID, question, or short answer")
    return questions


def encode_mp3(samples, sample_rate: int, target: Path) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="care-recall-tts-") as td:
        wav = Path(td) / "generated.wav"
        tmp = Path(td) / "encoded.mp3"
        sf.write(str(wav), samples, sample_rate, subtype="PCM_16")
        subprocess.run(
            ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
             "-i", str(wav), "-ac", "1", "-ar", "24000",
             "-codec:a", "libmp3lame", "-b:a", "64k", str(tmp)],
            check=True,
        )
        if tmp.stat().st_size < 1000:
            raise RuntimeError("Generated MP3 unexpectedly short")
        tmp.replace(target)


def generate_one(kokoro: Kokoro, words: str, output: Path, force: bool = False) -> None:
    if output.is_file() and output.stat().st_size > 1000 and not force:
        print(f"skip {output.relative_to(ROOT)} (already exists)", flush=True)
        return
    for attempt in range(1, 4):
        try:
            samples, sample_rate = kokoro.create(words, voice=VOICE, speed=SPEED, lang="en-gb")
            if not len(samples):
                raise RuntimeError("Kokoro returned empty speech")
            encode_mp3(samples, sample_rate, output)
            print(f"saved {output.relative_to(ROOT)} ({output.stat().st_size:,} bytes)", flush=True)
            return
        except Exception as exc:
            if attempt >= 3:
                raise RuntimeError(f"Unable to make {output}: {exc}") from exc
            print(f"retry {attempt} on {output.name}: {exc}", flush=True)
            time.sleep(attempt)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--force", action="store_true", help="Regenerate existing audio files")
    args = parser.parse_args()
    questions = read_questions()
    if not MODEL_FILE.is_file() or not VOICES_FILE.is_file():
        raise RuntimeError("Download the Kokoro model and voices into model-cache first")
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    kokoro = Kokoro(str(MODEL_FILE), str(VOICES_FILE))
    for i, q in enumerate(questions, 1):
        ident = int(q["id"])
        q_path = OUT_DIR / "questions" / f"{ident:03d}.mp3"
        a_path = OUT_DIR / "answers" / f"{ident:03d}.mp3"
        print(f"[{i}/{len(questions)}] {q['question'][:70]}", flush=True)
        generate_one(kokoro, f"Question {ident}. {q['question']}", q_path, args.force)
        generate_one(kokoro, f"Answer. {q['short']}", a_path, args.force)
    entries = [
        {
            "id": int(q["id"]),
            "question": f"audio/questions/{int(q['id']):03d}.mp3",
            "answer": f"audio/answers/{int(q['id']):03d}.mp3",
        }
        for q in questions
    ]
    bank_hash = hashlib.sha256(DATA_FILE.read_bytes()).hexdigest()
    manifest = {
        "version": 1,
        "voice": VOICE,
        "model": "Kokoro-82M-v1.0",
        "answer_style": "short",
        "question_count": len(questions),
        "bank_sha256": bank_hash,
        "files": entries,
    }
    (OUT_DIR / "manifest.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    print(f"COMPLETE: {len(entries)} questions and {len(entries)} answers", flush=True)


if __name__ == "__main__":
    main()
