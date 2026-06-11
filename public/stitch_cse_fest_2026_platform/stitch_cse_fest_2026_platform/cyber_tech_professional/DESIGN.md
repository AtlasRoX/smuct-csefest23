---
name: Cyber-Tech Professional
colors:
  surface: '#13121b'
  surface-dim: '#13121b'
  surface-bright: '#393842'
  surface-container-lowest: '#0e0d16'
  surface-container-low: '#1b1b24'
  surface-container: '#1f1f28'
  surface-container-high: '#2a2933'
  surface-container-highest: '#35343e'
  on-surface: '#e4e1ee'
  on-surface-variant: '#c7c4d8'
  inverse-surface: '#e4e1ee'
  inverse-on-surface: '#302f39'
  outline: '#918fa1'
  outline-variant: '#464555'
  surface-tint: '#c3c0ff'
  primary: '#c3c0ff'
  on-primary: '#1d00a5'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#4d44e3'
  secondary: '#ddb7ff'
  on-secondary: '#490080'
  secondary-container: '#6f00be'
  on-secondary-container: '#d6a9ff'
  tertiary: '#ffb695'
  on-tertiary: '#571f00'
  tertiary-container: '#a44100'
  on-tertiary-container: '#ffd2be'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#f0dbff'
  secondary-fixed-dim: '#ddb7ff'
  on-secondary-fixed: '#2c0051'
  on-secondary-fixed-variant: '#6900b3'
  tertiary-fixed: '#ffdbcc'
  tertiary-fixed-dim: '#ffb695'
  on-tertiary-fixed: '#351000'
  on-tertiary-fixed-variant: '#7b2f00'
  background: '#13121b'
  on-background: '#e4e1ee'
  surface-variant: '#35343e'
typography:
  headline-xl:
    fontFamily: Space Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
  data-display:
    fontFamily: Geist Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 64px
  max-width: 1280px
---

## Brand & Style
The design system for the CSE Fest 2026 platform bridges the gap between academic excellence and futuristic technology. It is built to serve a dual audience: university administration looking for professional rigor, and computer science students seeking an innovative, cutting-edge atmosphere.

The visual style is a fusion of **Glassmorphism** and **Modern Corporate**. It utilizes high-transparency surfaces, vibrant background blurs, and precise grid-based structures to evoke the feeling of a high-tech command center. The presence of technical grid patterns and neon-tinted accents reinforces the "Cyber-Tech" identity without sacrificing the clarity required for a functional event platform.

## Colors
The palette is rooted in deep space neutrals to allow vibrant primary and secondary colors to glow.
- **Primary (Indigo):** Used for main actions, active states, and brand-critical elements.
- **Secondary (Electric Violet):** Used for decorative accents, gradients, and secondary visual weight.
- **Accent (Cyan):** Used sparingly for "live" indicators, success states, and high-frequency data highlights.
- **Neutral System:** Adopts a deep navy-black base for dark mode. For light mode, the roles invert to a clean, architectural gray-white system, though the dark mode is the intended default "Cyber" experience.

## Typography
The typographic hierarchy emphasizes technical precision.
- **Space Grotesk** provides a geometric, futuristic feel for headings, making the event name and key titles stand out.
- **Inter** ensures that long-form academic content and general UI labels remain highly legible and professional.
- **Geist Mono** is reserved for tabular data, countdown timers, and code-like snippets, reinforcing the computer science theme.

## Layout & Spacing
The layout follows a **Fluid Grid** model with high structural density.
- **Grid Pattern:** A `bg-grid-pattern` (10% opacity cyan lines) should be applied to the base background layer to provide a "blueprint" feel.
- **Column System:** 12-column grid for desktop, 4-column for mobile.
- **Rhythm:** All spacing (margins, padding) should be multiples of the 4px base unit. 
- **Adapation:** On mobile, glassmorphic panels should extend to the screen edges with minimal horizontal padding (16px) to maximize content space for technical data.

## Elevation & Depth
Depth is achieved through **Glassmorphism** rather than traditional shadows.
- **Surface Stack:** 
    - Layer 0: Background Grid.
    - Layer 1: Semi-transparent surfaces (10% white/navy) with a `backdrop-filter: blur(12px)`.
    - Layer 2: Interactive elements (Buttons, Chips).
- **Outlines:** Use 1px "ghost borders" (20% opacity white) on glass containers to define edges without adding visual weight.
- **Glows:** High-elevation elements like "Live Now" chips or hovered buttons should emit a soft, diffused glow (`box-shadow`) matching their primary or secondary color.

## Shapes
This design system utilizes a **Rounded** language to soften the futuristic aesthetic, making it feel more approachable and modern.
- **Standard Corners:** 0.5rem (8px) for buttons and inputs.
- **Large Containers:** 1rem (16px) for dashboard cards and informational panels.
- **Feature Elements:** `rounded-2xl` (1.5rem) specifically for high-level hero cards and stats modules to create a distinct, modern "app-like" feel.

## Components
### Buttons
- **Primary:** Solid Indigo fill. On hover, apply a `box-shadow: 0 0 15px hsl(243, 75%, 59%)`.
- **Ghost:** Transparent background with 1px Cyan border. On hover, fill with 10% Cyan opacity.

### Status Pills
- **Active/Live:** Cyan fill with black Geist Mono text. Add a "breathing" pulse animation to the background.
- **Completed:** Neutral-800 fill with white text.

### Glassmorphic Navigation
- The top navbar should be a floating element with 60% opacity background and a strong blur. The bottom border should be a subtle gradient from Indigo to Violet.

### Data Tables
- Use Geist Mono for all cell content. Headers should be uppercase Inter with 0.05em tracking. Row hover states should use a subtle Indigo tint (5% opacity).

### Input Fields
- Dark background (100% opaque to prevent text collision) with a 1px border. The border should transition to a Cyan glow when the field is focused.