import DOMPurify from "dompurify";

const HTML_TAG_RE = /<\/?[a-z][\s\S]*>/i;
const RICH_HTML_RE = /<(strong|b|em|i|a|h[1-6]|ul|ol|li|blockquote|code|pre)\b/i;
const TOKEN_RE = /(\[([^\]]+)\]\((https?:\/\/[^\s)]+|www\.[^\s)]+)\)|https?:\/\/[^\s<]+|www\.[^\s<]+|\*\*([^*]+)\*\*|__([^_]+)__|\*([^*]+?)\*|_([^_]+?)_)/g;
const HEADING_RE = /^(#{1,6})\s+(.*)$/;
const UL_RE = /^[-*]\s+(.*)$/;
const OL_RE = /^\d+\.\s+(.*)$/;
const QUOTE_RE = /^>\s?(.*)$/;
const RICH_TEXT_SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    "p",
    "br",
    "strong",
    "b",
    "em",
    "i",
    "a",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "ul",
    "ol",
    "li",
    "blockquote",
    "code",
    "pre"
  ],
  ALLOWED_ATTR: ["href", "target", "rel"],
  ALLOW_DATA_ATTR: false,
  ALLOWED_URI_REGEXP:
    /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i
};

function sanitizeRichHtml(value = "") {
  const unsafe = String(value || "").trim();
  if (!unsafe) return "";
  if (typeof window === "undefined") return unsafe;
  return DOMPurify.sanitize(unsafe, RICH_TEXT_SANITIZE_CONFIG);
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeUrl(url = "") {
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

function splitTrailingPunctuation(url = "") {
  const clean = url.replace(/[.,!?;:)\]]+$/g, "");
  const trailing = url.slice(clean.length);
  return { clean, trailing };
}

function anchor(label, href) {
  return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
}

function formatInline(text = "") {
  let out = "";
  let lastIdx = 0;
  let match;

  TOKEN_RE.lastIndex = 0;

  while ((match = TOKEN_RE.exec(text)) !== null) {
    out += escapeHtml(text.slice(lastIdx, match.index));

    // Markdown-style link: [label](url)
    if (match[2] && match[3]) {
      const url = normalizeUrl(match[3]);
      out += anchor(escapeHtml(match[2]), url);
      lastIdx = TOKEN_RE.lastIndex;
      continue;
    }

    const token = match[0];

    // Bare URL autolink
    if (/^(https?:\/\/|www\.)/i.test(token)) {
      const { clean, trailing } = splitTrailingPunctuation(token);
      const href = normalizeUrl(clean);
      out += anchor(escapeHtml(clean), href) + escapeHtml(trailing);
      lastIdx = TOKEN_RE.lastIndex;
      continue;
    }

    // Bold: **text** or __text__
    if (match[4] || match[5]) {
      out += `<strong>${escapeHtml(match[4] || match[5])}</strong>`;
      lastIdx = TOKEN_RE.lastIndex;
      continue;
    }

    // Italic: *text* or _text_
    if (match[6] || match[7]) {
      out += `<em>${escapeHtml(match[6] || match[7])}</em>`;
      lastIdx = TOKEN_RE.lastIndex;
      continue;
    }

    out += escapeHtml(token);
    lastIdx = TOKEN_RE.lastIndex;
  }

  out += escapeHtml(text.slice(lastIdx));
  return out;
}

function parseParagraph(lines = []) {
  const text = lines.join("\n").trim();
  if (!text) return "";

  // Support "_..._" blocks spanning multiple lines.
  if (
    ((text.startsWith("_") && text.endsWith("_")) ||
      (text.startsWith("*") && text.endsWith("*"))) &&
    text.length > 2
  ) {
    const inner = text.slice(1, -1).trim();
    return `<p><em>${formatInline(inner).replace(/\n/g, "<br />")}</em></p>`;
  }

  // Support "**...**" and "__...__" blocks spanning multiple lines.
  if (
    ((text.startsWith("**") && text.endsWith("**")) ||
      (text.startsWith("__") && text.endsWith("__"))) &&
    text.length > 4
  ) {
    const inner = text.slice(2, -2).trim();
    return `<p><strong>${formatInline(inner).replace(/\n/g, "<br />")}</strong></p>`;
  }

  return `<p>${formatInline(text).replace(/\n/g, "<br />")}</p>`;
}

