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
        /* Remove fixed dimensions so CSS controls sizing */
        svg.removeAttribute("width");
        // svg.removeAttribute("height");
        svg.style.maxWidth = "100%";
        svg.style.height = "auto";
        svg.style.overflow = "visible";

        /* Pad the viewBox generously so text at edges is never
           clipped. kroki.io returns very tight viewBoxes that
           cut through descenders, ascenders and Korean glyphs. */
        var vb = svg.getAttribute("viewBox");
        if (vb) {
          var parts = vb.split(/[\s,]+/).map(Number);
          if (parts.length === 4 && parts.every(function (n) { return !isNaN(n); })) {
            var PAD = 30;
            parts[0] -= PAD;        // min-x
            parts[1] -= PAD;        // min-y
            parts[2] += PAD * 2;    // width
            parts[3] += PAD * 2;    // height
            svg.setAttribute("viewBox", parts.join(" "));
          }
        }

        /* Remove any internal clip-path that kroki.io embeds,
           which can independently clip node text at edges. */
        var clips = svg.querySelectorAll("clipPath");
        clips.forEach(function (cp) { cp.remove(); });
        var clipped = svg.querySelectorAll("[clip-path]");
        clipped.forEach(function (el) { el.removeAttribute("clip-path"); });
      }

      container.appendChild(wrap);
      container.classList.add("mermaid--loaded");
      container.classList.remove("mermaid--error");

      /* Attach zoom/pan behaviour */
      attachZoom(container, wrap);
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

  /* ── Zoom / Pan ── */
  var MIN_SCALE = 0.5;
  var MAX_SCALE = 4;
  var ZOOM_STEP = 0.15;

  function attachZoom(container, wrap) {
    var svg = wrap.querySelector("svg");
    if (!svg) return;

    var state = { scale: 1, panX: 0, panY: 0 };
    var dragging = false;
    var startX = 0, startY = 0, startPanX = 0, startPanY = 0;

    function applyTransform(smooth) {
      svg.style.transition = smooth ? "transform 150ms ease-out" : "none";
      svg.style.transform =
        "translate(" + state.panX + "px, " + state.panY + "px) scale(" + state.scale + ")";
    }

    function zoomAt(delta, cx, cy) {
      var rect = wrap.getBoundingClientRect();
      /* Cursor position relative to wrapper */
      var ox = cx - rect.left;
      var oy = cy - rect.top;

      var oldScale = state.scale;
      var newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, oldScale + delta));
      if (newScale === oldScale) return;

      /* Adjust pan so zoom centres on cursor */
      var ratio = newScale / oldScale;
      state.panX = ox - ratio * (ox - state.panX);
      state.panY = oy - ratio * (oy - state.panY);
      state.scale = newScale;
      applyTransform(false);
    }

    function resetZoom() {
      state.scale = 1;
      state.panX = 0;
      state.panY = 0;
      applyTransform(true);
    }

    /* ── Controls ── */
    var controls = document.createElement("div");
    controls.className = "mermaid__zoom-controls";
    controls.innerHTML =
      '<button class="mermaid__zoom-btn" data-zoom="in" title="확대">' +
        '<span class="material-symbols-outlined">add</span></button>' +
      '<button class="mermaid__zoom-btn" data-zoom="out" title="축소">' +
        '<span class="material-symbols-outlined">remove</span></button>' +
      '<button class="mermaid__zoom-btn" data-zoom="reset" title="원래 크기">' +
        '<span class="material-symbols-outlined">fit_screen</span></button>';
    container.appendChild(controls);

    controls.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-zoom]");
      if (!btn) return;
      var action = btn.dataset.zoom;
      if (action === "in") {
        zoomAt(ZOOM_STEP, wrap.getBoundingClientRect().width / 2, wrap.getBoundingClientRect().height / 2);
      } else if (action === "out") {
        zoomAt(-ZOOM_STEP, wrap.getBoundingClientRect().width / 2, wrap.getBoundingClientRect().height / 2);
      } else {
        resetZoom();
      }
    });

    /* ── Mouse wheel zoom ── */
    wrap.addEventListener("wheel", function (e) {
      e.preventDefault();
      var delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
      zoomAt(delta, e.clientX, e.clientY);
    }, { passive: false });

    /* ── Mouse drag pan ── */
    wrap.addEventListener("mousedown", function (e) {
      if (e.button !== 0) return;
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      startPanX = state.panX;
      startPanY = state.panY;
      wrap.classList.add("grabbing");
      container.classList.add("mermaid--panning");
      e.preventDefault();
    });

    document.addEventListener("mousemove", function (e) {
      if (!dragging) return;
      state.panX = startPanX + (e.clientX - startX);
      state.panY = startPanY + (e.clientY - startY);
      applyTransform(false);
    });

    document.addEventListener("mouseup", function () {
      if (!dragging) return;
      dragging = false;
      wrap.classList.remove("grabbing");
      container.classList.remove("mermaid--panning");
    });

    /* ── Touch pinch zoom + pan ── */
    var lastTouchDist = 0;
    var lastTouchCenter = null;

    wrap.addEventListener("touchstart", function (e) {
      if (e.touches.length === 2) {
        e.preventDefault();
        lastTouchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        lastTouchCenter = {
          x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          y: (e.touches[0].clientY + e.touches[1].clientY) / 2
        };
      } else if (e.touches.length === 1 && state.scale > 1) {
        dragging = true;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        startPanX = state.panX;
        startPanY = state.panY;
      }
    }, { passive: false });

    wrap.addEventListener("touchmove", function (e) {
      if (e.touches.length === 2 && lastTouchDist) {
        e.preventDefault();
        var dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        var delta = (dist - lastTouchDist) * 0.005;
        var cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        var cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        zoomAt(delta, cx, cy);
        lastTouchDist = dist;
      } else if (e.touches.length === 1 && dragging) {
        e.preventDefault();
        state.panX = startPanX + (e.touches[0].clientX - startX);
        state.panY = startPanY + (e.touches[0].clientY - startY);
        applyTransform(false);
      }
    }, { passive: false });

    wrap.addEventListener("touchend", function () {
      dragging = false;
      lastTouchDist = 0;
      lastTouchCenter = null;
    });

    /* ── Double-click reset ── */
    wrap.addEventListener("dblclick", function (e) {
      e.preventDefault();
      resetZoom();
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
