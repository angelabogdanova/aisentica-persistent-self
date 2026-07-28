#!/usr/bin/env python3
"""Synchronize recorded browser acts and proof scenes with the final voiceover."""

from __future__ import annotations

import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "video-output"
RAW = OUTPUT / "raw"
VOICE_REPORT = OUTPUT / "voiceover-report.json"
FINAL_VIDEO = OUTPUT / "aisentica-persistent-self-demo.mp4"

RAW_PARTS = {
    1: RAW / "01-intro-and-baseline.webm",
    2: RAW / "02-restoration-conflict-resolution.webm",
    3: RAW / "03-evidence-architecture-final.webm",
}


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


def render_segment(
    source: Path,
    target: Path,
    source_start: float,
    source_duration: float,
    target_duration: float,
) -> dict[str, float | str]:
    stretch = target_duration / source_duration
    run(
        "ffmpeg",
        "-loglevel",
        "error",
        "-y",
        "-ss",
        f"{source_start:.6f}",
        "-i",
        str(source),
        "-t",
        f"{source_duration:.6f}",
        "-an",
        "-vf",
        f"setpts={stretch:.12f}*PTS,fps=30,format=yuv420p",
        "-t",
        f"{target_duration:.6f}",
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-crf",
        "20",
        str(target),
    )
    return {
        "source": source.name,
        "sourceStartSeconds": round(source_start, 3),
        "sourceDurationSeconds": round(source_duration, 3),
        "targetDurationSeconds": round(target_duration, 3),
        "playbackFactor": round(stretch, 6),
    }


def main() -> None:
    voice_report = json.loads(VOICE_REPORT.read_text(encoding="utf-8"))
    part_targets = {
        int(part): float(seconds)
        for part, seconds in voice_report["partDurationsSeconds"].items()
    }
    clips = {str(clip["id"]): clip for clip in voice_report["clips"]}
    short_gap = float(voice_report["shortGapSeconds"])
    part_gap = float(voice_report["partGapSeconds"])

    part_videos: list[Path] = []
    timing_report: list[dict[str, object]] = []

    for part in (1, 2):
        source = RAW_PARTS[part]
        if not source.exists():
            raise FileNotFoundError(source)
        source_duration = duration(source)
        target_duration = part_targets[part]
        target = OUTPUT / f"video-part-{part}.mp4"
        timing = render_segment(source, target, 0.0, source_duration, target_duration)
        timing_report.append({"part": part, **timing})
        part_videos.append(target)

    # The final raw act contains three fixed scenes recorded in this order:
    # production evidence for 13 seconds, architecture for 18 seconds,
    # and the closing formula for the remaining duration. Each scene is
    # independently synchronized to its matching voice clip.
    proof_source = RAW_PARTS[3]
    proof_total = duration(proof_source)
    source_scenes = [
        ("proof", 0.0, 13.0, "06-proof", short_gap),
        ("architecture", 13.0, 18.0, "07-architecture", short_gap),
        ("final", 31.0, max(0.5, proof_total - 31.0), "08-final", part_gap),
    ]

    final_scene_videos: list[Path] = []
    scene_report: list[dict[str, object]] = []
    for index, (scene, start, source_duration, clip_id, gap) in enumerate(source_scenes, start=1):
        target_duration = float(clips[clip_id]["durationSeconds"]) + gap
        target = OUTPUT / f"video-part-3-{index:02d}-{scene}.mp4"
        timing = render_segment(
            proof_source,
            target,
            start,
            source_duration,
            target_duration,
        )
        final_scene_videos.append(target)
        scene_report.append({"scene": scene, "voiceClip": clip_id, **timing})

    part_three_concat = OUTPUT / "video-part-3-concat.txt"
    part_three_concat.write_text(
        "\n".join(f"file '{path.as_posix()}'" for path in final_scene_videos) + "\n",
        encoding="utf-8",
    )
    part_three = OUTPUT / "video-part-3.mp4"
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
        str(part_three_concat),
        "-an",
        "-c:v",
        "copy",
        str(part_three),
    )
    part_videos.append(part_three)
    timing_report.append(
        {
            "part": 3,
            "source": proof_source.name,
            "sourceDurationSeconds": round(proof_total, 3),
            "targetDurationSeconds": round(sum(float(scene["targetDurationSeconds"]) for scene in scene_report), 3),
            "scenes": scene_report,
        }
    )

    concat_file = OUTPUT / "video-concat.txt"
    concat_file.write_text(
        "\n".join(f"file '{path.as_posix()}'" for path in part_videos) + "\n",
        encoding="utf-8",
    )
    silent_master = OUTPUT / "silent-master.mp4"
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
        "-an",
        "-c:v",
        "copy",
        str(silent_master),
    )

    voiceover = OUTPUT / "voiceover.wav"
    subtitles = OUTPUT / "subtitles.srt"
    final_duration = duration(voiceover)
    subtitle_filter = (
        "subtitles="
        + subtitles.as_posix()
        + ":force_style='FontName=DejaVu Sans,FontSize=18,PrimaryColour=&H00FFFFFF,"
        + "OutlineColour=&HCC000000,BorderStyle=1,Outline=2,Shadow=1,MarginV=30,"
        + "Alignment=2'"
    )

    run(
        "ffmpeg",
        "-loglevel",
        "error",
        "-y",
        "-i",
        str(silent_master),
        "-i",
        str(voiceover),
        "-filter_complex",
        f"[0:v]{subtitle_filter}[v];[1:a]loudnorm=I=-16:TP=-1.5:LRA=8[a]",
        "-map",
        "[v]",
        "-map",
        "[a]",
        "-t",
        f"{final_duration:.6f}",
        "-c:v",
        "libx264",
        "-preset",
        "slow",
        "-crf",
        "19",
        "-pix_fmt",
        "yuv420p",
        "-r",
        "30",
        "-c:a",
        "aac",
        "-b:a",
        "192k",
        "-movflags",
        "+faststart",
        str(FINAL_VIDEO),
    )

    final_probe = probe(FINAL_VIDEO)
    actual_duration = float(final_probe["format"]["duration"])
    video_streams = [
        stream for stream in final_probe["streams"] if stream["codec_type"] == "video"
    ]
    audio_streams = [
        stream for stream in final_probe["streams"] if stream["codec_type"] == "audio"
    ]

    if not 120.0 <= actual_duration < 180.0:
        raise RuntimeError(f"Unexpected final duration: {actual_duration:.3f}s")
    if not video_streams or not audio_streams:
        raise RuntimeError("Final MP4 must contain both video and audio streams.")
    video_stream = video_streams[0]
    if (video_stream.get("width"), video_stream.get("height")) != (1920, 1080):
        raise RuntimeError(
            f"Unexpected resolution: {video_stream.get('width')}x{video_stream.get('height')}"
        )

    validation = {
        "durationSeconds": round(actual_duration, 3),
        "resolution": "1920x1080",
        "videoCodec": video_stream.get("codec_name"),
        "audioCodec": audio_streams[0].get("codec_name"),
        "belowThreeMinutes": True,
        "hasVideo": True,
        "hasAudio": True,
        "voice": voice_report["voice"],
        "voiceClipCount": voice_report["clipCount"],
        "parts": timing_report,
    }
    (OUTPUT / "final-validation.json").write_text(
        json.dumps(validation, indent=2) + "\n",
        encoding="utf-8",
    )
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
