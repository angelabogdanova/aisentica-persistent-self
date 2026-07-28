#!/usr/bin/env python3
"""Create the clean competition master without burned-in subtitles or low-frequency noise."""

from __future__ import annotations

import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "video-output"
SILENT_MASTER = OUTPUT / "silent-master.mp4"
VOICEOVER = OUTPUT / "voiceover.wav"
FINAL_VIDEO = OUTPUT / "aisentica-persistent-self-demo.mp4"
VALIDATION = OUTPUT / "final-validation.json"
VOICE_REPORT = OUTPUT / "voiceover-report.json"


def run(*args: str) -> None:
    subprocess.run(args, check=True)


def probe(path: Path) -> dict[str, object]:
    return json.loads(
        subprocess.check_output(
            [
                "ffprobe",
                "-v",
                "error",
                "-show_streams",
                "-show_format",
                "-of",
                "json",
                str(path),
            ],
            text=True,
        )
    )


def duration(path: Path) -> float:
    return float(probe(path)["format"]["duration"])


def main() -> None:
    if not SILENT_MASTER.exists():
        raise FileNotFoundError(SILENT_MASTER)
    if not VOICEOVER.exists():
        raise FileNotFoundError(VOICEOVER)

    target_duration = duration(VOICEOVER)
    temporary = OUTPUT / "aisentica-persistent-self-demo-clean.mp4"

    # The picture comes from the subtitle-free silent master. The narration is
    # rebuilt as conventional 48 kHz stereo and cleaned before AAC encoding.
    # The 120 Hz high-pass removes the low-frequency whistle/hum reported on
    # mobile playback; adaptive FFT denoising suppresses the remaining floor.
    run(
        "ffmpeg",
        "-loglevel",
        "error",
        "-y",
        "-i",
        str(SILENT_MASTER),
        "-i",
        str(VOICEOVER),
        "-filter_complex",
        "[1:a]highpass=f=120:poles=2,afftdn=nr=14:nf=-32:tn=1:gs=6,"
        "lowpass=f=11000,loudnorm=I=-16:TP=-1.5:LRA=7,"
        "pan=stereo|c0=c0|c1=c0[a]",
        "-map",
        "0:v:0",
        "-map",
        "[a]",
        "-t",
        f"{target_duration:.6f}",
        "-c:v",
        "copy",
        "-c:a",
        "aac",
        "-ar",
        "48000",
        "-ac",
        "2",
        "-b:a",
        "192k",
        "-movflags",
        "+faststart",
        str(temporary),
    )
    temporary.replace(FINAL_VIDEO)

    final_probe = probe(FINAL_VIDEO)
    actual_duration = float(final_probe["format"]["duration"])
    video_streams = [
        stream for stream in final_probe["streams"] if stream["codec_type"] == "video"
    ]
    audio_streams = [
        stream for stream in final_probe["streams"] if stream["codec_type"] == "audio"
    ]
    subtitle_streams = [
        stream for stream in final_probe["streams"] if stream["codec_type"] == "subtitle"
    ]

    if not video_streams or not audio_streams:
        raise RuntimeError("Clean master must contain video and audio streams.")
    if subtitle_streams:
        raise RuntimeError("Clean master must not contain an embedded subtitle stream.")
    if not 120.0 <= actual_duration < 180.0:
        raise RuntimeError(f"Unexpected clean-master duration: {actual_duration:.3f}s")

    audio = audio_streams[0]
    if int(audio.get("sample_rate", 0)) != 48_000:
        raise RuntimeError(f"Unexpected sample rate: {audio.get('sample_rate')}")
    if int(audio.get("channels", 0)) != 2:
        raise RuntimeError(f"Unexpected channel count: {audio.get('channels')}")

    voice_report = json.loads(VOICE_REPORT.read_text(encoding="utf-8"))
    voice_report["voice"] = "AI Voice Generator crisp"
    voice_report["audioMastering"] = {
        "sampleRateHz": 48000,
        "channels": 2,
        "highPassHz": 120,
        "lowPassHz": 11000,
        "adaptiveFftDenoise": True,
        "integratedLoudnessLufs": -16,
        "truePeakDb": -1.5,
    }
    VOICE_REPORT.write_text(json.dumps(voice_report, indent=2) + "\n", encoding="utf-8")

    validation = json.loads(VALIDATION.read_text(encoding="utf-8"))
    validation.update(
        {
            "durationSeconds": round(actual_duration, 3),
            "videoCodec": video_streams[0].get("codec_name"),
            "audioCodec": audio.get("codec_name"),
            "audioSampleRateHz": 48000,
            "audioChannels": 2,
            "voice": "AI Voice Generator crisp",
            "burnedInSubtitles": False,
            "embeddedSubtitleStreams": 0,
            "externalSubtitleFile": "aisentica-persistent-self-demo.srt",
            "audioCleaned": True,
        }
    )
    VALIDATION.write_text(json.dumps(validation, indent=2) + "\n", encoding="utf-8")

    (OUTPUT / "final-ffprobe.txt").write_text(
        subprocess.check_output(
            ["ffprobe", "-v", "error", "-show_streams", "-show_format", str(FINAL_VIDEO)],
            text=True,
        ),
        encoding="utf-8",
    )

    print(json.dumps(validation, indent=2))


if __name__ == "__main__":
    main()
