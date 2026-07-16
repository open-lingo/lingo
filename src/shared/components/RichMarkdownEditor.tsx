import MDEditor from "@uiw/react-md-editor";
import rehypeSanitize from "rehype-sanitize";
import { useTheme } from "@/shared/contexts/ThemeContext";

type RichMarkdownEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: number;
  minHeight?: number;
};

/** Rich markdown editor with toolbar. Used in forum threads and replies. */
export function RichMarkdownEditor({
  value,
  onChange,
  placeholder,
  height = 200,
  minHeight = 120,
}: RichMarkdownEditorProps) {
  const { themeMode } = useTheme();

  return (
    <div data-color-mode={themeMode} className="[&_.w-md-editor]:rounded-lg [&_.w-md-editor-toolbar]:rounded-t-lg">
      <MDEditor
        value={value ?? ""}
        onChange={(v) => onChange(v ?? "")}
        height={height}
        minHeight={minHeight}
        visibleDragbar={true}
        textareaProps={{
          placeholder,
        }}
        preview="live"
        // The live preview runs @uiw/react-markdown-preview, which ships
        // rehype-raw (raw HTML passthrough) unsanitized. rehypeSanitize
        // strips scripts/event handlers so the preview can't execute
        // author-supplied HTML. The read-only viewer path (react-markdown)
        // is already safe and is untouched.
        previewOptions={{
          rehypePlugins: [[rehypeSanitize]],
        }}
      />
    </div>
  );
}
