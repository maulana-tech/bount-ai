import type { ReactNode } from "react";

function parseInline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const re = /(\*\*(.+?)\*\*|`(.+?)`)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    if (match[1]?.startsWith("**")) {
      parts.push(<strong key={parts.length}>{match[2]}</strong>);
    } else if (match[3] !== undefined) {
      parts.push(
        <code key={parts.length} className="rounded bg-line/30 px-1 font-mono text-[13px]">
          {match[3]}
        </code>,
      );
    }
    last = re.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export function MarkdownText({ text }: { text: string }) {
  const lines = text.split("\n");
  const blocks: ReactNode[] = [];
  let inList: "ul" | "ol" | null = null;
  let listItems: ReactNode[] = [];

  const flushList = (key: string) => {
    if (inList === "ul") {
      blocks.push(<ul key={key} className="mb-3 list-disc space-y-1 pl-5 text-sm text-ink-muted">{listItems}</ul>);
    } else if (inList === "ol") {
      blocks.push(<ol key={key} className="mb-3 list-decimal space-y-1 pl-5 text-sm text-ink-muted">{listItems}</ol>);
    }
    listItems = [];
    inList = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    const hr = /^-{3,}$/.test(trimmed);
    const heading1 = trimmed.startsWith("# ") ? trimmed.slice(2) : null;
    const heading2 = trimmed.startsWith("## ") ? trimmed.slice(3) : null;
    const heading3 = trimmed.startsWith("### ") ? trimmed.slice(4) : null;
    const bullet = trimmed.match(/^[-*]\s+(.+)/);
    const numbered = trimmed.match(/^\d+\.\s+(.+)/);

    if (trimmed === "") {
      flushList(`list-${i}`);
      continue;
    }

    if (heading1) {
      flushList(`list-${i}`);
      blocks.push(
        <h1 key={i} className="mb-2 text-lg font-semibold tracking-tight">
          {parseInline(heading1)}
        </h1>,
      );
    } else if (heading2) {
      flushList(`list-${i}`);
      blocks.push(
        <h2 key={i} className="mb-2 text-base font-semibold tracking-tight">
          {parseInline(heading2)}
        </h2>,
      );
    } else if (heading3) {
      flushList(`list-${i}`);
      blocks.push(
        <h3 key={i} className="mb-2 text-sm font-semibold tracking-tight">
          {parseInline(heading3)}
        </h3>,
      );
    } else if (bullet) {
      inList = "ul";
      listItems.push(<li key={`li-${i}`}>{parseInline(bullet[1])}</li>);
    } else if (numbered) {
      inList = "ol";
      listItems.push(<li key={`li-${i}`}>{parseInline(numbered[1])}</li>);
    } else if (hr) {
      flushList(`list-${i}`);
      blocks.push(<hr key={i} className="my-3 border-line" />);
    } else {
      flushList(`list-${i}`);
      blocks.push(
        <p key={i} className="mb-2 text-sm leading-relaxed text-ink-muted">
          {parseInline(line)}
        </p>,
      );
    }
  }

  flushList("list-end");

  return <>{blocks}</>;
}
