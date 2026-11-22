interface CodeBlockProps {
  code: string;
  label?: string;
  variant?: "code" | "traceback";
  showLineNumbers?: boolean;
}

export function CodeBlock({
  code,
  label,
  variant = "code",
  showLineNumbers = true,
}: CodeBlockProps) {
  const lines = code.split("\n");
  const isTraceback = variant === "traceback";

  return (
    <div
      dir="ltr"
      className="overflow-hidden rounded-lg border text-left dd-theme-transition"
      style={{
        backgroundColor: "var(--dd-code-bg)",
        borderColor: "var(--dd-code-border)",
      }}
    >
      {label ? (
        <div
          className="flex items-center justify-between border-b px-3.5 py-2 text-xs font-medium"
          style={{
            backgroundColor: "var(--dd-code-header)",
            borderColor: "var(--dd-code-border)",
            color: isTraceback
              ? "var(--dd-code-error-text)"
              : "var(--dd-text-secondary)",
          }}
        >
          <span className="font-mono">{label}</span>
        </div>
      ) : null}

      <pre
        dir="ltr"
        className="overflow-x-auto p-3.5 text-[13px] leading-6 font-mono"
        style={{
          color: isTraceback
            ? "var(--dd-code-error-text)"
            : "var(--dd-code-text)",
        }}
      >
        <code dir="ltr" className="block">
          {lines.map((line, index) => (
            <div key={index} className="flex">
              {showLineNumbers && !isTraceback ? (
                <span
                  aria-hidden="true"
                  className="select-none pe-4 text-right tabular-nums"
                  style={{
                    color: "var(--dd-code-line-num)",
                    minWidth: "2.25rem",
                  }}
                >
                  {index + 1}
                </span>
              ) : null}
              <span className="whitespace-pre">{line || " "}</span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}
