#!/usr/bin/env python3
from __future__ import annotations

import re
import sys
from datetime import datetime
from pathlib import Path

POSTS_DIR = Path("_posts")
NAME_RE = re.compile(r"^\d{4}-\d{2}-\d{2}-.+\.(md|markdown|mdown|mkdn)$")
DATE_RE = re.compile(r"^date:\s*(.+?)\s*$", re.IGNORECASE)
TITLE_RE = re.compile(r"^title:\s*(.+?)\s*$", re.IGNORECASE)


def parse_front_matter(text: str) -> list[str] | None:
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        return None

    for idx in range(1, len(lines)):
        if lines[idx].strip() == "---":
            return lines[1:idx]
    return None


def valid_date(value: str) -> bool:
    value = value.strip().strip('"').strip("'")
    candidates = [
        "%Y-%m-%d",
        "%Y-%m-%d %H:%M:%S %z",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d %H:%M %z",
        "%Y-%m-%d %H:%M",
    ]
    for fmt in candidates:
        try:
            datetime.strptime(value, fmt)
            return True
        except ValueError:
            continue
    return False


def main() -> int:
    if not POSTS_DIR.exists():
        print("No _posts directory found.")
        return 1

    files = sorted(POSTS_DIR.rglob("*.md"))
    if not files:
        print("No markdown posts found in _posts.")
        return 1

    errors: list[str] = []
    for file_path in files:
        name = file_path.name
        rel = file_path.as_posix()

        if not NAME_RE.match(name):
            errors.append(f"{rel}: invalid filename (expected YYYY-MM-DD-title.md)")

        text = file_path.read_text(encoding="utf-8")
        fm = parse_front_matter(text)
        if fm is None:
            errors.append(f"{rel}: missing or malformed YAML front matter")
            continue

        has_title = any(TITLE_RE.match(line) for line in fm)
        date_match = next((DATE_RE.match(line) for line in fm if DATE_RE.match(line)), None)

        if not has_title:
            errors.append(f"{rel}: missing title in front matter")

        if date_match is None:
            errors.append(f"{rel}: missing date in front matter")
        else:
            date_value = date_match.group(1)
            if not valid_date(date_value):
                errors.append(f"{rel}: invalid date format '{date_value}'")

    if errors:
        print("Post validation failed:")
        for err in errors:
            print(f"- {err}")
        return 1

    print(f"Post validation passed ({len(files)} files checked).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
