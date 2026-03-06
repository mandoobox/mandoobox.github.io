(function () {
  function renderMath() {
    if (typeof window.renderMathInElement !== "function") {
      return;
    }

    var root = document.querySelector("main");
    if (!root) {
      return;
    }

    window.renderMathInElement(root, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "\\[", right: "\\]", display: true },
        { left: "$", right: "$", display: false },
        { left: "\\(", right: "\\)", display: false }
      ],
      ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code", "option"],
      ignoredClasses: ["mermaid", "language-mermaid"],
      throwOnError: false,
      strict: "ignore"
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderMath, { once: true });
    return;
  }

  renderMath();
})();
