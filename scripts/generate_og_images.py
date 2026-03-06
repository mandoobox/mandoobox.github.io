from __future__ import annotations

import io
import re
import urllib.error
import urllib.request
from pathlib import Path

try:
    import yaml
    from PIL import Image, ImageDraw, ImageFont
except ImportError as exc:
    raise SystemExit(
        "Missing dependencies. Install with: python -m pip install pillow pyyaml"
    ) from exc


ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = ROOT / "_config.yml"
THEME_PATH = ROOT / "_data" / "theme.yml"
POSTS_DIR = ROOT / "_posts"
OG_DIR = ROOT / "assets" / "og"
POST_OG_DIR = OG_DIR / "posts"

WIDTH = 1200
HEIGHT = 630
PADDING = 60
MAX_TAGS_DISPLAY = 4
TITLE_LENGTH_THRESHOLD = 30

FONT_CANDIDATES = {
    "regular": [
        "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
        "/usr/share/fonts/opentype/noto/NotoSansCJKkr-Regular.otf",
        "/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc",
        "C:/Windows/Fonts/malgun.ttf",
        "C:/Windows/Fonts/segoeui.ttf",
        "/System/Library/Fonts/AppleSDGothicNeo.ttc",
        "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ],
    "bold": [
        "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc",
        "/usr/share/fonts/opentype/noto/NotoSansCJKkr-Bold.otf",
        "/usr/share/fonts/truetype/noto/NotoSansCJK-Bold.ttc",
        "C:/Windows/Fonts/malgunbd.ttf",
        "C:/Windows/Fonts/segoeuib.ttf",
        "/System/Library/Fonts/AppleSDGothicNeoB.ttc",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    ],
}

DEFAULT_OG = {
    "background_start": "#0f0f23",
    "background_mid": "#1a1a3e",
    "background_end": "#0f0f23",
    "accent_fill": "#23264b",
    "accent_border": "#4f5bb7",
    "accent_text": "#c7d2fe",
    "meta_text": "#8b93a7",
    "title_text": "#f8fafc",
    "subtitle_text": "#aab2c5",
    "tag_fill": "#1a1d31",
    "tag_border": "#2d334c",
    "tag_text": "#9ca3af",
    "footer_text": "#7a8195",
    "mark_start": "#6366f1",
    "mark_end": "#8b5cf6",
    "logo_mark": "",
    "avatar_path": "",
    "avatar_url": "",
}


def load_yaml(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as file:
        return yaml.safe_load(file) or {}


def load_front_matter(path: Path) -> tuple[dict, str]:
    content = path.read_text(encoding="utf-8")
    match = re.match(r"^---\s*\n(.*?)\n---\s*\n?(.*)$", content, re.DOTALL)
    if not match:
        return {}, content
    metadata = yaml.safe_load(match.group(1)) or {}
    body = match.group(2)
    return metadata, body


def slug_from_path(path: Path) -> str:
    stem = path.stem
    match = re.match(r"^\d{4}-\d{2}-\d{2}-(.+)$", stem)
    return match.group(1) if match else stem


def resolve_font(
    size: int,
    weight: str = "regular",
) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for candidate in FONT_CANDIDATES.get(weight, []):
        font_path = Path(candidate)
        if font_path.exists():
            return ImageFont.truetype(str(font_path), size=size)
    return ImageFont.load_default()


def measure(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.ImageFont) -> float:
    return draw.textlength(text, font=font)


def normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", (value or "").strip())


def short_url(value: str) -> str:
    return (value or "").replace("https://", "").replace("http://", "").rstrip("/")


def strip_markdown(value: str) -> str:
    text = value or ""
    text = re.sub(r"```.*?```", " ", text, flags=re.DOTALL)
    text = re.sub(r"~~~.*?~~~", " ", text, flags=re.DOTALL)
    text = re.sub(r"\$\$.*?\$\$", " ", text, flags=re.DOTALL)
    text = re.sub(r"\\\[.*?\\\]", " ", text, flags=re.DOTALL)
    text = re.sub(r"\\\(.*?\\\)", " ", text, flags=re.DOTALL)
    text = re.sub(r"\$[^$\n]+\$", " ", text)
    text = re.sub(r"!\[[^\]]*\]\([^)]+\)", " ", text)
    text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"`([^`]+)`", r"\1", text)
    text = re.sub(r"^\s{0,3}>\s?", "", text, flags=re.MULTILINE)
    text = re.sub(r"^\s{0,3}#{1,6}\s*", "", text, flags=re.MULTILINE)
    text = re.sub(r"^\s{0,3}[-*+]\s+", "", text, flags=re.MULTILINE)
    text = re.sub(r"^\s{0,3}\d+\.\s+", "", text, flags=re.MULTILINE)
    text = re.sub(r"^\s*\|.*\|\s*$", " ", text, flags=re.MULTILINE)
    text = re.sub(r"\*{1,2}([^*]+)\*{1,2}", r"\1", text)
    text = re.sub(r"_{1,2}([^_]+)_{1,2}", r"\1", text)
    text = re.sub(r"~{2}([^~]+)~{2}", r"\1", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def extract_excerpt(front_matter: dict, body: str) -> str:
    for key in ("description", "excerpt", "summary"):
        candidate = front_matter.get(key)
        if candidate:
            cleaned = strip_markdown(str(candidate))
            if cleaned:
                return cleaned

    paragraphs = re.split(r"\n\s*\n", body)
    for paragraph in paragraphs:
        cleaned = strip_markdown(paragraph)
        if len(cleaned) >= 30:
            return cleaned

    return strip_markdown(body)


def format_date(value: str) -> str:
    normalized = normalize_text(value)[:10]
    if re.match(r"^\d{4}-\d{2}-\d{2}$", normalized):
        return normalized
    return normalized


def normalize_tags(value) -> list[str]:
    if not value:
        return []
    if isinstance(value, str):
        candidates = [part.strip() for part in value.split(",")]
    elif isinstance(value, list):
        candidates = [normalize_text(str(item)) for item in value]
    else:
        candidates = [normalize_text(str(value))]

    result: list[str] = []
    seen = set()
    for candidate in candidates:
        if not candidate:
            continue
        lowered = candidate.lower()
        if lowered in seen:
            continue
        seen.add(lowered)
        result.append(candidate)
    return result


def wrap_text(
    draw: ImageDraw.ImageDraw,
    text: str,
    font: ImageFont.ImageFont,
    max_width: int,
    max_lines: int,
) -> list[str]:
    normalized = normalize_text(text)
    if not normalized:
        return []

    lines: list[str] = []
    current = ""

    for index, character in enumerate(normalized):
        candidate = current + character
        if not current or measure(draw, candidate, font) <= max_width:
            current = candidate
            continue

        lines.append(current.rstrip())
        if len(lines) == max_lines - 1:
            lines.append(
                ellipsize(draw, normalized[index:].lstrip(), font, max_width)
            )
            return lines

        current = "" if character.isspace() else character

    if current and len(lines) < max_lines:
        lines.append(current.rstrip())

    return lines[:max_lines]


def ellipsize(
    draw: ImageDraw.ImageDraw,
    text: str,
    font: ImageFont.ImageFont,
    max_width: int,
) -> str:
    value = normalize_text(text)
    if not value:
        return value
    while value and measure(draw, value + "...", font) > max_width:
        value = value[:-1].rstrip()
    return value + ("..." if value != normalize_text(text) else "")


def parse_hex_color(value: str) -> tuple[int, int, int]:
    color = value.lstrip("#")
    if len(color) != 6:
        return (0, 0, 0)
    return tuple(int(color[index:index + 2], 16) for index in (0, 2, 4))


def mix_colors(
    start: tuple[int, int, int],
    end: tuple[int, int, int],
    ratio: float,
) -> tuple[int, int, int]:
    ratio = max(0.0, min(1.0, ratio))
    return tuple(
        round(start[index] + (end[index] - start[index]) * ratio)
        for index in range(3)
    )


def gradient_color(stops: list[tuple[float, tuple[int, int, int]]], ratio: float) -> tuple[int, int, int]:
    if ratio <= stops[0][0]:
        return stops[0][1]
    for index in range(1, len(stops)):
        stop_ratio, stop_color = stops[index]
        prev_ratio, prev_color = stops[index - 1]
        if ratio <= stop_ratio:
            local_ratio = (ratio - prev_ratio) / (stop_ratio - prev_ratio)
            return mix_colors(prev_color, stop_color, local_ratio)
    return stops[-1][1]


def render_diagonal_gradient(og_theme: dict) -> Image.Image:
    start = parse_hex_color(og_theme["background_start"])
    mid = parse_hex_color(og_theme["background_mid"])
    end = parse_hex_color(og_theme["background_end"])
    image = Image.new("RGB", (WIDTH, HEIGHT))
    pixels = image.load()
    stops = [(0.0, start), (0.5, mid), (1.0, end)]

    scale = float(WIDTH + HEIGHT)
    for y in range(HEIGHT):
        for x in range(WIDTH):
            ratio = (x + y) / scale
            pixels[x, y] = gradient_color(stops, ratio)

    return image


def draw_chip(
    draw: ImageDraw.ImageDraw,
    x: int,
    y: int,
    text: str,
    font: ImageFont.ImageFont,
    fill: str,
    outline: str,
    color: str,
    radius: int,
    padding_x: int,
    padding_y: int,
) -> int:
    label = normalize_text(text)
    text_bbox = draw.textbbox((0, 0), label, font=font)
    text_width = text_bbox[2] - text_bbox[0]
    text_height = text_bbox[3] - text_bbox[1]
    height = text_height + padding_y * 2
    width = text_width + padding_x * 2
    draw.rounded_rectangle(
        (x, y, x + width, y + height),
        radius=radius,
        fill=fill,
        outline=outline,
        width=2,
    )
    draw.text(
        (x + padding_x - text_bbox[0], y + padding_y - text_bbox[1] - 1),
        label,
        font=font,
        fill=color,
    )
    return width


def draw_mark_circle(
    image: Image.Image,
    draw: ImageDraw.ImageDraw,
    x: int,
    y: int,
    size: int,
    mark: str,
    font: ImageFont.ImageFont,
    og_theme: dict,
) -> None:
    start = parse_hex_color(og_theme["mark_start"])
    end = parse_hex_color(og_theme["mark_end"])
    gradient = Image.new("RGB", (size, size))
    pixels = gradient.load()
    scale = float(size * 2)
    for row in range(size):
        for col in range(size):
            ratio = (col + row) / scale
            pixels[col, row] = mix_colors(start, end, ratio)

    mask = Image.new("L", (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.ellipse((0, 0, size - 1, size - 1), fill=255)
    image.paste(gradient, (x, y), mask)

    text_bbox = draw.textbbox((0, 0), mark, font=font)
    text_width = text_bbox[2] - text_bbox[0]
    text_height = text_bbox[3] - text_bbox[1]
    draw.text(
        (
            x + (size - text_width) / 2 - text_bbox[0],
            y + (size - text_height) / 2 - text_bbox[1] - 1,
        ),
        mark,
        font=font,
        fill="#ffffff",
    )


def load_avatar_image(og_theme: dict) -> Image.Image | None:
    avatar_path = normalize_text(og_theme.get("avatar_path", ""))
    if avatar_path:
        local_path = Path(avatar_path)
        if not local_path.is_absolute():
            local_path = ROOT / avatar_path
        if local_path.exists():
            try:
                return Image.open(local_path).convert("RGBA")
            except OSError:
                pass

    avatar_url = normalize_text(og_theme.get("avatar_url", ""))
    if not avatar_url:
        return None

    try:
        with urllib.request.urlopen(avatar_url, timeout=10) as response:
            data = response.read()
        return Image.open(io.BytesIO(data)).convert("RGBA")
    except (urllib.error.URLError, OSError, ValueError):
        return None


def draw_avatar_circle(
    image: Image.Image,
    draw: ImageDraw.ImageDraw,
    avatar: Image.Image,
    x: int,
    y: int,
    size: int,
    border_color: str,
) -> None:
    side = min(avatar.width, avatar.height)
    left = (avatar.width - side) // 2
    top = (avatar.height - side) // 2
    square = avatar.crop((left, top, left + side, top + side)).resize(
        (size, size),
        Image.LANCZOS,
    )

    mask = Image.new("L", (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.ellipse((0, 0, size - 1, size - 1), fill=255)

    image.paste(square, (x, y), mask)
    draw.ellipse((x, y, x + size - 1, y + size - 1), outline=border_color, width=3)


def draw_post_card(
    site: dict,
    og_theme: dict,
    title: str,
    category: str = "",
    date: str = "",
    tags: list[str] | None = None,
    subtitle: str = "",
    avatar: Image.Image | None = None,
) -> Image.Image:
    image = render_diagonal_gradient(og_theme)
    draw = ImageDraw.Draw(image)

    meta_font = resolve_font(20, "bold")
    date_font = resolve_font(20, "regular")
    title_font = resolve_font(48 if len(title) > TITLE_LENGTH_THRESHOLD else 56, "bold")
    subtitle_font = resolve_font(24, "regular")
    tag_font = resolve_font(16, "regular")
    footer_font = resolve_font(24, "bold")
    mark_font = resolve_font(24, "bold")

    top_y = PADDING
    current_x = PADDING

    if category:
        current_x += draw_chip(
            draw,
            current_x,
            top_y,
            category,
            meta_font,
            og_theme["accent_fill"],
            og_theme["accent_border"],
            og_theme["accent_text"],
            radius=20,
            padding_x=20,
            padding_y=8,
        )
        current_x += 16

    if date:
        draw.text((current_x, top_y + 9), date, font=date_font, fill=og_theme["meta_text"])

    avatar_size = 72 if avatar is not None else 0
    content_x = PADDING + avatar_size + 24 if avatar_size else PADDING
    title_max_width = WIDTH - PADDING - content_x
    title_lines = wrap_text(draw, title, title_font, title_max_width, 4)
    title_y = 240
    if len(title_lines) >= 4:
        title_y = 200
    elif len(title_lines) == 3:
        title_y = 220

    line_height = title_font.size + 10
    title_block_height = max(len(title_lines), 1) * line_height

    if avatar is not None:
        avatar_y = title_y + max(0, (title_block_height - avatar_size) // 2 - 4)
        draw_avatar_circle(
            image,
            draw,
            avatar,
            PADDING,
            avatar_y,
            avatar_size,
            og_theme["tag_border"],
        )

    for index, line in enumerate(title_lines):
        draw.text(
            (content_x, title_y + index * line_height),
            line,
            font=title_font,
            fill=og_theme["title_text"],
        )

    content_bottom = title_y + len(title_lines) * line_height

    if subtitle:
        subtitle_lines = wrap_text(draw, subtitle, subtitle_font, WIDTH - PADDING - content_x, 2)
        subtitle_y = content_bottom + 18
        for index, line in enumerate(subtitle_lines):
            draw.text(
                (content_x, subtitle_y + index * (subtitle_font.size + 10)),
                line,
                font=subtitle_font,
                fill=og_theme["subtitle_text"],
            )
        content_bottom = subtitle_y + len(subtitle_lines) * (subtitle_font.size + 10)

    rendered_tags = (tags or [])[:MAX_TAGS_DISPLAY]
    if rendered_tags:
        tag_y = min(content_bottom + 28, HEIGHT - 170)
        tag_x = content_x
        for tag in rendered_tags:
            chip_width = draw_chip(
                draw,
                tag_x,
                tag_y,
                "#" + tag.strip(),
                tag_font,
                og_theme["tag_fill"],
                og_theme["tag_border"],
                og_theme["tag_text"],
                radius=14,
                padding_x=14,
                padding_y=6,
            )
            tag_x += chip_width + 10

    footer_y = HEIGHT - 84
    brand_text = normalize_text(site.get("title", "mandoobox"))
    draw.text((PADDING, footer_y), brand_text, font=footer_font, fill=og_theme["footer_text"])

    mark = og_theme.get("logo_mark") or brand_text[:1].upper() or "M"
    circle_size = 48
    circle_x = WIDTH - PADDING - circle_size
    circle_y = HEIGHT - 108
    draw_mark_circle(image, draw, circle_x, circle_y, circle_size, mark, mark_font, og_theme)

    return image


def collect_posts() -> list[dict]:
    posts: list[dict] = []
    for path in sorted(POSTS_DIR.rglob("*.md")):
        front_matter, body = load_front_matter(path)
        if not front_matter.get("title"):
            continue

        categories = front_matter.get("categories") or []
        if isinstance(categories, str):
            categories = [categories]

        tags = normalize_tags(front_matter.get("tags"))
        category = front_matter.get("category") or (categories[0] if categories else "")
        date_value = str(front_matter.get("date") or path.stem[:10])

        posts.append(
            {
                "title": normalize_text(str(front_matter["title"])),
                "slug": slug_from_path(path),
                "date": format_date(date_value),
                "category": normalize_text(str(category)) if category else "",
                "tags": tags,
                "excerpt": extract_excerpt(front_matter, body),
            }
        )
    return posts


def render_home_image(site: dict, og_theme: dict, posts: list[dict]) -> None:
    title = normalize_text(site.get("title", "mandoobox"))
    subtitle = normalize_text(site.get("description", title))

    seen_tags = []
    for post in posts:
        for tag in post.get("tags", []):
            if tag not in seen_tags:
                seen_tags.append(tag)
            if len(seen_tags) == MAX_TAGS_DISPLAY:
                break
        if len(seen_tags) == MAX_TAGS_DISPLAY:
            break

    image = draw_post_card(
        site=site,
        og_theme=og_theme,
        title=title,
        category="Home",
        date=short_url(site.get("url", "")),
        tags=seen_tags,
        subtitle=subtitle,
        avatar=load_avatar_image(og_theme),
    )
    OG_DIR.mkdir(parents=True, exist_ok=True)
    image.save(OG_DIR / "home.png", format="PNG", optimize=True)


def render_site_image(site: dict, og_theme: dict, posts: list[dict]) -> None:
    title = normalize_text(site.get("title", "mandoobox"))
    subtitle = normalize_text(site.get("description", title))
    categories = []
    for post in posts:
        category = post.get("category")
        if category and category not in categories:
            categories.append(category)
        if len(categories) == MAX_TAGS_DISPLAY:
            break

    image = draw_post_card(
        site=site,
        og_theme=og_theme,
        title=title,
        category="Site",
        date=short_url(site.get("url", "")),
        tags=categories,
        subtitle=subtitle,
        avatar=load_avatar_image(og_theme),
    )
    OG_DIR.mkdir(parents=True, exist_ok=True)
    image.save(OG_DIR / "site.png", format="PNG", optimize=True)


def render_post_image(site: dict, og_theme: dict, post: dict) -> None:
    image = draw_post_card(
        site=site,
        og_theme=og_theme,
        title=post["title"],
        category=post.get("category", ""),
        date=post.get("date", ""),
        tags=post.get("tags", []),
        subtitle="",
        avatar=load_avatar_image(og_theme),
    )
    POST_OG_DIR.mkdir(parents=True, exist_ok=True)
    image.save(POST_OG_DIR / f"{post['slug']}.png", format="PNG", optimize=True)


def main() -> None:
    site = load_yaml(CONFIG_PATH)
    theme = load_yaml(THEME_PATH)
    og_theme = dict(DEFAULT_OG)
    og_theme.update(theme.get("og", {}) or {})

    posts = collect_posts()

    render_home_image(site, og_theme, posts)
    render_site_image(site, og_theme, posts)

    for post in posts:
        render_post_image(site, og_theme, post)

    print(f"Generated OG images in {OG_DIR}")


if __name__ == "__main__":
    main()
