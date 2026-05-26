import ReactMarkdown from "react-markdown";

type MarkdownRendererProps = {
  children: string;
  className?: string;
};

/** Renders markdown for card content (front, back, note, reasoning). Plain text passes through. */
export function MarkdownRenderer({ children, className = "" }: MarkdownRendererProps) {
  const text = children ?? "";
  if (!text.trim()) return null;

  return (
    // dark:prose-invert is intentional — @tailwindcss/typography requires it for .dark class prose
    <div
      className={`prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-img:max-w-full prose-img:h-auto ${className}`}
    >
      <ReactMarkdown
        components={{
          img: ({ src, alt, ...props }) => {
            if (!src) return null;
            if (src.startsWith("javascript:") || src.startsWith("data:")) return null;
            return <img src={src} alt={alt ?? ""} loading="lazy" {...props} />;
          },
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
