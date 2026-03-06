import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";

const blocks = document.querySelectorAll("pre > code.language-mermaid");
const containers = [];
let renderVersion = 0;

function resolveMermaidTheme() {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "default";
}

function prepareMermaidBlocks() {
  blocks.forEach((block, index) => {
    const parent = block.parentElement;
    const wrapper = block.closest(".highlighter-rouge");
    if (!parent) {
      return;
    }

    const container = document.createElement("div");
    container.className = "mermaid";
    container.dataset.source = block.textContent || "";
    container.dataset.diagramId = "mermaid-diagram-" + index;

    (wrapper || parent).replaceWith(container);
    containers.push(container);
  });
}

async function renderMermaidBlocks() {
  const currentVersion = ++renderVersion;

  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "loose",
    theme: resolveMermaidTheme(),
  });

  await Promise.all(containers.map(async (container, index) => {
    const source = container.dataset.source;
    if (!source) {
      return;
    }

    try {
      const renderId = container.dataset.diagramId + "-" + renderVersion + "-" + index;
      const { svg, bindFunctions } = await mermaid.render(renderId, source);

      if (currentVersion !== renderVersion) {
        return;
      }

      container.classList.remove("mermaid--error");
      container.innerHTML = svg;

      if (typeof bindFunctions === "function") {
        bindFunctions(container);
      }
    } catch (error) {
      container.classList.add("mermaid--error");
      container.textContent = source;
      console.error(error);
    }
  }));
}

if (blocks.length > 0) {
  prepareMermaidBlocks();
  renderMermaidBlocks();
  window.addEventListener("themechange", () => {
    renderMermaidBlocks();
  });
}
