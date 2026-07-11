const ALLOWED_TAGS = new Set([
  "B",
  "STRONG",
  "I",
  "EM",
  "U",
  "INS",
  "S",
  "STRIKE",
  "DEL",
  "A",
  "CODE",
  "PRE",
  "BR",
]);

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(text: string): string {
  return escapeHtml(text).replace(/'/g, "&#39;");
}

function sanitizeNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return escapeHtml(node.textContent ?? "");
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return "";
  }

  const element = node as Element;
  const tag = element.tagName;

  if (tag === "SCRIPT" || tag === "STYLE") {
    return "";
  }

  if (!ALLOWED_TAGS.has(tag)) {
    return Array.from(element.childNodes).map(sanitizeNode).join("");
  }

  if (tag === "BR") {
    return "<br />";
  }

  if (tag === "A") {
    const href = element.getAttribute("href") ?? "";
    if (!/^https?:\/\//i.test(href)) {
      return Array.from(element.childNodes).map(sanitizeNode).join("");
    }

    const content = Array.from(element.childNodes).map(sanitizeNode).join("");
    return `<a href="${escapeAttr(href)}" target="_blank" rel="noopener noreferrer">${content}</a>`;
  }

  const content = Array.from(element.childNodes).map(sanitizeNode).join("");
  return `<${tag.toLowerCase()}>${content}</${tag.toLowerCase()}>`;
}

export function sanitizeTelegramHtml(html: string): string {
  const normalized = html.replace(/\n/g, "<br />");
  const doc = new DOMParser().parseFromString(`<div>${normalized}</div>`, "text/html");
  const root = doc.body.firstElementChild;

  if (!root) {
    return escapeHtml(html);
  }

  return Array.from(root.childNodes).map(sanitizeNode).join("");
}
