#!/usr/bin/env python3
"""Generate only Emma's complete uploaded answers, without waiting for other voices.

Reuses the same Kokoro model, chunking, voice and MP3 encoder as the main build.
"""
from __future__ import annotations
import json
from pathlib import Path
from generate_kokoro_audio import (
    Kokoro, MODEL_FILE, VOICES_FILE, OUT_DIR, read_questions, generate_one,
)

def main():
    questions=read_questions()
    if not MODEL_FILE.is_file() or not VOICES_FILE.is_file():
        raise RuntimeError("Kokoro model files missing")
    engine=Kokoro(str(MODEL_FILE),str(VOICES_FILE))
    dest=OUT_DIR/"answers-full"
    dest.mkdir(parents=True,exist_ok=True)
    for n,q in enumerate(questions,1):
        target=dest/f"{int(q['id']):03d}.mp3"
        print(f"[{n}/{len(questions)}] Saving Emma's complete answer for Q{q['id']}",flush=True)
        generate_one(engine,"Answer. "+str(q["full"]),target,"bf_emma")
    print("FINISHED 72/72 complete uploaded-answer recordings for Emma",flush=True)

if __name__=="__main__":
    main()
