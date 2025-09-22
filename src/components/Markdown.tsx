// src/components/Markdown.tsx
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

export function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkBreaks]}
      components={{
        a: (props) => (
          <a
            {...props}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          />
        ),
        code: (props) => {
          // Cast to any so we can read `inline` safely across versions
          const { inline, className, children, ...rest } = props as any;
          if (inline) {
            return (
              <code
                className={`px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 ${className ?? ""}`}
                {...rest}
              >
                {children}
              </code>
            );
          }
          return (
            <pre className="p-3 rounded bg-black/10 dark:bg-white/10 overflow-x-auto">
              <code className={className} {...rest}>
                {children}
              </code>
            </pre>
          );
        },
        ul: (props) => <ul className="list-disc ml-5 space-y-1" {...props} />,
        ol: (props) => <ol className="list-decimal ml-5 space-y-1" {...props} />,
        p: (props) => <p className="mb-2" {...props} />,
      }}
    >
      {children}
    </ReactMarkdown>
  );
}