function parseBlocks(raw = "") {
  const lines = raw.split("\n");
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      i += 1;
      continue;
    }

    const headingMatch = trimmed.match(HEADING_RE);
    if (headingMatch) {
      const level = Math.min(6, Math.max(1, headingMatch[1].length));
      blocks.push(`<h${level}>${formatInline(headingMatch[2].trim())}</h${level}>`);
      i += 1;
      continue;
    }

    if (QUOTE_RE.test(trimmed)) {
      const quoteLines = [];
      while (i < lines.length) {
        const m = lines[i].trim().match(QUOTE_RE);
        if (!m) break;
        quoteLines.push(m[1]);
        i += 1;
      }
      blocks.push(`<blockquote>${formatInline(quoteLines.join("\n")).replace(/\n/g, "<br />")}</blockquote>`);
      continue;
    }

    if (UL_RE.test(trimmed)) {
      const items = [];
      while (i < lines.length) {
        const m = lines[i].trim().match(UL_RE);
        if (!m) break;
        items.push(`<li>${formatInline(m[1].trim())}</li>`);
        i += 1;
      }
      blocks.push(`<ul>${items.join("")}</ul>`);
      continue;
    }

    if (OL_RE.test(trimmed)) {
      const items = [];
      while (i < lines.length) {
        const m = lines[i].trim().match(OL_RE);
        if (!m) break;
        items.push(`<li>${formatInline(m[1].trim())}</li>`);
        i += 1;
      }
      blocks.push(`<ol>${items.join("")}</ol>`);
      continue;
    }

    const paragraphLines = [];
    while (i < lines.length) {
      const current = lines[i].trimEnd();
      const currentTrimmed = current.trim();
      if (!currentTrimmed) break;
      if (
        HEADING_RE.test(currentTrimmed) ||
        QUOTE_RE.test(currentTrimmed) ||
        UL_RE.test(currentTrimmed) ||
        OL_RE.test(currentTrimmed)
      ) {
        break;
      }
      paragraphLines.push(current);
      i += 1;
    }
    blocks.push(parseParagraph(paragraphLines));
  }

  return blocks.join("");
}

function decodeHtmlEntities(value = "") {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function htmlToPlainText(html = "") {
  return decodeHtmlEntities(
    String(html)
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<li[^>]*>/gi, "- ")
      .replace(/<\/li>/gi, "\n")
      .replace(/<\/h[1-6]>/gi, "\n\n")
      .replace(/<\/blockquote>/gi, "\n\n")
      .replace(/<\/(strong|b|em|i|code|pre)>/gi, "")
      .replace(/<(strong|b|em|i|code|pre)[^>]*>/gi, "")
      .replace(/<[^>]+>/g, "")
  ).trim();
}

export function formatRichTextToHtml(content) {
  const raw = String(content || "").replace(/\r\n?/g, "\n").trim();
  if (!raw) return "";

  // If content is already rich HTML from CMS, render as-is.
  if (HTML_TAG_RE.test(raw)) {
    if (RICH_HTML_RE.test(raw)) return sanitizeRichHtml(raw);
    // Some entries are HTML wrappers around markdown-like text.
    return sanitizeRichHtml(parseBlocks(htmlToPlainText(raw)));
  }

  return sanitizeRichHtml(parseBlocks(raw));
}

export function richTextToPlainText(content) {
  const html = formatRichTextToHtml(content);
  return htmlToPlainText(html);
}

export function getRichTextPreview(content, maxChars = 140) {
  const plain = richTextToPlainText(content).replace(/\s+/g, " ").trim();
  if (!plain) return "";
  if (plain.length <= maxChars) return plain;
  return `${plain.slice(0, maxChars).trimEnd()}...`;
}
