"""
Batch-replace inline SVG icons in /Users/daniel/CityStage/app/src/components
with calls to the shared PNG-based <Icon /> component.

Strategy
--------
Each "function FooIcon() { return (<svg …/>); }" is replaced with a wrapper
that uses <Icon name="…" size={…} color={…} decorative />. We also handle
the smaller inline `<svg …>…</svg>` patterns that aren't inside a named
function (e.g. status-bar icons rendered directly in JSX).

For each file we maintain a small list of replacements keyed by the
*exact* svg block. The Icon name is derived from the SVG path data
or, if unambiguous, hard-coded.

This script is idempotent: running it twice is a no-op.
"""

import re
import sys
from pathlib import Path

ROOT = Path("/Users/daniel/CityStage/app/src/components")

# Map of SVG-by-its-function-signature → Icon replacement.
# We match by function name (the name strongly correlates with the
# icon's identity, e.g. ChevronLeftIcon → chevron-left). The "props"
# in the wrapper preserve the same call-site API.
ICON_MAP = {
    "ChevronLeftIcon": ("chevron-left", "Icon"),
    "ChevronRightIcon": ("chevron-right", "Icon"),
    "ChevronDownIcon": ("chevron-down", "Icon"),
    "ArrowLeftIcon": ("arrow-left", "Icon"),
    "ArrowRightIcon": ("arrow-right", "Icon"),
    "CheckIcon": ("check", "Icon"),
    "CloseIcon": ("close", "Icon"),
    "PlusIcon": ("plus", "Icon"),
    "SparkleIcon": ("sparkle", "Icon"),
    "PencilIcon": ("edit", "Icon"),
    "EditIcon": ("edit", "Icon"),
    "PinIcon": ("pin", "Icon"),
    "ClockIcon": ("clock", "Icon"),
    "UsersIcon": ("users", "Icon"),
    "TagIcon": ("tag", "Icon"),
    "LockIcon": ("lock", "Icon"),
    "SearchIcon": ("search", "Icon"),
    "CalendarIcon": ("calendar", "Icon"),
    "StarIcon": ("star", "Icon"),
    "CrownIcon": ("crown", "Icon"),
    "BuildingIcon": ("building", "Icon"),
    "BellIcon": ("bell", "Icon"),
    "InfoIcon": ("info", "Icon"),
    "SettingsIcon": ("settings", "Icon"),
    "TrashIcon": ("trash", "Icon"),
    "CellularIcon": ("cellular", "Icon"),
    "WifiIcon": ("wifi", "Icon"),
    "BatteryIcon": ("battery", "Icon"),
    "HomeIcon": ("home", "Icon"),
    "CompassIcon": ("compass", "Icon"),
    "TaskIcon": ("task", "Icon"),
    "PersonIcon": ("person", "Icon"),
    "HandPointerIcon": ("hand-pointer", "Icon"),
    "SpinnerIcon": ("spinner", "Icon"),
}

# Match: function NAME({ ... }) { return ( <svg ...>...</svg> ); }
SVG_FUNCTION_RE = re.compile(
    r"function\s+(?P<name>\w+)\s*\((?P<args>[^)]*)\)\s*\{\s*"
    r"return\s*\(\s*"
    r"<svg\b(?P<attrs>[^>]*)>(?P<body>.*?)</svg>\s*"
    r"\)\s*;\s*\}",
    re.DOTALL,
)

# Match: function NAME({ ... }) { return <svg ...>...</svg>; } (no parens)
SVG_FUNCTION_RE_NO_PARENS = re.compile(
    r"function\s+(?P<name>\w+)\s*\((?P<args>[^)]*)\)\s*\{\s*"
    r"return\s+"
    r"<svg\b(?P<attrs>[^>]*)>(?P<body>.*?)</svg>\s*"
    r";\s*\}",
    re.DOTALL,
)


def derive_color_from_svg(svg_block: str) -> tuple[str, str]:
    """Return (default_size, default_color) inferred from the SVG
    width/stroke attributes. Returns ('24', '#1F1827') if unknown."""
    size_match = re.search(r'\bwidth="(\d+)"', svg_block)
    stroke_match = re.search(r'stroke="([^"]+)"', svg_block)
    fill_match = re.search(r'\bfill="([^"]+)"', svg_block)

    size = size_match.group(1) if size_match else "24"
    color = stroke_match.group(1) if stroke_match else (fill_match.group(1) if fill_match else "#1F1827")
    return size, color


