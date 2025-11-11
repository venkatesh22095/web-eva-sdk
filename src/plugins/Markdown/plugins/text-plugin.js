import marked from "marked";

// ✅ JSON check helper
function isJson(text) {
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
}

// ✅ Pretty JSON viewer
function renderJsonViewer(data) {
  return `<pre style="white-space: pre-wrap; font-family: monospace;">${JSON.stringify(
    data,
    null,
    2
  )}</pre>`;
}

function formatContent(content) {
  if (!content) return "";

  let formatted = content.replace(/\\n/g, "\n");
  formatted = formatted.replace(/\\([\\"])/g, "$1");
  // Only fix list items that are stuck on the same line when they appear at line starts.
  // This avoids breaking markdown tables that may contain "-" cells inside rows.
  formatted = formatted.replace(/(^|\n)(\d+\.\s+[^\n]*?)(?=(\n)?\d+\.\s+)/g, "$1$2\n");
  formatted = formatted.replace(/(^|\n)(-\s+[^\n]*?)(?=(\n)?-\s+)/g, "$1$2\n");

  return formatted;
}

const renderer = new marked.Renderer();

// --- Code blocks (with JSON handling) ---
renderer.code = function (code, language) {
  if (language === "json" || isJson(code)) {
    try {
      return renderJsonViewer(JSON.parse(code));
    } catch {
      return `<pre><code>${code}</code></pre>`;
    }
  }
  return `<pre><code>${code}</code></pre>`;
};

// --- Inline code ---
renderer.codespan = function (code) {
  return `<code>${code}</code>`;
};

// --- UL / OL ---
renderer.list = function (body, ordered) {
  if (ordered) {
    return `<ol style="padding:0px 0px 0px 20px; list-style:decimal;">${body}</ol>`;
  }
  return `<ul style="padding:0px 0px 0px 20px; list-style:disc;">${body}</ul>`;
};

// --- LI ---
renderer.listitem = function (text) {
  return `<li style="list-style:inherit; margin-bottom:0.5rem;">${text}</li>`;
};

// --- Links ---
renderer.link = function (href, title, text) {
  return `<a href="${href}" target="_blank" rel="noopener noreferrer" onclick="event.preventDefault(); window.open('${href}','_blank');">${text}</a>`;
};

// --- Images ---
renderer.image = function (href, title, text) {
  const titleAttr = title ? ` title="${title}"` : '';
  const altAttr = text ? ` alt="${text}"` : '';
  return `<img src="${href}"${titleAttr}${altAttr} style="max-width: 100%; max-height: 400px; height: auto; object-fit: contain; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />`;
};

// --- Tables ---
renderer.table = function (header, body) {
  return `<div class="table-wrapper"><table class="markdown-table">${header}${body}</table></div>`;
};

// ✅ Use setOptions (v2 API)
marked.setOptions({
  gfm: true,
  breaks: true,
  smartLists: true,
  smartypants: false,
  renderer,
});

export const textPlugin = {
  name: "text",
  priority: 1,
  canHandle: () => true,
  render: (content) => {
    const formattedContent = formatContent(content);
    return marked(formattedContent); // ✅ v2 API
  },
  renderText: (content) => {
    if (!content) return "";
    const formatted = formatContent(content);

    const tempElement = document.createElement("div");
    tempElement.innerHTML = formatted;
    return tempElement.textContent || tempElement.innerText || "";
  },
};
