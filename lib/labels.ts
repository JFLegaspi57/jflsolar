import type {
  Availability,
  Fulfillment,
  PackageType,
  PricingMode,
  ProjectType,
  Status,
  SystemType,
} from "./types";

export const packageTypeLabel: Record<PackageType, string> = {
  installed_system: "Installed system",
  equipment_bundle: "Equipment only",
};

export const packageTypeHint: Record<PackageType, string> = {
  installed_system: "Supply, installation and commissioning by JFL Solar",
  equipment_bundle: "Equipment supply only — installation not included",
};

export const systemTypeLabel: Record<SystemType, string> = {
  on_grid: "On-grid",
  hybrid: "Hybrid",
  off_grid: "Off-grid",
};

export const fulfillmentLabel: Record<Fulfillment, string> = {
  installed: "Installed on site",
  pickup: "Pickup at warehouse",
  delivery: "Delivery",
  pickup_or_delivery: "Pickup or delivery",
  to_be_confirmed: "To be confirmed at quotation",
};

export const pricingModeLabel: Record<PricingMode, string> = {
  fixed: "Fixed price",
  starting: "Starting price",
  quote: "Request a quotation",
};

export const availabilityLabel: Record<Availability, string> = {
  available: "Available to order",
  on_request: "Ask about availability",
  preorder: "Available on pre-order",
  unavailable: "Currently unavailable",
};

export const projectTypeLabel: Record<ProjectType, string> = {
  residential: "Residential",
  commercial: "Commercial",
  industrial: "Industrial",
};

export const statusLabel: Record<Status, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

export const inquiryTypes = [
  { value: "residential", label: "Residential solar installation" },
  { value: "commercial", label: "Commercial or industrial installation" },
  { value: "consultancy", label: "Consultancy or site assessment" },
  { value: "equipment", label: "Equipment or product quotation" },
  { value: "package", label: "Package inquiry" },
  { value: "support", label: "After-sales or technical support" },
  { value: "other", label: "Something else" },
] as const;

export type InquiryType = (typeof inquiryTypes)[number]["value"];

export const billRanges = [
  { value: "", label: "Prefer not to say" },
  { value: "under-3k", label: "Below ₱3,000" },
  { value: "3k-5k", label: "₱3,000 – ₱5,000" },
  { value: "5k-10k", label: "₱5,000 – ₱10,000" },
  { value: "10k-20k", label: "₱10,000 – ₱20,000" },
  { value: "20k-50k", label: "₱20,000 – ₱50,000" },
  { value: "over-50k", label: "Above ₱50,000" },
  { value: "unsure", label: "Not sure" },
] as const;
