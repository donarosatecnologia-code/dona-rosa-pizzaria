import { ElementType } from "react";

interface RichTextProps {
  content: string;
  className?: string;
  as?: ElementType;
  inline?: boolean;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function hasHtml(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

function sanitizeRichTextHtml(value: string) {
  if (typeof document === "undefined") {
    return value;
  }

  const allowedTags = new Set([
    "p",
    "div",
    "br",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "ul",
    "ol",
    "li",
    "h1",
    "h2",
    "h3",
    "h4",
  ]);
  const template = document.createElement("template");
  template.innerHTML = value;

  function clean(node: Node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      const tag = element.tagName.toLowerCase();

      if (!allowedTags.has(tag)) {
        const parent = element.parentNode;
        if (!parent) return;
        while (element.firstChild) {
          parent.insertBefore(element.firstChild, element);
        }
        parent.removeChild(element);
        return;
      }

      for (const attr of Array.from(element.attributes)) {
        element.removeAttribute(attr.name);
      }
    }

    for (const child of Array.from(node.childNodes)) {
      clean(child);
    }
  }

  clean(template.content);
  return template.innerHTML;
}

function toInlineHtml(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (hasHtml(trimmed)) {
    return sanitizeRichTextHtml(trimmed)
      .replace(/^<p[^>]*>/i, "")
      .replace(/<\/p>\s*$/i, "")
      .replace(/<\/p>\s*<p[^>]*>/gi, "<br />");
  }
  return escapeHtml(trimmed).replace(/\n/g, "<br />");
}

function toBlockHtml(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (hasHtml(trimmed)) return sanitizeRichTextHtml(trimmed);

  const paragraphs = trimmed.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean);
  if (paragraphs.length === 0) return "";
  if (paragraphs.length === 1) {
    const part = paragraphs[0];
    const lines = part.split(/\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length > 1) {
      return lines.map((line) => `<p>${escapeHtml(line)}</p>`).join("");
    }
  }
  return paragraphs
    .map((part) => `<p>${escapeHtml(part).replace(/\n/g, "<br />")}</p>`)
    .join("");
}

const RichText = ({ content, className, as: Tag = "div", inline = false }: RichTextProps) => {
  const html = inline ? toInlineHtml(content) : toBlockHtml(content);
  return <Tag className={`rich-text-content ${className || ""}`} dangerouslySetInnerHTML={{ __html: html }} />;
};

export default RichText;
