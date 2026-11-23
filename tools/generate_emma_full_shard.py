#!/usr/bin/env python3
"""Generate a subset of Emma's complete answers so they can be published sooner."""
from __future__ import annotations
import argparse
from generate_kokoro_audio import Kokoro, MODEL_FILE, VOICES_FILE, OUT_DIR, read_questions, generate_one

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--shard", type=int, required=True)
    parser.add_argument("--shards", type=int, default=4)
    args = parser.parse_args()
    if not 0 <= args.shard < args.shards:
        raise SystemExit("Invalid shard number")
    questions = read_questions()
    voice = Kokoro(str(MODEL_FILE), str(VOICES_FILE))
    work = [(idx, q) for idx, q in enumerate(questions) if idx % args.shards == args.shard]
    print(f"Shard {args.shard + 1}/{args.shards}: {len(work)} complete uploaded answers", flush=True)
    for idx, q in work:
        path = OUT_DIR / "answers-full" / f"{int(q['id']):03d}.mp3"
        generate_one(voice, "Answer. " + str(q["full"]), path, "bf_emma")
        print(f"Shard {args.shard + 1}: saved question {q['id']}", flush=True)
    print(f"Shard {args.shard + 1}: COMPLETE", flush=True)

if __name__ == "__main__":
    main()
