# MandooBox Jekyll Blog

GitHub Pages에 바로 배포할 수 있도록 Jekyll 구조로 재구성한 블로그입니다.

## Local build

```bash
bundle install
python -m pip install pillow pyyaml
python scripts/generate_og_images.py
bundle exec jekyll serve
```

정적 빌드만 확인하려면:

```bash
python scripts/generate_og_images.py
bundle exec jekyll build
```

## Open Graph images

If a page or post does not define `image` or `og_image`, `scripts/generate_og_images.py` creates a fallback OG image for it.
The GitHub Pages workflow also runs this step automatically before Jekyll builds the site.

## Mermaid

Markdown 코드블록에 `mermaid` 언어를 지정하면 자동 렌더링됩니다.

~~~markdown
```mermaid
flowchart TD
  A --> B
```
~~~

스크립트 로더: `assets/js/mermaid-init.js`
