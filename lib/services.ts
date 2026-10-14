// Service copy based on the owner-confirmed scope: installation, consultancy
// and equipment distribution. No savings, payback or performance guarantees.
import type { IconName } from "@/components/ui/Icon";

export const services: { key: string; title: string; icon: IconName; body: string; href: string; cta: string }[] = [
  {
    key: "installation",
    title: "Solar installation",
    icon: "tools",
    body: "Supply, installation and commissioning of solar PV systems for homes, commercial buildings and industrial sites.",
    href: "/services#installation",
    cta: "How installation works",
  },
  {
    key: "consultancy",
    title: "Consultancy",
    icon: "bolt",
    body: "Advice on system type, sizing and equipment, from a first conversation to a written proposal.",
    href: "/services#consultancy",
    cta: "About consultancy",
  },
  {
    key: "equipment",
    title: "Equipment distribution",
    icon: "battery",
    body: "Panels, inverters, batteries, mounting hardware, cabling and protection devices for DIY buyers and professional installers.",
    href: "/products",
    cta: "Browse equipment",
  },
];

export const processSteps = [
  {
    title: "Assessment",
    body: "We review your electricity bills, loads and goals, then assess the roof or site to confirm what is feasible.",
  },
  {
    title: "Consultancy",
    body: "We explain on-grid, hybrid and off-grid options and the trade-offs, so the system matches how you use power.",
  },
  {
    title: "Proposal",
    body: "You receive a written proposal with the system design, equipment list, inclusions, exclusions and price.",
  },
  {
    title: "Installation",
    body: "Mounting, panels, inverter, batteries, cabling and protection devices are installed to the agreed design.",
  },
  {
    title: "Commissioning",
    body: "The system is tested, configured and handed over, with a walkthrough of how to monitor it.",
  },
  {
    title: "After-sales support",
    body: "Help with settings, troubleshooting and warranty coordination after handover. Terms are stated in your quotation.",
  },
] as const;

export const systemTypes = [
  {
    key: "on_grid",
    title: "On-grid",
    lead: "Lower daytime bills",
    body: "Solar power is used first and the grid covers the rest. No battery, so it does not provide power during an outage. Usually the simplest system.",
    suits: "Homes and businesses with high daytime use and a reliable grid.",
  },
  {
    key: "hybrid",
    title: "Hybrid",
    lead: "Savings plus backup",
    body: "Solar with a battery and a grid connection. Stored energy can run essential loads at night or during outages.",
    suits: "Homes and businesses that want backup power for outages.",
  },
  {
    key: "off_grid",
    title: "Off-grid",
    lead: "Independent power",
    body: "Solar and batteries with no grid connection. The system must be sized for every load and season, so assessment is essential.",
    suits: "Sites without a grid connection, or where a connection is impractical.",
  },
] as const;
