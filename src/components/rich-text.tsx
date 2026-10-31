import {
  PortableText,
  type PortableTextBlock,
  type PortableTextComponents,
} from "@portabletext/react";

const components: PortableTextComponents = {
  block: {
    normal: ({ children }) => (
      <p className="mt-3 text-sm leading-relaxed text-ink-soft first:mt-0">{children}</p>
    ),
    h2: ({ children }) => (
      <h3 className="mt-6 text-lg font-semibold tracking-tight text-ink first:mt-0">{children}</h3>
    ),
    h3: ({ children }) => (
      <h4 className="mt-5 text-base font-semibold tracking-tight text-ink first:mt-0">
        {children}
      </h4>
    ),
    blockquote: ({ children }) => (
      <blockquote className="mt-4 border-l-2 border-accent pl-4 text-sm italic leading-relaxed text-ink-soft">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-ink-soft">
        {children}
      </ul>
    ),
    number: ({ children }) => (
      <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-ink-soft">
        {children}
      </ol>
    ),
  },
  marks: {
    strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
    em: ({ children }) => <em>{children}</em>,
    link: ({ children, value }) => {
      const href = typeof value?.href === "string" ? value.href : null;
      if (!href) return <>{children}</>;
      const external = /^https?:\/\//.test(href);
      return (
        <a
          href={href}
          className="font-medium text-accent underline underline-offset-2 hover:text-accent-dark"
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {children}
        </a>
      );
    },
  },
};

export function RichText({ value }: { value: unknown[] | null | undefined }) {
  if (!value || value.length === 0) return null;
  return (
    <div>
      <PortableText value={value as PortableTextBlock[]} components={components} />
    </div>
  );
}
