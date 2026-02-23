import { RichMarkdownEditor } from "@/shared/components/RichMarkdownEditor";

export function MarkdownEditor({
  value,
  onChange,
  placeholder,
  minRows = 6,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minRows?: number;
  id?: string;
}) {
  const height = Math.max(120, (minRows ?? 6) * 24);
  return (
    <RichMarkdownEditor
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      height={height}
      minHeight={120}
    />
  );
}
