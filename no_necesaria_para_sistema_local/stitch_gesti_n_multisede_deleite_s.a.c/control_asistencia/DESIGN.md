---
name: Artisanal Precision
colors:
  surface: '#fff8f5'
  surface-dim: '#e3d8d1'
  surface-bright: '#fff8f5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fdf1eb'
  surface-container: '#f7ece5'
  surface-container-high: '#f2e6df'
  surface-container-highest: '#ece0da'
  on-surface: '#201b17'
  on-surface-variant: '#504440'
  inverse-surface: '#352f2b'
  inverse-on-surface: '#faeee8'
  outline: '#83746f'
  outline-variant: '#d5c3bd'
  surface-tint: '#7b5647'
  primary: '#32170d'
  on-primary: '#ffffff'
  primary-container: '#4b2c20'
  on-primary-container: '#bf9282'
  inverse-primary: '#ecbcaa'
  secondary: '#735c00'
  on-secondary: '#ffffff'
  secondary-container: '#fed65b'
  on-secondary-container: '#745c00'
  tertiary: '#211f16'
  on-tertiary: '#ffffff'
  tertiary-container: '#36342b'
  on-tertiary-container: '#a19c90'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbce'
  primary-fixed-dim: '#ecbcaa'
  on-primary-fixed: '#2e140a'
  on-primary-fixed-variant: '#613e31'
  secondary-fixed: '#ffe088'
  secondary-fixed-dim: '#e9c349'
  on-secondary-fixed: '#241a00'
  on-secondary-fixed-variant: '#574500'
  tertiary-fixed: '#e8e2d4'
  tertiary-fixed-dim: '#cbc6b9'
  on-tertiary-fixed: '#1d1c13'
  on-tertiary-fixed-variant: '#49473d'
  background: '#fff8f5'
  on-background: '#201b17'
  surface-variant: '#ece0da'
typography:
  headline-lg:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-md:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Manrope
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Work Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Work Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-lg:
    fontFamily: Work Sans
    fontSize: 14px
    fontWeight: '600'
    letterSpacing: 0.5px
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  headline-lg-mobile:
    fontFamily: Manrope
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 32px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style

The design system is built to balance the artisanal warmth of a traditional bakery with the high-octane efficiency of a modern order management system. It targets waitstaff and kitchen personnel who require immediate visual cues and high-legibility interfaces in fast-paced environments.

The visual style is **Modern Corporate with Tactile accents**. It leverages the richness of the bakery's heritage through a "Warm Cream" base that reduces eye strain compared to pure white, while "Deep Brown" provides a grounding, professional structure. The interface uses subtle tonal layering to keep the UI clean, ensuring that the primary focus remains on the operational status of orders and tables. The emotional response is one of reliability, tradition, and organized calm.

## Colors

The palette is derived directly from the heritage of the bakery.
- **Deep Brown (Primary):** Used for primary navigation, headers, and key call-to-action buttons. It represents the "crust" and professional foundation of the brand.
- **Gold (Secondary):** Reserved for highlights, active states, and "Premium" or "Special" order indicators.
- **Warm Cream (Surface):** The primary background color. It creates an appetizing, soft workspace that is more comfortable than stark white for long shifts.
- **Semantic Statuses:** 
    - **Available (Success):** A deep botanical green for clear visibility.
    - **Occupied/In Kitchen (Warning):** A vibrant amber to signify active processing.
    - **Pre-bill/Pending (Info):** A bright sky blue to distinguish financial/administrative actions from kitchen actions.

## Typography

Typography is optimized for speed and clarity. 
- **Manrope** is used for headings to provide a modern, clean, and balanced geometric feel that remains professional.
- **Work Sans** is the workhorse for body text and order details, chosen for its exceptional legibility on mobile screens and varied weights.
- **JetBrains Mono** is introduced for "Order IDs," "Table Numbers," and "Price Points." The monospaced nature ensures that numbers align perfectly in lists, making it easier for staff to scan quantities and totals quickly.

## Layout & Spacing

The design system utilizes a **Fluid Grid** model with a base-4 vertical rhythm.
- **Mobile:** A 4-column layout with 16px side margins. Key action buttons (e.g., "Add to Order") should be at least 48px in height to accommodate "fat-finger" interactions in a busy kitchen.
- **Tablet (Primary Device):** An 8-column layout. This is the preferred device for table management. Use a split-view where the left side (3 columns) manages the table grid and the right side (5 columns) handles the specific order details.
- **Spacing Philosophy:** Dense but breathable. Information density is high to reduce scrolling, but touch targets are kept large.

## Elevation & Depth

Hierarchy is established through **Tonal Layering** and **Soft Shadows**.
- **Level 0 (Base):** Warm Cream surface.
- **Level 1 (Cards/Items):** White background with a very subtle 1px border in a slightly darker cream (#E5DED0) to define boundaries without heavy shadows.
- **Level 2 (Active/Floating):** Used for "Total Amount" bars or "Active Order" cards. These use a 12% opacity Deep Brown shadow with a 12px blur to appear lifted and prioritized.
- **Interactive States:** Buttons use a slight inset shadow on "press" to provide tactile feedback, mimicking the physical press of a POS terminal.

## Shapes

The shape language uses **Rounded** (0.5rem) corners. This softening of the UI echoes the organic shapes of baked goods (loaves, pastries) while maintaining enough structure for a professional management tool. 
- **Buttons and Input Fields:** 0.5rem radius.
- **Table Icons:** 1rem radius (Large) to make them feel like distinct "stations" on the floor map.
- **Status Pills:** Fully rounded (pill-shaped) to distinguish them from functional buttons.

## Components

- **Table Cards:** Large, tappable containers. The top border or a corner "dog-ear" should be color-coded based on the status (Green, Amber, Blue).
- **Primary Buttons:** Solid Deep Brown with White text. For "Fast Actions" like 'Print Bill', use a Gold background with Deep Brown text.
- **Order Lists:** High-contrast rows. Quantity should be bolded and set in JetBrains Mono. Use "Checkboxes" that turn into a strikethrough state when a kitchen item is "Served."
- **Input Fields:** Outlined style using the Neutral color. On focus, the border transitions to Primary Brown with a 2px thickness.
- **Floating Action Button (FAB):** A "New Order" FAB in Gold is essential for the mobile interface, positioned at the bottom right.
- **Sticky Footer:** In the order screen, the "Total Amount" and "Send to Kitchen" button must remain sticky to the bottom of the viewport.