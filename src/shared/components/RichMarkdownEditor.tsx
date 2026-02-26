import MDEditor from "@uiw/react-md-editor";
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
      />
    </div>
  );
}
