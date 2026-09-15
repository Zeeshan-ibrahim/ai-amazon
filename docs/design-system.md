# Design system

Tokens live in `frontend/tailwind.config.ts`. Use the named utilities rather
than raw hex values so a palette change stays a one-file edit.

## Color

| Token | Value | Used for |
| --- | --- | --- |
| `cream` | `#FAF9F5` | Page background |
| `surface` | `#FFFFFF` | Cards, inputs |
| `line` | `#E9E7E0` | Borders, dividers |
| `ink` | `#0A0A0A` | Primary text, primary buttons |
| `muted` | `#7C7C74` | Secondary text |
| `subtle` | `#9C9C94` | Eyebrow labels, placeholders |
| `brand-500` | `#4E9E77` | Active nav, accents |
| `brand-600` / `money` | `#2E7A58` | Currency and positive values |
| `danger` | `#9B2226` | Deposit-now button |
| `dangerSoft` | `#C0392B` | Warning text and shortfalls |

Two gradients carry the dark surfaces:

- `bg-sidebar-veil` — the desktop sidebar, black fading to green from the
  bottom-left.
- `bg-balance-veil` — the balance card, order notice, and settings profile
  header.

## Type

`Outfit` (via `next/font/google`, exposed as `--font-outfit`). Headings are
`font-medium` with `tracking-tight`; the design has no bold weights.

Rough scale: page titles `text-[26px]` → `lg:text-[30px]`, section titles
`text-xl`, body `text-sm`/`text-[13px]`, eyebrows `text-[10px] uppercase
tracking-[0.13em]`.

Add the `tabular` utility (defined in `globals.css`) to any currency or numeric
value so columns align across rows.

## Radii and elevation

- `rounded-card` (14px) for cards, `rounded-xl` for buttons and inputs,
  `rounded-pill` for ticker chips.
- `shadow-card` for light surfaces, `shadow-panel` for dark ones,
  `shadow-modal` for dialogs.

## Primitives

| Component | Notes |
| --- | --- |
| `Button` | `primary \| secondary \| outline \| ghost \| danger \| light`, sizes `sm \| md \| lg`, `loading` renders a spinner |
| `Card` | `tone="default \| muted \| dark"`, `padded` toggle |
| `Input` / `PasswordInput` | Label, hint, error, optional `prefix` (e.g. `$`) |
| `Modal` | Bottom sheet under `sm`, centered dialog above; closes on Escape and locks body scroll |
| `Tabs` / `SegmentedControl` | Underline tabs, and pill filters |
| `Badge` | `neutral \| green \| dark \| outline` |
| `EmptyState` / `ErrorState` / `Skeleton` / `LoadingBlock` | Every data screen renders all three states |

Icons are inline SVG in `components/ui/Icons.tsx` — no icon package. They take
`currentColor`, so set color on the parent.

## Motion

`animate-marquee` (deposit ticker), `animate-fade-up` (modal entry), and
`animate-pulse-dot` (live indicators). `globals.css` disables all of it under
`prefers-reduced-motion: reduce`.

## Breakpoints

`lg` (1024px) is the only structural breakpoint — see the responsive section in
[architecture.md](architecture.md). `sm` (640px) handles spacing and grid
density within a layout.
