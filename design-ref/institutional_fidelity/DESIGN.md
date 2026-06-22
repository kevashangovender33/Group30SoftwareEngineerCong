---
name: Institutional Fidelity
colors:
  surface: '#f8f9ff'
  surface-dim: '#d1dbec'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eef4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dfe9fa'
  surface-container-highest: '#d9e3f4'
  on-surface: '#121c28'
  on-surface-variant: '#444651'
  inverse-surface: '#27313e'
  inverse-on-surface: '#eaf1ff'
  outline: '#747782'
  outline-variant: '#c4c6d2'
  surface-tint: '#3d5ca2'
  primary: '#001a48'
  on-primary: '#ffffff'
  primary-container: '#002d72'
  on-primary-container: '#7a97e2'
  inverse-primary: '#b1c5ff'
  secondary: '#3a608f'
  on-secondary: '#ffffff'
  secondary-container: '#a4c9fe'
  on-secondary-container: '#2d5482'
  tertiary: '#1a1d1e'
  on-tertiary: '#ffffff'
  tertiary-container: '#2f3233'
  on-tertiary-container: '#989a9b'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2ff'
  primary-fixed-dim: '#b1c5ff'
  on-primary-fixed: '#001946'
  on-primary-fixed-variant: '#224489'
  secondary-fixed: '#d3e3ff'
  secondary-fixed-dim: '#a4c9fe'
  on-secondary-fixed: '#001c38'
  on-secondary-fixed-variant: '#1f4875'
  tertiary-fixed: '#e1e3e4'
  tertiary-fixed-dim: '#c5c7c8'
  on-tertiary-fixed: '#191c1d'
  on-tertiary-fixed-variant: '#454748'
  background: '#f8f9ff'
  on-background: '#121c28'
  surface-variant: '#d9e3f4'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  data-tabular:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
  container-max: 1440px
---

## Brand & Style

The design system is engineered for high-stakes banking operations and internal triage. The brand personality is authoritative, precise, and resilient. It prioritizes information density without sacrificing clarity, ensuring that operators can make rapid, high-trust decisions regarding fraud and risk.

The visual style is **Corporate / Modern** with a focus on institutional reliability. It utilizes a structured hierarchy, ample whitespace within data-dense environments, and a rigorous adherence to functional alignment. The emotional response should be one of calm control and professional confidence.

## Colors

The palette is anchored by **Deep Navy (#002D72)** to establish institutional authority. Surface colors utilize a tiered approach: the primary background is **Very Light Grey (#F9FAFB)**, while active workspaces and "containers" use pure white to draw the eye toward actionable data.

Functional colors are critical for the triage workflow:
- **Emerald (#059669)**: Indicates resolved states or low-risk profiles.
- **Amber (#D97706)**: Signals aging cases or medium-risk warnings.
- **Crimson (#DC2626)**: Reserved strictly for fraud, high-risk alerts, and overdue actions.
- **Slate Blue (#5176A6)**: Used for secondary actions and supportive UI elements to maintain a professional tone without competing with the primary navy.

## Typography

This design system utilizes **Inter** exclusively to ensure maximum legibility and a systematic, utilitarian aesthetic. 

Key typographic principles:
- **Data-Heavy Focus**: Use `data-tabular` for all table content to ensure numerical alignment.
- **Clear Hierarchy**: Labels are uppercase with slight tracking to distinguish them from editable body text.
- **High Contrast**: Primary headings use Deep Navy, while body text uses a dark neutral grey to reduce eye strain during long sessions.

## Layout & Spacing

The layout follows a **Fixed Grid** philosophy on desktop to maintain predictable data scanning patterns. 
- **Desktop**: A 12-column grid with 16px gutters. Maximum content width is capped at 1440px to prevent horizontal eye fatigue.
- **Tablet**: 8-column grid with 16px gutters.
- **Mobile**: 4-column grid with 16px gutters and 16px side margins.

A strict 4px baseline grid governs all internal padding and component heights, ensuring "Enterprise Grade" precision. Lists and tables should prioritize a "compact" density setting by default.

## Elevation & Depth

To maintain a clean, professional look, this design system avoids heavy shadows. Instead, it uses **Tonal Layers** and **Low-Contrast Outlines**:

- **Level 0**: Background surface (#F9FAFB).
- **Level 1**: Primary cards and content containers (White). These use a 1px solid border (#E5E7EB) rather than shadows.
- **Level 2**: Hover states and active modals. These utilize a very subtle, highly diffused ambient shadow (0px 4px 12px rgba(0, 0, 0, 0.05)) to suggest interaction.
- **Recommendation Banners**: These are "stuck" to the top of triage views, using a solid 2px left-border of the primary or status color to denote importance.

## Shapes

The design system uses a **Soft (1)** roundedness profile. This 4px (0.25rem) corner radius provides a modern touch while maintaining the rigid, professional structure expected of a banking tool. 

- **Buttons & Inputs**: 4px radius.
- **Cards & Banners**: 8px (0.5rem) radius.
- **Status Badges**: Full pill-shape for maximum contrast against the rectangular grid.

## Components

### Buttons
- **Primary**: Deep Navy background with white text. High-contrast, rectangular with 4px radius.
- **Secondary**: Slate Blue ghost buttons with 1px border.
- **Critical Action**: Crimson background for final "Confirm Fraud" or "Block Account" actions.

### Data Tables
- Header rows must be light grey (#F3F4F6) with uppercase labels.
- Rows should include a subtle hover state (#F9FAFB).
- Use "Sticky" headers for long triage lists.

### Status Badges
- High-visibility badges with light-tint backgrounds and dark-tint text.
- Example: "High Risk" uses a light crimson background with Crimson (#DC2626) text.

### Recommendation Banners
- Placed at the top of the case file.
- Uses a background tint corresponding to the risk level (e.g., Light Amber for a "Review Required" recommendation).
- Must include a clear icon and a bold summary line.

### Input Fields
- Standardized heights (36px or 40px).
- Use a 1px border (#D1D5DB) that thickens and changes to Deep Navy on focus.
- Labels must always be visible above the field (no floating labels).