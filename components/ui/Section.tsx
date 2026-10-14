import type { ReactNode } from "react";

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[76rem] px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>;
}

export function Section({
  children,
  className = "",
  tone = "white",
  id,
  labelledBy,
}: {
  children: ReactNode;
  className?: string;
  tone?: "white" | "muted" | "dark";
  id?: string;
  labelledBy?: string;
}) {
  const tones = {
    white: "bg-white",
    muted: "bg-steel-50 border-y border-steel-200",
    dark: "bg-steel-950 text-white on-dark",
  };
  return (
    <section id={id} aria-labelledby={labelledBy} className={`py-16 sm:py-20 lg:py-24 ${tones[tone]} ${className}`}>
      <Container>{children}</Container>
    </section>
  );
}

export function SectionHeading({
  id,
  eyebrow,
  title,
  intro,
  dark = false,
  as: Tag = "h2",
  className = "",
}: {
  id?: string;
  eyebrow?: string;
  title: ReactNode;
  intro?: ReactNode;
  dark?: boolean;
  as?: "h1" | "h2";
  className?: string;
}) {
  return (
    <div className={`max-w-3xl ${className}`}>
      {eyebrow && (
        <p className={`mb-4 flex items-center gap-3 text-sm font-semibold tracking-wide uppercase ${dark ? "text-gold-400" : "text-gold-800"}`}>
          <span className="rule-gold" aria-hidden="true" />
          {eyebrow}
        </p>
      )}
      <Tag
        id={id}
        className={`${Tag === "h1" ? "text-4xl sm:text-5xl" : "text-3xl sm:text-4xl"} font-extrabold ${dark ? "text-white" : "text-steel-950"}`}
      >
        {title}
      </Tag>
      {intro && <div className={`mt-4 text-lg ${dark ? "text-steel-200" : "text-steel-600"}`}>{intro}</div>}
    </div>
  );
}

/** Page header band used by inner pages. */
export function PageHeader({ eyebrow, title, intro, children }: { eyebrow?: string; title: ReactNode; intro?: ReactNode; children?: ReactNode }) {
  return (
    <div className="border-b border-steel-200 bg-steel-50">
      <Container className="py-12 sm:py-16">
        <SectionHeading as="h1" eyebrow={eyebrow} title={title} intro={intro} />
        {children && <div className="mt-6">{children}</div>}
      </Container>
    </div>
  );
}
