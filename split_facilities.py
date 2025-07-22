#!/usr/bin/env python3
"""
Split a consolidated Seattle‑tennis‑facilities report into one markdown
file per facility.

Each facility starts with a single‑line title immediately followed by:
    Your First Serve of Information
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path
from typing import List, Tuple

# ────────────────────────────────────────────────────────────────────────────────
TITLE_ANCHOR = "Your First Serve of Information"


def slugify(title: str) -> str:
    """Return a filesystem‑safe, lowercase slug derived from *title*."""
    slug = re.sub(r"[ /]+", "_", title.lower())
    return re.sub(r"[^a-z0-9_-]", "", slug)


def extract_facilities(text: str) -> List[Tuple[str, str]]:
    """
    Return a list of (title, full_block_text) tuples.

    A facility block starts with a title line and the next line equals TITLE_ANCHOR.
    """
    pattern = re.compile(rf"(?m)^([^\n]+)\n{re.escape(TITLE_ANCHOR)}")
    matches = list(pattern.finditer(text))
    if not matches:
        raise ValueError(
            f"No facilities found. Expected '{TITLE_ANCHOR}' after each title."
        )

    facilities: List[Tuple[str, str]] = []
    for idx, match in enumerate(matches):
        title = match.group(1).strip()
        start = match.start(1)
        end = matches[idx + 1].start(1) if idx + 1 < len(matches) else len(text)
        block = text[start:end].rstrip()
        facilities.append((title, block))
    return facilities


def write_facility_files(
    facilities: List[Tuple[str, str]], output_dir: Path
) -> None:
    """Write each facility to *output_dir/<slug>.md* with a leading '## ' header."""
    output_dir.mkdir(parents=True, exist_ok=True)
    seen: dict[str, int] = {}

    for title, block in facilities:
        slug = slugify(title)
        if slug in seen:
            seen[slug] += 1
            slug = f"{slug}_{seen[slug]}"
        else:
            seen[slug] = 1

        filepath = output_dir / f"{slug}.md"
        markdown = f"## {title}\n\n{block[len(title):].lstrip()}\n"
        filepath.write_text(markdown, encoding="utf-8")
        print(f"✔︎  Wrote {filepath}")


# ────────────────────────────────────────────────────────────────────────────────
def main() -> None:
    parser = argparse.ArgumentParser(
        description=(
            "Convert a consolidated report of Seattle tennis facilities into "
            "individual markdown files."
        )
    )
    parser.add_argument("input_file", help="Path to the consolidated report file")
    parser.add_argument(
        "-o",
        "--output-dir",
        default="facility_pages",
        help="Destination directory (default: %(default)s)",
    )
    args = parser.parse_args()

    source_path = Path(args.input_file).expanduser().resolve()
    if not source_path.is_file():
        parser.error(f"Input file not found: {source_path}")

    text = source_path.read_text(encoding="utf-8")
    facilities = extract_facilities(text)
    write_facility_files(facilities, Path(args.output_dir))


if __name__ == "__main__":  # pragma: no cover
    main()