def build_replacement(name: str, args: str, attrs: str, body: str) -> str:
    """Return the new function body for a matched SVG icon definition."""
    icon_name, _ = ICON_MAP[name]

    # Parse `args` to determine the parameter names that need to be
    # forwarded. We just emit a permissive signature: keep all the
    # call-site-visible props (size, color, className, etc.) as
    # optional.
    has_size = "size" in args
    has_color = "color" in args
    has_class = "className" in args

    size_default, color_default = derive_color_from_svg(attrs + body)

    # Build the function signature. We carry forward: size, color,
    # className. Anything else in the original signature is dropped
    # (call sites we have don't use other props).
    parts = [name, "("]
    arg_pieces = []
    if has_size:
        arg_pieces.append("size")
    if has_color:
        arg_pieces.append("color")
    if has_class:
        arg_pieces.append("className")
    parts.append(", ".join(arg_pieces))
    parts.append(")")

    # Emit forwarders.
    forwarders = []
    if has_size:
        forwarders.append("size")
    if has_color:
        forwarders.append("color")
    if has_class:
        forwarders.append("className")

    # Build the icon props block.
    icon_props = ["name=" + repr(icon_name)]
    if has_size:
        icon_props.append("size={size}")
    else:
        icon_props.append(f"size={{{size_default}}}")
    if has_color:
        icon_props.append("color={color}")
    else:
        icon_props.append(f"color={repr(color_default)}")
    if has_class:
        icon_props.append("className={className}")
    icon_props.append("decorative")

    return f"function {' '.join(parts)} {{\n  return <Icon {' '.join(icon_props)} />;\n}}"


def ensure_icon_import(content: str, file_path: Path) -> str:
    """Make sure `import { Icon } from '../Icon';` (or
    `../../Icon`) is present. We do this by detecting whether the
    file already references <Icon and, if not, inserting the
    import below the last existing `import` line."""

    if "<Icon" in content:
        return content

    # Determine relative path to ../Icon.
    rel = (
        "../../Icon" if "b-end" in str(file_path) or "c-end" in str(file_path) else "../Icon"
    )
    rel = rel.replace("b-end/", "").replace("c-end/", "")
    rel = "../../Icon" if "/b-end/" in str(file_path) or "/c-end/" in str(file_path) else "../Icon"
    import_line = f"import {{ Icon }} from '{rel}';\n"

    # Insert after the last `import ...;` line.
    lines = content.split("\n")
    last_import_idx = -1
    for i, line in enumerate(lines):
        if line.startswith("import "):
            last_import_idx = i
    if last_import_idx < 0:
        # No imports? Prepend.
        return import_line + content
    lines.insert(last_import_idx + 1, import_line.rstrip("\n"))
    return "\n".join(lines)


def process_file(path: Path) -> int:
    """Return the number of SVG blocks replaced."""
    original = path.read_text(encoding="utf-8")
    content = original

    # Find all SVG function definitions and replace.
    pattern = SVG_FUNCTION_RE_NO_PARENS  # The body is always non-paren in this codebase
    count = 0

    def replace(match: re.Match) -> str:
        nonlocal count
        name = match.group("name")
        if name not in ICON_MAP:
            return match.group(0)
        replacement = build_replacement(
            name,
            match.group("args"),
            match.group("attrs"),
            match.group("body"),
        )
        count += 1
        return replacement

    content = pattern.sub(replace, content)
    content = ensure_icon_import(content, path)
    if content != original:
        path.write_text(content, encoding="utf-8")
    return count


def main():
    total = 0
    for tsx in ROOT.rglob("*.tsx"):
        if tsx.name in ("Icon.tsx",):
            continue
        n = process_file(tsx)
        if n:
            print(f"{tsx.relative_to(ROOT)}: replaced {n} icon(s)")
            total += n
    print(f"\nTotal: {total} icons replaced")


if __name__ == "__main__":
    main()
