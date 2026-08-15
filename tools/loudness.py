#!/usr/bin/env python
"""Measure a rendered file's loudness and compute the linear gain that brings
it to platform target loudness.

Decodes the audio with PyAV's bundled FFmpeg shared libraries (no system
ffmpeg needed) and measures with pyloudnorm's ITU-R BS.1770-4 meter. Prints
JSON, then the gain to apply as `10^(gain_dB/20)`.

  python tools/loudness.py out/stickman.mp4
"""
import json
import math
import sys

import av
import numpy as np
import pyloudnorm as pyln

TARGET_I = -14.0  # LUFS, what YouTube normalises toward
TARGET_TP = -1.5  # dBTP headroom left for the lossy encoder

def decode(path: str) -> tuple[np.ndarray, int]:
    """All audio from the file, as float64 (channels, samples) at native rate."""
    container = av.open(path)
    stream = container.streams.audio[0]
    chunks = []
    for frame in container.decode(stream):
        arr = frame.to_ndarray()
        if arr.ndim == 1:
            arr = arr[None, :]
        chunks.append(arr)
    audio = np.concatenate(chunks, axis=1)
    sample_rate = stream.rate or 48_000
    return audio.astype(np.float64), sample_rate

def main() -> None:
    path = sys.argv[1]
    audio, sr = decode(path)

    meter = pyln.Meter(sr)
    loudness = meter.integrated_loudness(audio.T)
    true_peak = float(np.abs(audio).max())
    peak_db = 20.0 * math.log10(true_peak) if true_peak > 0 else -99.0

    gain_i = TARGET_I - loudness
    gain_tp = TARGET_TP - peak_db
    gain = min(gain_i, gain_tp)
    gain = max(gain, -6.0)  # never punish the mix harder than that

    print(json.dumps({
        "integrated_lufs": round(loudness, 2),
        "true_peak_dbfs": round(peak_db, 2),
        "gain_db": round(gain, 2),
        "gain_linear": round(10 ** (gain / 20.0), 4),
        "target_i": TARGET_I,
        "target_tp": TARGET_TP,
    }, indent=2))

if __name__ == "__main__":
    main()
