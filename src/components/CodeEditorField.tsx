import {
  forwardRef,
  useRef,
  type TextareaHTMLAttributes,
  type UIEvent,
} from "react";
import { useI18n } from "@/src/i18n";

interface CodeEditorFieldProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "dir"> {
  id: string;
  value: string;
  filenameLabel?: string;
  invalid?: boolean;
}

export const CodeEditorField = forwardRef<
  HTMLTextAreaElement,
  CodeEditorFieldProps
>(function CodeEditorField(
  {
    id,
    value,
    filenameLabel = "main.py",
    invalid = false,
    rows = 10,
    className = "",
    onScroll,
    ...rest
  },
  ref
) {
  const { t } = useI18n();
  const lineGutterRef = useRef<HTMLDivElement | null>(null);

  const lines = value.length > 0 ? value.split("\n") : [""];
  const lineCount = Math.max(lines.length, rows);

  const handleScroll = (event: UIEvent<HTMLTextAreaElement>) => {
    if (lineGutterRef.current) {
      lineGutterRef.current.scrollTop = event.currentTarget.scrollTop;
    }
    if (onScroll) {
      onScroll(event);
    }
  };

  return (
    <div
      dir="ltr"
      className={`dd-code-editor-shell overflow-hidden rounded-lg border text-left dd-theme-transition ${className}`}
      style={{
        backgroundColor: "var(--dd-code-bg)",
        borderColor: invalid
          ? "var(--dd-danger-border)"
          : "var(--dd-code-border)",
      }}
    >
      <div
        className="flex items-center justify-between border-b px-3.5 py-2 text-xs font-medium"
        style={{
          backgroundColor: "var(--dd-code-header)",
          borderColor: "var(--dd-code-border)",
          color: "var(--dd-text-secondary)",
        }}
      >
        <span className="font-mono">{filenameLabel}</span>
        <span
          className="font-mono tabular-nums"
          style={{ color: "var(--dd-text-muted)" }}
        >
          {t.intake.linesCountLabel.replace("{count}", String(lines.length))}
        </span>
      </div>

      <div className="relative flex">
        <div
          ref={lineGutterRef}
          aria-hidden="true"
          className="w-11 shrink-0 select-none overflow-hidden border-r py-3 pr-2.5 text-right font-mono text-[13px] leading-6 tabular-nums"
          style={{
            backgroundColor: "var(--dd-code-header)",
            borderColor: "var(--dd-code-border)",
            color: "var(--dd-code-line-num)",
          }}
        >
          {Array.from({ length: lineCount }, (_, index) => (
            <div key={index}>{index + 1}</div>
          ))}
        </div>

        <textarea
          ref={ref}
          id={id}
          dir="ltr"
          value={value}
          rows={rows}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          onScroll={handleScroll}
          aria-invalid={invalid ? "true" : undefined}
          className="w-full resize-y bg-transparent px-3.5 py-3 font-mono text-[13px] leading-6 focus:outline-none"
          style={{
            color: "var(--dd-code-text)",
          }}
          {...rest}
        />
      </div>
    </div>
  );
});
