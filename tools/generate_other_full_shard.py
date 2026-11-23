#!/usr/bin/env python3
"""Generate one parallel batch of full uploaded-answer MP3s for a selected Kokoro voice."""
from __future__ import annotations
import argparse
from generate_kokoro_audio import Kokoro, MODEL_FILE, VOICES_FILE, OUT_DIR, read_questions, generate_one

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--voice", choices=("bf_isabella","bm_george"), required=True)
    parser.add_argument("--shard", type=int, required=True)
    parser.add_argument("--shards", type=int, default=4)
    options=parser.parse_args()
    if not 0 <= options.shard < options.shards:
        raise SystemExit("Invalid batch index")
    questions=read_questions()
    engine=Kokoro(str(MODEL_FILE),str(VOICES_FILE))
    subset=[q for i,q in enumerate(questions) if i % options.shards == options.shard]
    print(f"{options.voice} batch {options.shard}: {len(subset)} full answers",flush=True)
    for question in subset:
        destination=OUT_DIR/"voices"/options.voice/"answers-full"/f"{int(question['id']):03d}.mp3"
        generate_one(engine,"Answer. "+question["full"],destination,options.voice)
    print(f"COMPLETE {options.voice} batch {options.shard}",flush=True)

if __name__=="__main__":
    main()
