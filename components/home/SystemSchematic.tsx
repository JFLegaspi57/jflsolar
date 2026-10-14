/**
 * Line-drawn hybrid PV system schematic for the home hero. Illustrative only —
 * not a photo and not a specific JFL installation.
 */
export function SystemSchematic({ className = "" }: { className?: string }) {
  const line = "rgb(255 255 255 / 0.55)";
  const faint = "rgb(255 255 255 / 0.18)";
  const gold = "#ffb004";
  return (
    <svg
      viewBox="0 0 520 400"
      role="img"
      aria-labelledby="schematic-title"
      className={className}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <title id="schematic-title">
        Diagram of a hybrid solar system: the solar array feeds an inverter, which supplies the building, charges a battery and connects to the grid.
      </title>

      {/* Sun */}
      <g stroke={gold} strokeWidth="2">
        <circle cx="64" cy="52" r="16" />
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i * Math.PI) / 4;
          return <path key={i} d={`M${64 + Math.cos(a) * 24} ${52 + Math.sin(a) * 24}L${64 + Math.cos(a) * 31} ${52 + Math.sin(a) * 31}`} />;
        })}
      </g>

      {/* PV array */}
      <g stroke={line} strokeWidth="1.5">
        <path d="M108 150 132 70h170l24 80Z" />
        <path d="M120 110h194M114 130h206M174 70l-10 80M232 70l4 80M290 70l18 80" stroke={faint} />
      </g>
      <text x="108" y="176" fill="white" fontSize="13" fontWeight="700" fontFamily="var(--font-display)">SOLAR ARRAY</text>
      <text x="108" y="193" fill="rgb(255 255 255 / 0.7)" fontSize="12" fontFamily="var(--font-sans)">capacity in kWp</text>

      {/* Inverter */}
      <g stroke={line} strokeWidth="1.5">
        <rect x="238" y="214" width="64" height="84" rx="6" />
        <rect x="252" y="230" width="36" height="18" rx="2" stroke={gold} />
        <path d="M254 280h8M266 280h8M278 280h8" stroke={faint} />
      </g>
      <text x="238" y="320" fill="white" fontSize="13" fontWeight="700" fontFamily="var(--font-display)">INVERTER</text>
      <text x="238" y="337" fill="rgb(255 255 255 / 0.7)" fontSize="12" fontFamily="var(--font-sans)">rating in kW</text>

      {/* Battery */}
      <g stroke={line} strokeWidth="1.5">
        <rect x="96" y="250" width="62" height="78" rx="6" />
        <path d="M117 244h20v6h-20zM127 274v22M116 285h22" />
      </g>
      <text x="96" y="350" fill="white" fontSize="13" fontWeight="700" fontFamily="var(--font-display)">BATTERY</text>
      <text x="96" y="367" fill="rgb(255 255 255 / 0.7)" fontSize="12" fontFamily="var(--font-sans)">storage in kWh</text>

      {/* Building */}
      <g stroke={line} strokeWidth="1.5">
        <path d="M392 238l50-36 50 36v60H392Z" />
        <path d="M428 298v-30h28v30" stroke={faint} />
      </g>
      <text x="392" y="320" fill="white" fontSize="13" fontWeight="700" fontFamily="var(--font-display)">HOME / BUSINESS</text>

      {/* Grid */}
      <g stroke={line} strokeWidth="1.5">
        <path d="M454 100l-14 64h28Zm-20 22h40M436 140h36" />
      </g>
      <text x="420" y="188" fill="white" fontSize="13" fontWeight="700" fontFamily="var(--font-display)">GRID</text>

      {/* Power flows */}
      <g stroke={gold} strokeWidth="2.5" strokeDasharray="2 7">
        <path d="M232 150v64" />
        <path d="M238 270h-80" />
        <path d="M302 256h90" />
        <path d="M302 236c60 0 90-40 140-56" />
      </g>
    </svg>
  );
}
