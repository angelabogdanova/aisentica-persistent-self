#!/usr/bin/env python3
"""Download, normalize, concatenate and time the segmented competition voiceover."""

from __future__ import annotations

import json
import re
import subprocess
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "video-output"
VOICE_DIR = OUTPUT / "voice"
CLIP_DIR = VOICE_DIR / "clips"
SOURCE_FILE = ROOT / "video" / "voiceover-clips.json"
SHORT_GAP_SECONDS = 0.28
PART_GAP_SECONDS = 1.8
SAMPLE_RATE = 48_000


def run(*args: str) -> None:
    subprocess.run(args, check=True)


def probe_duration(path: Path) -> float:
    result = subprocess.check_output(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            str(path),
        ],
        text=True,
    )
    return float(result.strip())


def download(url: str, destination: Path) -> None:
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 AisenticaCompetitionVideo/1.0",
            "Accept": "audio/mpeg,audio/*;q=0.9,*/*;q=0.1",
        },
    )
    last_error: Exception | None = None
    for attempt in range(1, 6):
        try:
            with urllib.request.urlopen(request, timeout=90) as response:
                payload = response.read()
            if len(payload) < 1_000:
                raise RuntimeError(f"Downloaded voice clip is unexpectedly small: {len(payload)} bytes")
            destination.write_bytes(payload)
            return
        except Exception as error:  # noqa: BLE001 - retries preserve the final exception
            last_error = error
            if attempt == 5:
                break
            time.sleep(2 ** (attempt - 1))
    raise RuntimeError(f"Unable to download {url}: {last_error}")


def timestamp(seconds: float) -> str:
    milliseconds = max(0, round(seconds * 1_000))
    hours, milliseconds = divmod(milliseconds, 3_600_000)
    minutes, milliseconds = divmod(milliseconds, 60_000)
    secs, milliseconds = divmod(milliseconds, 1_000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{milliseconds:03d}"


def split_cues(text: str, maximum_words: int = 18) -> list[str]:
    sentences = re.split(r"(?<=[.!?])\s+", text.strip())
    cues: list[str] = []
    buffer: list[str] = []
    word_count = 0

    for sentence in sentences:
        words = sentence.split()
        if buffer and word_count + len(words) > maximum_words:
            cues.append(" ".join(buffer))
            buffer = []
            word_count = 0
        buffer.append(sentence)
        word_count += len(words)

    if buffer:
        cues.append(" ".join(buffer))
    return cues


def write_silence(path: Path, duration: float) -> None:
    run(
        "ffmpeg",
        "-loglevel",
        "error",
        "-y",
        "-f",
        "lavfi",
        "-i",
        f"anullsrc=r={SAMPLE_RATE}:cl=mono",
        "-t",
        f"{duration:.3f}",
        "-c:a",
        "pcm_s16le",
        str(path),
    )


def main() -> None:
    clips = json.loads(SOURCE_FILE.read_text(encoding="utf-8"))
    if not clips:
        raise SystemExit("No voiceover clips were configured.")

    CLIP_DIR.mkdir(parents=True, exist_ok=True)
    short_gap = VOICE_DIR / "gap-short.wav"
    part_gap = VOICE_DIR / "gap-part.wav"
    write_silence(short_gap, SHORT_GAP_SECONDS)
    write_silence(part_gap, PART_GAP_SECONDS)

    normalized: list[dict[str, object]] = []
    for index, clip in enumerate(clips, start=1):
        source = CLIP_DIR / f"{index:02d}-{clip['id']}.mp3"
        wave = CLIP_DIR / f"{index:02d}-{clip['id']}.wav"
        download(str(clip["url"]), source)
        run(
            "ffmpeg",
            "-loglevel",
            "error",
            "-y",
            "-i",
            str(source),
            "-vn",
            "-ar",
            str(SAMPLE_RATE),
            "-ac",
            "1",
            "-af",
            "highpass=f=70,lowpass=f=12000,loudnorm=I=-16:TP=-1.5:LRA=8",
            "-c:a",
            "pcm_s16le",
            str(wave),
        )
        duration = probe_duration(wave)
        if not 2.0 <= duration <= 40.0:
            raise RuntimeError(f"Unexpected duration for {clip['id']}: {duration:.3f}s")
        normalized.append({**clip, "wave": wave, "duration": duration})

    concat_lines: list[str] = []
    subtitles: list[str] = []
    cue_number = 1
    cursor = 0.0
    part_durations: dict[int, float] = {}
    source_report: list[dict[str, object]] = []

    for index, clip in enumerate(normalized):
        wave = Path(clip["wave"])
        duration = float(clip["duration"])
        part = int(clip["part"])
        concat_lines.append(f"file '{wave.as_posix()}'")

        cues = split_cues(str(clip["text"]))
        weights = [max(1, len(cue.split())) for cue in cues]
        total_weight = sum(weights)
        local_cursor = cursor + 0.10
        usable_duration = max(0.5, duration - 0.20)
        for cue, weight in zip(cues, weights, strict=True):
            cue_duration = usable_duration * weight / total_weight
            cue_end = local_cursor + cue_duration
            subtitles.extend(
                [
                    str(cue_number),
                    f"{timestamp(local_cursor)} --> {timestamp(cue_end)}",
                    cue,
                    "",
                ]
            )
            cue_number += 1
            local_cursor = cue_end

        cursor += duration
        part_durations[part] = part_durations.get(part, 0.0) + duration

        next_part = int(normalized[index + 1]["part"]) if index + 1 < len(normalized) else None
        if next_part is None or next_part != part:
            gap_path = part_gap
            gap_duration = PART_GAP_SECONDS
        else:
            gap_path = short_gap
            gap_duration = SHORT_GAP_SECONDS
        concat_lines.append(f"file '{gap_path.as_posix()}'")
        cursor += gap_duration
        part_durations[part] += gap_duration

        source_report.append(
            {
                "id": clip["id"],
                "part": part,
                "durationSeconds": round(duration, 3),
                "sourceUrl": clip["url"],
            }
        )

    concat_file = VOICE_DIR / "concat.txt"
    concat_file.write_text("\n".join(concat_lines) + "\n", encoding="utf-8")
    (OUTPUT / "subtitles.srt").write_text("\n".join(subtitles), encoding="utf-8")

    voiceover_wave = OUTPUT / "voiceover.wav"
    voiceover_mp3 = OUTPUT / "voiceover.mp3"
    run(
        "ffmpeg",
        "-loglevel",
        "error",
        "-y",
        "-f",
        "concat",
        "-safe",
        "0",
        "-i",
        str(concat_file),
        "-c:a",
        "pcm_s16le",
        str(voiceover_wave),
    )
    run(
        "ffmpeg",
        "-loglevel",
        "error",
        "-y",
        "-i",
        str(voiceover_wave),
        "-c:a",
        "libmp3lame",
        "-b:a",
        "192k",
        str(voiceover_mp3),
    )

    final_duration = probe_duration(voiceover_wave)
    report = {
        "voice": "AI Voice Generator clear",
        "clipCount": len(normalized),
        "durationSeconds": round(final_duration, 3),
        "shortGapSeconds": SHORT_GAP_SECONDS,
        "partGapSeconds": PART_GAP_SECONDS,
        "partDurationsSeconds": {
            str(part): round(duration, 3) for part, duration in sorted(part_durations.items())
        },
        "clips": source_report,
    }
    (OUTPUT / "voiceover-report.json").write_text(
        json.dumps(report, indent=2) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
