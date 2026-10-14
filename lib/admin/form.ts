import type { PackageComponent, SpecItem } from "../types";

/** Result of an admin form submission. `values` restores every field on failure. */
export interface AdminFormState {
  status: "idle" | "saved" | "error";
  message: string | null;
  errors: Record<string, string>;
  values: Record<string, string> | null;
  attempt: number;
  /** Row version after a successful save (optimistic concurrency token). */
  version?: string | null;
}

export const initialFormState: AdminFormState = { status: "idle", message: null, errors: {}, values: null, attempt: 0 };

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

/** Collects typed values and field errors from FormData. */
export class FormParser {
  errors: Record<string, string> = {};
  values: Record<string, string> = {};

  constructor(private fd: FormData) {
    for (const [k, v] of fd.entries()) if (typeof v === "string") this.values[k] = v;
  }

  private raw(name: string) {
    const v = this.fd.get(name);
    return typeof v === "string" ? v.replace(/\r\n?/g, "\n").trim() : "";
  }

  text(name: string, label: string, o: { max: number; required?: boolean; min?: number }): string | null {
    const v = this.raw(name);
    if (!v) {
      if (o.required) this.errors[name] = `${label} is required.`;
      return null;
    }
    if (o.min && v.length < o.min) this.errors[name] = `${label} must be at least ${o.min} characters.`;
    if (v.length > o.max) this.errors[name] = `${label} must be ${o.max} characters or fewer (currently ${v.length}).`;
    return v;
  }

  /** Required text that may be empty string (DB default ''). */
  body(name: string, label: string, max: number): string {
    return this.text(name, label, { max }) ?? "";
  }

  slug(name: string, fallbackFrom: string | null): string | null {
    const v = this.raw(name) || (fallbackFrom ? slugify(fallbackFrom) : "");
    if (!v) {
      // Nothing to derive it from: the missing name is reported instead.
      if (fallbackFrom) this.errors[name] = "Could not create a web address from the name. Enter one, e.g. hybrid-6kw-system.";
      return null;
    }
    if (!SLUG_RE.test(v) || v.length > 80) {
      this.errors[name] = "Use lowercase letters, numbers and single hyphens only (e.g. hybrid-6kw-system).";
      return null;
    }
    this.values[name] = v;
    return v;
  }

  sku(name: string): string | null {
    const v = this.raw(name).toUpperCase();
    if (!v) return null;
    if (!/^[A-Z0-9][A-Z0-9-]{1,39}$/.test(v)) this.errors[name] = "SKU: 2–40 characters, letters, numbers and hyphens.";
    return v;
  }

  number(name: string, label: string, o: { min?: number; max: number; required?: boolean; positive?: boolean }): number | null {
    const v = this.raw(name).replace(/[,₱\s]/g, "");
    if (!v) {
      if (o.required) this.errors[name] = `${label} is required.`;
      return null;
    }
    const n = Number(v);
    if (!Number.isFinite(n)) this.errors[name] = `${label} must be a number.`;
    else if (o.positive && n <= 0) this.errors[name] = `${label} must be greater than zero.`;
    else if ((o.min !== undefined && n < o.min) || n > o.max) this.errors[name] = `${label} must be between ${o.min ?? 0} and ${o.max}.`;
    else return Math.round(n * 100) / 100;
    return null;
  }

  bool(name: string): boolean {
    const v = this.fd.get(name);
    return v === "on" || v === "true" || v === "1";
  }

  choice<T extends string>(name: string, label: string, allowed: readonly T[], o: { required?: boolean } = {}): T | null {
    const v = this.raw(name);
    if (!v) {
      if (o.required) this.errors[name] = `Choose ${label.toLowerCase()}.`;
      return null;
    }
    if (!allowed.includes(v as T)) {
      this.errors[name] = `Choose a valid ${label.toLowerCase()}.`;
      return null;
    }
    return v as T;
  }

  date(name: string, label: string): string | null {
    const v = this.raw(name);
    if (!v) return null;
    if (!DATE_RE.test(v) || Number.isNaN(Date.parse(`${v}T00:00:00Z`))) {
      this.errors[name] = `${label} must be a valid date.`;
      return null;
    }
    return v;
  }

  /** One item per line. */
  lines(name: string, label: string, o: { maxItems: number; maxLen: number }): string[] {
    const items = this.raw(name)
      .split("\n")
      .map((l) => l.replace(/^[-•*]\s*/, "").trim())
      .filter(Boolean);
    if (items.length > o.maxItems) this.errors[name] = `${label}: at most ${o.maxItems} lines.`;
    const long = items.find((i) => i.length > o.maxLen);
    if (long) this.errors[name] = `${label}: each line must be ${o.maxLen} characters or fewer.`;
    return items;
  }

  /** "Label: value" per line. */
  specs(name: string): SpecItem[] {
    const out: SpecItem[] = [];
    const lines = this.raw(name).split("\n").map((l) => l.trim()).filter(Boolean);
    lines.forEach((line, i) => {
      const idx = line.indexOf(":");
      if (idx <= 0 || idx === line.length - 1) {
        this.errors[name] = `Line ${i + 1}: use the format "Label: value".`;
        return;
      }
      const label = line.slice(0, idx).trim().slice(0, 80);
      const value = line.slice(idx + 1).trim().slice(0, 200);
      out.push({ label, value });
    });
    if (out.length > 40) this.errors[name] = "At most 40 specification lines.";
    return out;
  }

  /** "Component | details | quantity" per line (quantity optional). */
  components(name: string): PackageComponent[] {
    const out: PackageComponent[] = [];
    const lines = this.raw(name).split("\n").map((l) => l.trim()).filter(Boolean);
    lines.forEach((line, i) => {
      const [label, detail, quantity] = line.split("|").map((s) => s.trim());
      if (!label || !detail) {
        this.errors[name] = `Line ${i + 1}: use "Component | details | quantity".`;
        return;
      }
      out.push({ label: label.slice(0, 80), detail: detail.slice(0, 200), quantity: quantity ? quantity.slice(0, 40) : null });
    });
    if (out.length > 20) this.errors[name] = "At most 20 components.";
    return out;
  }

  get ok() {
    return Object.keys(this.errors).length === 0;
  }
}

/** Turn a Postgres/PostgREST error into a staff-friendly message. */
export function dbErrorMessage(error: { code?: string; message?: string; details?: string } | null): { field?: string; message: string } {
  if (!error) return { message: "Unknown error." };
  if (error.code === "23505") {
    if (/slug/.test(`${error.message} ${error.details}`)) return { field: "slug", message: "This URL slug is already used by another item. Choose a different one." };
    if (/sku/.test(`${error.message} ${error.details}`)) return { field: "sku", message: "This SKU is already used by another item." };
    if (/cover/.test(`${error.message}`)) return { message: "Only one cover image is allowed." };
    return { message: "This value must be unique and is already in use." };
  }
  if (error.code === "23514") return { message: "Some values are not allowed by the database rules. Check prices, dates and required fields." };
  if (error.code === "23503") return { message: "This item is still referenced by other content (for example, products in this category)." };
  if (error.code === "42501") return { message: "You do not have permission to do this." };
  if (error.code === "P0001") return { message: error.message ?? "Not allowed." };
  return { message: "The database rejected the change. Please try again." };
}
