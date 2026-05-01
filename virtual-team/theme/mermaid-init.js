(function () {
  function collectMermaidBlocks() {
    return Array.from(document.querySelectorAll("pre > code.language-mermaid"));
  }

  async function renderMermaid() {
    const blocks = collectMermaidBlocks();
    if (blocks.length === 0) {
      return;
    }

    try {
      const mermaid = await import("https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs");
      mermaid.default.initialize({
        startOnLoad: false,
        securityLevel: "loose",
        theme: document.documentElement.classList.contains("navy") ? "dark" : "default",
      });

      blocks.forEach((block) => {
        const container = document.createElement("div");
        container.className = "mermaid";
        container.textContent = block.textContent;
        block.parentElement.replaceWith(container);
      });

      await mermaid.default.run({ querySelector: ".mermaid" });
    } catch (error) {
      console.warn("Mermaid rendering failed; leaving diagrams as code blocks.", error);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderMermaid, { once: true });
  } else {
    renderMermaid();
  }
})();
