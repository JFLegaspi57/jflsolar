import { formatCapacity } from "@/lib/pricing";

/** Inverter kW · Array kWp · Battery kWh, as a compact definition list. */
export function SpecRow({
  inverter,
  array,
  battery,
  dense = false,
}: {
  inverter: number | null;
  array: number | null;
  battery: number | null;
  dense?: boolean;
}) {
  const items = [
    { label: "Inverter", value: formatCapacity(inverter, "kW") },
    { label: "Solar array", value: formatCapacity(array, "kWp") },
    { label: "Battery", value: formatCapacity(battery, "kWh") },
  ];
  // All empty = system is sized after a site assessment (e.g. C&I packages).
  const allEmpty = items.every((i) => !i.value);
  return (
    <dl className={`grid grid-cols-3 divide-x divide-steel-200 rounded-[var(--radius-control)] border border-steel-200 bg-steel-50 ${dense ? "text-sm" : ""}`}>
      {items.map((i) => (
        <div key={i.label} className="min-w-0 px-2 py-2 sm:px-3">
          <dt className="truncate text-[0.68rem] font-semibold text-steel-600 uppercase sm:tracking-wide">{i.label}</dt>
          <dd className={`font-display font-bold tabular ${i.value ? "text-steel-950" : "text-steel-600"} ${dense ? "text-[0.95rem] sm:text-base" : "text-base sm:text-lg"}`}>
            {i.value ?? <span className="text-sm font-semibold">{allEmpty ? "After assessment" : "Not included"}</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}
