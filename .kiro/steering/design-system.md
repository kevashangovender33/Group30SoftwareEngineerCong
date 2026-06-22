---
inclusion: fileMatch
fileMatchPattern: "client/src/**"
---

# Design System — Institutional Fidelity

Reference: `#[[design-ref/institutional_fidelity/DESIGN.md]]`

## Brand

App name: **TRIAGE** (displayed as bold navy "TRIA" + slate blue "GE" in logos).
Product identity: "Ops Portal — Internal Triage".
Personality: Authoritative, precise, resilient. Calm control and professional confidence.

## Typography

Font: **Inter** (all weights). Import via Google Fonts or bundled.

| Token | Size | Weight | Line Height | Letter Spacing |
|-------|------|--------|-------------|----------------|
| headline-lg | 30px | 700 | 38px | -0.02em |
| headline-lg-mobile | 24px | 700 | 32px | -0.02em |
| headline-md | 20px | 600 | 28px | -0.01em |
| body-lg | 16px | 400 | 24px | — |
| body-md | 14px | 400 | 20px | — |
| label-md | 12px | 600 | 16px | 0.05em |
| data-tabular | 13px | 500 | 18px | — |

## Colour Palette (Key Tokens)

| Token | Hex | Usage |
|-------|-----|-------|
| primary | #001A48 | Deep Navy — headings, primary buttons, key actions |
| primary-container | #002D72 | Nav/branding containers |
| on-primary | #FFFFFF | Text on primary backgrounds |
| secondary | #3A608F | Slate Blue — secondary buttons, info elements |
| secondary-container | #A4C9FE | Active nav items, light info cards |
| surface | #F8F9FF | Page background |
| surface-container-lowest | #FFFFFF | Cards, main content areas |
| surface-container-low | #EEF4FF | Info banners, secondary backgrounds |
| surface-container-high | #DFE9FA | Hover states, sidebar items |
| outline-variant | #C4C6D2 | Borders, dividers |
| on-surface | #121C28 | Primary text |
| on-surface-variant | #444651 | Secondary/muted text |
| error | #BA1A1A | Error states |
| error-container | #FFDAD6 | Error backgrounds |

## Functional Colours (Triage-Specific)

| Colour | Hex | Usage |
|--------|-----|-------|
| Emerald | #059669 | Resolved/low-risk (IMMEDIATE_REVERSAL, CLOSE_RESOLVED) |
| Amber | #D97706 | Aging/medium-risk (MONITOR_24H, INVESTIGATE, REFER_PAYMENTS) |
| Crimson | #DC2626 | Fraud/high-risk/overdue (ESCALATE_FRAUD, ESCALATE_SENIOR) |
| Slate Blue | #5176A6 | Secondary actions, supportive UI |

## Recommendation Banner Colours

| Action Code | Background | Border | Text |
|-------------|-----------|--------|------|
| IMMEDIATE_REVERSAL | emerald-50 | emerald-600 (left-8) | emerald-900 |
| CLOSE_RESOLVED | emerald-50 | emerald-600 (left-8) | emerald-900 |
| MONITOR_24H | amber-50 | amber-600 (left-8) | amber-900 |
| INVESTIGATE | amber-50 | amber-600 (left-8) | amber-900 |
| REFER_PAYMENTS | amber-50 | amber-600 (left-8) | amber-900 |
| ESCALATE_FRAUD | red-50 | red-600 (left-8) | red-900 |
| ESCALATE_SENIOR | red-50 | red-600 (left-8) | red-900 |

## Layout

- Max content width: 1440px
- Desktop gutters: 16px
- Desktop margins: 32px
- Mobile margins: 16px
- 4px baseline grid for all spacing

## Elevation

- Level 0: Background surface (#F8F9FF)
- Level 1: Cards — white with 1px solid border (#E5E7EB), no shadow
- Level 2: Hover/active — subtle ambient shadow (0px 4px 12px rgba(0,0,0,0.05))
- Recommendation banners: solid left-border (2–8px) for emphasis

## Shapes

- Buttons & Inputs: 4px radius
- Cards & Banners: 8px radius
- Status badges: pill-shape (full radius)

## Components (Design Reference)

### Navigation
- Side nav (desktop): 64px wide fixed, navy branding, icon+label nav items
- Top bar: 64px height, sticky, logo left, actions right
- Breadcrumb/stepper: 4 steps (Select Customer → Select Transaction → Capture Dispute → Triage Result)

### Customer Cards (Step 1)
- Grid layout (1/2/3 columns responsive)
- Icon + name + account number + email + tier badge
- Hover: shadow-lg + border-primary
- "Select Customer" button per card

### Transaction Table (Step 2)
- Header: grey background (#F3F4F6), uppercase labels
- Columns: Date, Description, Amount (ZAR), Payment Type, Status, Action
- Status badges: green (Completed), amber (Pending), red (Failed), blue (Refunded)
- "Select" button per row
- Pagination at bottom

### Dispute Form (Step 3)
- Payment type: read-only input (locked icon), pre-populated
- Issue category: dropdown select (required)
- Notes: textarea (optional)
- Actions: "Back to Transactions" (secondary) + "Run Triage Engine" (primary)
- Right sidebar: Selected transaction summary card + guidelines

### Triage Result (Step 4)
- Status badges row: Priority + Age + Reference Number
- Recommendation banner: large, colour-coded, left-border, icon + headline + description
- 3-column grid below: Rules Transparency (1col) + Transaction Details (1col) + Dispute Evidence (1col)
- Action footer: "Log New Dispute" button
