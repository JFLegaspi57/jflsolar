// Plain-language names for content blocks, so staff never need to know keys.

const STANDARD: Record<string, string> = {
  "about.intro": "About page — introduction",
  "about.history": "About page — our story",
  "about.mission": "About page — mission",
  "about.vision": "About page — vision",
  "about.founder": "About page — founder profile",
  "why.quality": "Why choose us — quality",
  "why.warranty": "Why choose us — warranty assistance",
  "why.support": "Why choose us — technical support",
  "why.after_sales": "Why choose us — after-sales",
};

const SECTION_NAMES: Record<string, string> = {
  about: "About page",
  why: "Why choose us (home page and About page)",
};

export function isStandardBlock(key: string) {
  return key in STANDARD;
}

export function placementLabel(key: string, section: string) {
  return STANDARD[key] ?? `${SECTION_NAMES[section] ?? section} — additional block`;
}

/** Public visibility in words, matching how the site actually behaves. */
export function visibilityLabel(published: boolean, claimStatus: string) {
  if (!published) return { text: "Hidden", tone: "hidden" as const };
  if (claimStatus !== "confirmed") return { text: "Preview only — awaiting confirmation", tone: "pending" as const };
  return { text: "Shown on the website", tone: "shown" as const };
}
