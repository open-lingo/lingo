type PlainTextProps = {
  children: string;
  className?: string;
};

/** Renders plain text with newlines preserved. Use for card front/back/note etc. */
export function PlainText({ children, className = "" }: PlainTextProps) {
  if (children == null || children === "") return null;
  return (
    <span className={`whitespace-pre-wrap ${className}`.trim()}>
      {children}
    </span>
  );
}
