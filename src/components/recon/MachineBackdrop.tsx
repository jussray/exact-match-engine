/**
 * MachineBackdrop — decorative hero artwork for the Exact Match Engine.
 *
 * Renders the "machine" from the product blueprint as layered SVG:
 * concentric verification rings in claimed (cyan) and observed (violet),
 * tick marks, radial spokes, and a glowing core behind the comparison lab.
 * Purely decorative: aria-hidden, pointer-events-none, and rotation is
 * motion-safe only (disabled under prefers-reduced-motion via Tailwind's
 * motion-safe variant). Colors come from the theme tokens via inline
 * styles because SVG presentation attributes do not resolve var().
 */
const primary = "var(--primary)";
const observed = "var(--observed)";
const background = "var(--background)";

export function MachineBackdrop() {
  const ticks = Array.from({ length: 72 }, (_, i) => i * 5);
  const spokes = Array.from({ length: 12 }, (_, i) => i * 30);
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 right-0 hidden w-[58%] items-center justify-center lg:flex"
    >
      <svg
        viewBox="0 0 600 600"
        className="h-[640px] w-[640px] max-w-none opacity-60"
        fill="none"
        role="presentation"
      >
        <defs>
          <radialGradient id="machine-core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" style={{ stopColor: primary, stopOpacity: 0.5 }} />
            <stop offset="45%" style={{ stopColor: primary, stopOpacity: 0.12 }} />
            <stop offset="100%" style={{ stopColor: primary, stopOpacity: 0 }} />
          </radialGradient>
          <radialGradient id="machine-halo" cx="50%" cy="50%" r="50%">
            <stop offset="55%" style={{ stopColor: observed, stopOpacity: 0 }} />
            <stop offset="82%" style={{ stopColor: observed, stopOpacity: 0.14 }} />
            <stop offset="100%" style={{ stopColor: observed, stopOpacity: 0 }} />
          </radialGradient>
        </defs>

        <circle cx="300" cy="300" r="290" fill="url(#machine-halo)" />
        <circle cx="300" cy="300" r="205" fill="url(#machine-core)" />

        {/* outer static ring + tick ring */}
        <circle cx="300" cy="300" r="282" style={{ stroke: observed, strokeOpacity: 0.45 }} strokeWidth="1.5" />
        <circle cx="300" cy="300" r="252" style={{ stroke: primary, strokeOpacity: 0.35 }} strokeWidth="1" />
        <g style={{ stroke: primary, strokeOpacity: 0.55 }}>
          {ticks.map((deg) => (
            <line
              key={deg}
              x1="300"
              y1="22"
              x2="300"
              y2={deg % 30 === 0 ? "40" : "31"}
              strokeWidth={deg % 30 === 0 ? 2 : 1}
              transform={`rotate(${deg} 300 300)`}
            />
          ))}
        </g>

        {/* slow rotating verification ring */}
        <g
          className="motion-safe:animate-spin [transform-box:fill-box] [transform-origin:center]"
          style={{ animationDuration: "90s" }}
        >
          <circle
            cx="300"
            cy="300"
            r="218"
            style={{ stroke: primary, strokeOpacity: 0.65 }}
            strokeWidth="2"
            strokeDasharray="26 14"
          />
          <circle cx="300" cy="82" r="5" style={{ fill: primary }} />
          <circle cx="518" cy="300" r="4" style={{ fill: observed }} />
          <circle cx="300" cy="518" r="5" style={{ fill: primary }} />
          <circle cx="82" cy="300" r="4" style={{ fill: observed }} />
        </g>

        {/* counter-rotating observed ring */}
        <g
          className="motion-safe:animate-spin [transform-box:fill-box] [transform-origin:center]"
          style={{ animationDuration: "120s", animationDirection: "reverse" }}
        >
          <circle
            cx="300"
            cy="300"
            r="168"
            style={{ stroke: observed, strokeOpacity: 0.6 }}
            strokeWidth="1.5"
            strokeDasharray="4 10"
          />
          {spokes.map((deg) => (
            <line
              key={deg}
              x1="300"
              y1="140"
              x2="300"
              y2="156"
              style={{ stroke: observed, strokeOpacity: 0.7 }}
              strokeWidth="2"
              transform={`rotate(${deg} 300 300)`}
            />
          ))}
        </g>

        {/* inner machine rings + core */}
        <circle cx="300" cy="300" r="118" style={{ stroke: primary, strokeOpacity: 0.7 }} strokeWidth="2" />
        <circle cx="300" cy="300" r="86" style={{ stroke: observed, strokeOpacity: 0.55 }} strokeWidth="1.5" />
        <circle
          cx="300"
          cy="300"
          r="52"
          style={{ fill: background, fillOpacity: 0.55, stroke: primary, strokeOpacity: 0.8 }}
          strokeWidth="2"
        />
        <circle cx="300" cy="300" r="17" style={{ fill: primary, fillOpacity: 0.85 }} />
        <circle cx="300" cy="300" r="7" style={{ fill: background }} />
        {/* crosshair */}
        <line x1="300" y1="196" x2="300" y2="238" style={{ stroke: primary, strokeOpacity: 0.8 }} strokeWidth="2" />
        <line x1="300" y1="362" x2="300" y2="404" style={{ stroke: primary, strokeOpacity: 0.8 }} strokeWidth="2" />
        <line x1="196" y1="300" x2="238" y2="300" style={{ stroke: primary, strokeOpacity: 0.8 }} strokeWidth="2" />
        <line x1="362" y1="300" x2="404" y2="300" style={{ stroke: primary, strokeOpacity: 0.8 }} strokeWidth="2" />
      </svg>
    </div>
  );
}
