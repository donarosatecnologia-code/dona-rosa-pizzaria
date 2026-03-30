import { useEffect, useRef } from "react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  minHeightClassName?: string;
}

function sanitizeEditorHtml(value: string) {
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

function ToolbarButton({
  label,
  command,
  value,
  onAfterCommand,
}: {
  label: string;
  command: string;
  value?: string;
  onAfterCommand: () => void;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        document.execCommand(command, false, value);
        onAfterCommand();
      }}
      className="px-2 py-1 text-xs border border-input rounded bg-background hover:bg-muted transition-colors"
    >
      {label}
    </button>
  );
}

const RichTextEditor = ({ value, onChange, minHeightClassName = "min-h-[180px]" }: RichTextEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editorRef.current) return;
    const el = editorRef.current;
    if (document.activeElement === el) {
      return;
    }
    const sanitized = sanitizeEditorHtml(value || "");
    if (el.innerHTML !== sanitized) {
      el.innerHTML = sanitized;
    }
  }, [value]);

  function emitValue() {
    if (!editorRef.current) return;
    const nextValue = sanitizeEditorHtml(editorRef.current.innerHTML || "");
    onChange(nextValue);
  }

  function syncSanitizedToDom() {
    if (!editorRef.current) return;
    const nextValue = sanitizeEditorHtml(editorRef.current.innerHTML || "");
    if (editorRef.current.innerHTML !== nextValue) {
      editorRef.current.innerHTML = nextValue;
    }
    onChange(nextValue);
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        <ToolbarButton label="B" command="bold" onAfterCommand={emitValue} />
        <ToolbarButton label="I" command="italic" onAfterCommand={emitValue} />
        <ToolbarButton label="U" command="underline" onAfterCommand={emitValue} />
        <ToolbarButton label="• Lista" command="insertUnorderedList" onAfterCommand={emitValue} />
        <ToolbarButton label="1. Lista" command="insertOrderedList" onAfterCommand={emitValue} />
        <ToolbarButton label="H2" command="formatBlock" value="h2" onAfterCommand={emitValue} />
        <ToolbarButton label="H3" command="formatBlock" value="h3" onAfterCommand={emitValue} />
      </div>
      <div
        ref={editorRef}
        contentEditable
        className={`w-full rounded-lg border border-input bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${minHeightClassName}`}
        onInput={emitValue}
        onBlur={syncSanitizedToDom}
      />
      <p className="text-[11px] text-muted-foreground">
        Enter cria novo parágrafo. Use os botões para negrito, itálico e listas.
      </p>
    </div>
  );
};

export default RichTextEditor;
