#!/usr/bin/env python
"""Helper script to inspect math asset generation for PDF output."""
import argparse
import os
import sys
from pathlib import Path

# Set dummy key if not provided
os.environ.setdefault('OPENAI_API_KEY', 'dummy-key')

ROOT = Path(__file__).resolve().parents[1]
SRC_DIR = ROOT / "src"
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

from routes.math_problem import generate_math_assets


def main() -> int:
    parser = argparse.ArgumentParser(description="Inspect PNG/SVG math asset generation.")
    parser.add_argument("--expression", required=True, help="LaTeX expression to render (without surrounding $)")
    parser.add_argument("--display", action="store_true", help="Render expression in display mode")
    parser.add_argument("--dpi", type=int, default=300, help="DPI used for rendering (default: 300)")
    args = parser.parse_args()

    assets = generate_math_assets(args.expression, display=args.display, dpi=args.dpi)
    if not assets:
        print("No assets were generated.")
        return 1

    png_buffer, width_pt, height_pt, drawing = assets
    print(f"PNG size: {width_pt:.2f}pt x {height_pt:.2f}pt")
    print(f"PNG bytes: {len(png_buffer.getvalue())}")
    if drawing is None:
        print("SVG drawing: not generated (falling back to PNG)")
    else:
        print("SVG drawing: available")
        print(f"  drawing width: {getattr(drawing, 'width', 'unknown')} pt")
        print(f"  drawing height: {getattr(drawing, 'height', 'unknown')} pt")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
