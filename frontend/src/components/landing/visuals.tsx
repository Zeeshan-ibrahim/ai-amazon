/**
 * Decorative SVG/CSS art for the landing page. No image assets: the dotted
 * globe is computed from a Fibonacci sphere and the "photo" is a halftone mask.
 */

function spherePoints(count: number, radius: number, tilt = 0.35) {
  const points: { x: number; y: number; z: number }[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = golden * i;
    const x = Math.cos(theta) * r;
    const z = Math.sin(theta) * r;
    // tilt around the x-axis so the poles are not facing the viewer
    const ty = y * Math.cos(tilt) - z * Math.sin(tilt);
    const tz = y * Math.sin(tilt) + z * Math.cos(tilt);
    points.push({ x: x * radius, y: ty * radius, z: tz });
  }
  return points;
}

const GLOBE = spherePoints(900, 150);
const BLOB = spherePoints(700, 120, 0.9);

export function OrbitGlobe({ className }: { className?: string }) {
  return (
    <svg viewBox="-320 -240 640 480" aria-hidden className={className}>
      <ellipse rx="300" ry="120" fill="none" stroke="#fff" strokeOpacity="0.22" transform="rotate(-18)" />
      <ellipse rx="250" ry="175" fill="none" stroke="#fff" strokeOpacity="0.14" transform="rotate(24)" />
      <ellipse rx="190" ry="70" fill="none" stroke="#fff" strokeOpacity="0.3" strokeDasharray="1 6" transform="rotate(-8)" />
      {GLOBE.map((p, i) => (
        <circle
          key={i}
          cx={p.x.toFixed(1)}
          cy={p.y.toFixed(1)}
          r={(0.6 + (p.z + 1) * 0.55).toFixed(2)}
          fill="#E7EFE9"
          opacity={(0.12 + ((p.z + 1) / 2) * 0.75).toFixed(2)}
        />
      ))}
      {/* small wireframe cube riding the outer orbit */}
      <g transform="translate(200 120) rotate(-20)" stroke="#E7EFE9" strokeOpacity="0.55" fill="none">
        <rect x="-26" y="-18" width="52" height="36" />
        <path d="M-26 -18l14 -10h52l-14 10M26 18l14 -10v-36" />
        <path d="M-14 -18v36M-2 -18v36M10 -18v36" strokeOpacity="0.3" />
      </g>
      <g transform="translate(205 -95) rotate(25)" fill="#E7EFE9">
        <path d="M0 -26 16 0 0 26 -16 0Z" fillOpacity="0.5" />
        <path d="M0 -26 16 0 0 6Z" fillOpacity="0.85" />
      </g>
    </svg>
  );
}

export function DottedBlob({ className }: { className?: string }) {
  return (
    <svg viewBox="-150 -150 300 300" aria-hidden className={className}>
      {BLOB.map((p, i) => {
        const wobble = 1 + 0.12 * Math.sin(p.x / 14) * Math.cos(p.y / 18);
        return (
          <circle
            key={i}
            cx={(p.x * wobble).toFixed(1)}
            cy={(p.y * wobble).toFixed(1)}
            r={(0.5 + (p.z + 1) * 0.6).toFixed(2)}
            fill="#fff"
            opacity={(0.08 + ((p.z + 1) / 2) * 0.7).toFixed(2)}
          />
        );
      })}
    </svg>
  );
}

/** Halftone panel standing in for a photo: dots fade along a diagonal. */
export function HalftonePanel({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={className}
      style={{
        backgroundColor: '#E9E7E0',
        backgroundImage:
          'radial-gradient(circle, #0A0A0A 1.1px, transparent 1.4px), linear-gradient(160deg, #F4F3EE 0%, #9C9C94 55%, #2A2A28 100%)',
        backgroundSize: '5px 5px, 100% 100%',
        backgroundBlendMode: 'multiply',
      }}
    />
  );
}

/** Light dot field used behind the intro section. */
export function DotField({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={className}
      style={{
        backgroundImage: 'radial-gradient(circle, #9C9C94 1px, transparent 1.6px)',
        backgroundSize: '12px 12px',
        maskImage: 'linear-gradient(200deg, rgba(0,0,0,0.6) 0%, transparent 55%)',
        WebkitMaskImage: 'linear-gradient(200deg, rgba(0,0,0,0.6) 0%, transparent 55%)',
      }}
    />
  );
}
