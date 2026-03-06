(function () {
  function resolveMode() {
    return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
  }

  function syncUtterancesTheme(container, mode) {
    var frame = document.querySelector(".utterances-frame");
    if (!container || !frame || !frame.contentWindow) {
      return;
    }

    var nextTheme = mode === "dark"
      ? container.dataset.themeDark
      : container.dataset.themeLight;

    if (!nextTheme) {
      return;
    }

    frame.contentWindow.postMessage({
      type: "set-theme",
      theme: nextTheme
    }, "https://utteranc.es");
  }

  function initComments() {
    var container = document.querySelector("[data-comments]");
    if (!container) {
      return;
    }

    function apply(mode) {
      syncUtterancesTheme(container, mode || resolveMode());
    }

    var observer = new MutationObserver(function () {
      apply(resolveMode());
    });

    observer.observe(container, {
      childList: true,
      subtree: true
    });

    window.addEventListener("themechange", function (event) {
      var nextMode = event.detail && event.detail.theme
        ? event.detail.theme
        : resolveMode();
      apply(nextMode);
    });

    apply(resolveMode());
    window.setTimeout(function () {
      apply(resolveMode());
    }, 800);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initComments, { once: true });
    return;
  }

  initComments();
})();
