/**
 * mermaid-init.js
 *
 * Server-side Mermaid rendering via kroki.io.
 * Diagrams are rendered on a consistent server environment and delivered as
 * inline SVG, guaranteeing identical output on Windows / Mac / Linux.
 *
 * Features:
 *  - Skeleton loading animation while fetching
 *  - IntersectionObserver for viewport-based lazy loading
 *  - Concurrency limiter to avoid overwhelming the server
 *  - Retry with exponential back-off
 *  - Dark / light theme switching
 */

(function () {
  "use strict";

  var KROKI_URL = "https://kroki.io/mermaid/svg";
  var MAX_CONCURRENT = 4;
  var MAX_RETRIES = 2;
  var VIEWPORT_MARGIN = "200px";

  var blocks = document.querySelectorAll("pre > code.language-mermaid");
  if (blocks.length === 0) return;

  var containers = [];
  var activeRequests = 0;
  var queue = [];

  /* ── Theme ── */
  function resolveMermaidTheme() {
    return document.documentElement.dataset.theme === "dark" ? "dark" : "default";
  }

  /* ── Inject theme directive into Mermaid source ── */
  function injectTheme(source, theme) {
    var directive = "%%{init:{\"theme\":\"" + theme + "\"}}%%";
    /* Replace existing init directive or prepend */
    if (/^\s*%%\{/.test(source)) {
      return source.replace(/^\s*%%\{[^}]*\}%%/, directive);
    }
    return directive + "\n" + source;
  }

  /* ── Skeleton loader ── */
  function showSkeleton(container) {
    container.classList.remove("mermaid--loaded", "mermaid--error");
    container.classList.add("mermaid--loading");
    if (!container.querySelector(".mermaid__skeleton")) {
      var skel = document.createElement("div");
      skel.className = "mermaid__skeleton";
      skel.setAttribute("aria-hidden", "true");
      /* Three pulsing bars to indicate loading */
      skel.innerHTML =
        '<div class="mermaid__skeleton-bar" style="width:70%"></div>' +
        '<div class="mermaid__skeleton-bar" style="width:90%"></div>' +
        '<div class="mermaid__skeleton-bar" style="width:50%"></div>';
      container.appendChild(skel);
    }
  }

  function removeSkeleton(container) {
    container.classList.remove("mermaid--loading");
    var skel = container.querySelector(".mermaid__skeleton");
    if (skel) skel.remove();
  }

  /* ── Concurrency-limited fetch queue ── */
  function enqueue(fn) {
    if (activeRequests < MAX_CONCURRENT) {
      activeRequests++;
      fn().finally(function () {
        activeRequests--;
        if (queue.length > 0) {
          activeRequests++;
          queue.shift()().finally(function () {
            activeRequests--;
            drain();
          });
        }
      });
    } else {
      queue.push(fn);
    }
  }

  function drain() {
    while (queue.length > 0 && activeRequests < MAX_CONCURRENT) {
      activeRequests++;
      queue.shift()().finally(function () {
        activeRequests--;
        drain();
      });
    }
  }

  /* ── Fetch SVG from kroki.io via POST (no URL length limits) ── */
  function fetchSvg(source, retries) {
    if (typeof retries === "undefined") retries = 0;

    return fetch(KROKI_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: source,
    }).then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.text();
    }).catch(function (err) {
      if (retries < MAX_RETRIES) {
        var delay = Math.pow(2, retries) * 500;
        return new Promise(function (resolve) {
          setTimeout(resolve, delay);
        }).then(function () {
          return fetchSvg(source, retries + 1);
        });
      }
      throw err;
    });
  }

  /* ── Render a single container ── */
  function renderContainer(container) {
    var source = container.dataset.source;
    if (!source) return Promise.resolve();

    var theme = resolveMermaidTheme();
    var themedSource = injectTheme(source, theme);

    showSkeleton(container);

    return fetchSvg(themedSource).then(function (svgText) {
      removeSkeleton(container);
      /* Remove any previous content */
      var existing = container.querySelector(".mermaid__svg-wrap");
      if (existing) existing.remove();

      var wrap = document.createElement("div");
      wrap.className = "mermaid__svg-wrap";
      wrap.innerHTML = svgText;

      /* Normalise the SVG for responsive display */
      var svg = wrap.querySelector("svg");
      if (svg) {
        svg.removeAttribute("height");
        svg.style.maxWidth = "100%";
        svg.style.height = "auto";
      }

      container.appendChild(wrap);
      container.classList.add("mermaid--loaded");
      container.classList.remove("mermaid--error");
    }).catch(function () {
      removeSkeleton(container);
      container.classList.add("mermaid--error");
      container.classList.remove("mermaid--loaded");
      /* Show source as fallback */
      var existing = container.querySelector(".mermaid__svg-wrap");
      if (existing) existing.remove();
      var pre = document.createElement("pre");
      pre.className = "mermaid__fallback";
      pre.textContent = source;
      container.appendChild(pre);
    });
  }

  /* ── Replace code blocks with containers ── */
  function prepareMermaidBlocks() {
    Array.prototype.forEach.call(blocks, function (block) {
      var parent = block.parentElement;
      var wrapper = block.closest(".highlighter-rouge");
      if (!parent) return;

      var container = document.createElement("div");
      container.className = "mermaid";
      container.dataset.source = block.textContent || "";

      (wrapper || parent).replaceWith(container);
      containers.push(container);
    });
  }

  /* ── IntersectionObserver: only render when near viewport ── */
  function observeContainers() {
    if (!("IntersectionObserver" in window)) {
      /* Fallback: render everything immediately */
      containers.forEach(function (c) {
        enqueue(function () { return renderContainer(c); });
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            observer.unobserve(entry.target);
            enqueue(function () { return renderContainer(entry.target); });
          }
        });
      },
      { rootMargin: VIEWPORT_MARGIN }
    );

    containers.forEach(function (c) { observer.observe(c); });
  }

  /* ── Theme change handler ── */
  function onThemeChange() {
    /* Re-render all already-loaded diagrams */
    containers.forEach(function (container) {
      if (container.classList.contains("mermaid--loaded") ||
          container.classList.contains("mermaid--error")) {
        enqueue(function () { return renderContainer(container); });
      }
    });
  }

  /* ── Init ── */
  prepareMermaidBlocks();
  observeContainers();
  window.addEventListener("themechange", onThemeChange);
})();
