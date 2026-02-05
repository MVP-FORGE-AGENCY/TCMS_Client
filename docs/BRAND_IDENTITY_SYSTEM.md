# CertifyCloud Brand Identity System

A comprehensive design system and visual identity framework for CertifyCloud, the modern compliance management platform. This document serves as the single source of truth for all design decisions, color usage, typography, and brand applications across digital, print, and marketing materials.

---

## Part 1: Brand Overview

### Brand Essence

**Name**: CertifyCloud

**Tagline**: "Compliance Without Complexity"

**Brand Promise**: Eliminating compliance burden through intelligent automation and intuitive design

**Core Positioning**: Purpose-built compliance and training management platform for aviation and high-compliance industries worldwide

### Brand Personality

- **Professional** – Enterprise-grade capability and reliability
- **Trustworthy** – Built on security and compliance expertise
- **Approachable** – Complex features made simple through elegant design
- **Innovation-Driven** – Modern cloud-native technology meeting regulatory standards
- **Human-Centered** – User needs guide every design decision

---

## Part 2: Color Palette

### Primary Color System

The CertifyCloud primary color palette consists of carefully selected hues that convey professionalism, trust, and aviation standards while ensuring accessibility and visual distinction.

#### Core Brand Colors

**CertifyCloud Blue (Primary)**
- **Hex**: `#0066FF`
- **RGB**: `0, 102, 255`
- **HSL**: `221°, 100%, 50%`
- **Tailwind**: `blue-600`
- **Usage**: Primary actions, links, headers, key CTAs, brand accent
- **Description**: Modern, professional blue conveying trust and technology
- **Accessibility**: WCAG AAA contrast on white backgrounds (9.2:1)

**Slate Dark (Secondary)**
- **Hex**: `#1E293B`
- **RGB**: `30, 41, 59`
- **HSL**: `217°, 33%, 17%`
- **Tailwind**: `slate-800`
- **Usage**: Text, headers, dark mode backgrounds, strong emphasis
- **Description**: Deep slate for professional, serious tone
- **Accessibility**: WCAG AAA contrast on white backgrounds (13.8:1)

**Slate Light (Tertiary)**
- **Hex**: `#F1F5F9`
- **RGB**: `241, 245, 249`
- **HSL**: `210°, 40%, 96%`
- **Tailwind**: `slate-50`
- **Usage**: Backgrounds, cards, light mode surfaces
- **Description**: Clean, minimal light background
- **Accessibility**: WCAG AAA contrast with slate-800 text (12.6:1)

### Functional Status Colors

The traffic light system provides immediate visual feedback on competence status across the platform.

#### Green – Valid/Compliant Status

**Primary Green**
- **Hex**: `#10B981`
- **RGB**: `16, 185, 129`
- **HSL**: `160°, 84%, 39%`
- **Tailwind**: `emerald-500`
- **Usage**: Valid qualifications, passed assessments, compliant state, success messages
- **Meaning**: Action complete, no intervention needed, proceed with confidence

**Green Variants**
- **Light**: `#D1FAE5` (bg-emerald-100) – Backgrounds, badges
- **Dark**: `#059669` (emerald-600) – Hover states, emphasis
- **Very Light**: `#ECFDF5` (bg-emerald-50) – Subtle backgrounds, cards

#### Amber – Expiring Soon/Warning Status

**Primary Amber**
- **Hex**: `#F59E0B`
- **RGB**: `245, 158, 11`
- **HSL**: `38°, 92%, 50%`
- **Tailwind**: `amber-500`
- **Usage**: Expiring soon, action required soon, warnings, attention needed
- **Meaning**: Take action before deadline, remedial training scheduled, approaching expiry

**Amber Variants**
- **Light**: `#FEF3C7` (bg-amber-100) – Backgrounds, badges
- **Dark**: `#D97706` (amber-600) – Hover states, emphasis
- **Very Light**: `#FFFBEB` (bg-amber-50) – Subtle backgrounds, cards

#### Red – Expired/Critical Status

**Primary Red**
- **Hex**: `#EF4444`
- **RGB**: `239, 68, 68`
- **HSL**: `0°, 84%, 60%`
- **Tailwind**: `red-500`
- **Usage**: Expired qualifications, failed assessments, critical alerts, error states
- **Meaning**: Immediate action required, not compliant, cannot operate

**Red Variants**
- **Light**: `#FEE2E2` (bg-red-100) – Backgrounds, badges
- **Dark**: `#DC2626` (red-600) – Hover states, emphasis
- **Very Light**: `#FEF2F2` (bg-red-50) – Subtle backgrounds, cards

### Supporting Colors

**Sky Blue (Information)**
- **Hex**: `#0EA5E9`
- **RGB**: `14, 165, 233`
- **HSL**: `198°, 93%, 49%`
- **Tailwind**: `sky-500`
- **Usage**: Information messages, secondary CTAs, icons
- **Accessibility**: WCAG AA contrast on white (5.1:1)

**Gray Scale (Neutrals)**
- **Slate-100**: `#F1F5F9` – Borders, dividers
- **Slate-200**: `#E2E8F0` – Disabled states, light borders
- **Slate-300**: `#CBD5E1` – Secondary borders
- **Slate-400**: `#94A3B8` – Secondary text
- **Slate-500**: `#64748B` – Tertiary text
- **Slate-600**: `#475569` – Text labels
- **Slate-700**: `#334155` – Body text
- **Slate-900**: `#0F172A` – High contrast text

### Color Usage Guidelines

**Dos**
- ✓ Use green for all success and valid states
- ✓ Use amber for warning and upcoming expiry states
- ✓ Use red for expired and error states
- ✓ Use blue for primary actions and CTAs
- ✓ Use slate gray for text and backgrounds
- ✓ Maintain sufficient contrast ratios (minimum 4.5:1 for text)
- ✓ Use color with text or icons (not color alone)

**Don'ts**
- ✗ Don't use red and green together without text labels (colorblind-friendly)
- ✗ Don't use more than 3 accent colors per screen
- ✗ Don't use brand blue for warning/error states
- ✗ Don't decrease opacity below 60% for critical information
- ✗ Don't use light text on light backgrounds
- ✗ Don't rely on color alone to convey information

### Dark Mode Color Adjustments

For dark mode implementations, adjust colors as follows:

**Dark Mode Palette**
- **Background**: `#0F172A` (slate-900)
- **Surface**: `#1E293B` (slate-800)
- **Border**: `#334155` (slate-700)
- **Text Primary**: `#F1F5F9` (slate-50)
- **Text Secondary**: `#CBD5E1` (slate-300)
- **Accent**: `#60A5FA` (blue-400, lighter than light mode)

**Status Colors in Dark Mode**
- **Green**: `#34D399` (emerald-400) – Increased brightness
- **Amber**: `#FBBF24` (amber-400) – Increased brightness
- **Red**: `#F87171` (red-400) – Increased brightness

---

## Part 3: Typography System

### Typeface Selection

**Primary Font Stack (Headlines & UI)**
-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif

Modern, professional system fonts ensuring maximum readability and platform consistency.

**Secondary Font Stack (Body Text)**
-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif

Clear, legible sans-serif for extended reading and form text.

**Monospace Font Stack (Code & Data)**
"Courier New", Courier, monospace; 

Or web font: `JetBrains Mono`, `Fira Code` for better aesthetics

### Font Sizes & Scales

**Desktop Typography Scale** (4px base unit)

| Level | Size | Line Height | Letter Spacing | Usage |
|-------|------|-------------|-----------------|-------|
| **H1** | 36px (2.25rem) | 1.2 (43px) | -0.02em | Page titles, main headers |
| **H2** | 30px (1.875rem) | 1.3 (39px) | -0.015em | Section headers, dashboard titles |
| **H3** | 24px (1.5rem) | 1.4 (34px) | -0.01em | Subsection headers, form labels |
| **H4** | 20px (1.25rem) | 1.5 (30px) | 0 | Component headers, card titles |
| **H5** | 16px (1rem) | 1.5 (24px) | 0 | Form labels, UI text |
| **Body** | 16px (1rem) | 1.6 (26px) | 0 | Paragraph text, descriptions |
| **Small** | 14px (0.875rem) | 1.5 (21px) | 0 | Secondary text, captions |
| **Micro** | 12px (0.75rem) | 1.4 (17px) | 0.02em | Timestamps, small labels |

**Mobile Typography Scale** (Responsive)

| Level | Size | Line Height |
|-------|------|-------------|
| **H1** | 28px (1.75rem) | 1.3 |
| **H2** | 24px (1.5rem) | 1.4 |
| **H3** | 20px (1.25rem) | 1.4 |
| **Body** | 16px (1rem) | 1.6 |
| **Small** | 14px (0.875rem) | 1.5 |

### Font Weights

| Weight | Value | Usage |
|--------|-------|-------|
| **Regular** | 400 | Body text, descriptions, standard content |
| **Medium** | 500 | Labels, form text, emphasis |
| **Semibold** | 600 | Subheadings, active states, highlights |
| **Bold** | 700 | Headlines, strong emphasis, CTAs |

**Font Weight Usage**
- **H1-H3**: Bold (700) for maximum hierarchy
- **H4-H5**: Semibold (600) for moderate emphasis
- **Labels**: Medium (500) for clear distinction
- **Body**: Regular (400) for readability
- **Captions**: Regular (400) with reduced opacity

### Text Color Hierarchy

| Level | Color | Hex | Contrast | Usage |
|-------|-------|-----|----------|-------|
| **Primary** | Slate-900 | `#0F172A` | 20:1 | Headlines, important text |
| **Secondary** | Slate-700 | `#334155` | 9:1 | Body text, descriptions |
| **Tertiary** | Slate-500 | `#64748B` | 4.5:1 | Secondary text, hints |
| **Disabled** | Slate-300 | `#CBD5E1` | 2:1 | Disabled states, placeholders |
| **Link** | CertifyCloud Blue | `#0066FF` | 6.5:1 | Clickable links, CTAs |

---

## Part 4: Component Library

### Button System

**Primary Button**
- **Background**: CertifyCloud Blue (`#0066FF`)
- **Text**: White
- **Padding**: 12px 24px
- **Border Radius**: 8px
- **Font Size**: 16px, Semibold (600)
- **Hover**: Blue-700 (`#0052CC`)
- **Active**: Blue-800 (`#0041A3`)
- **Disabled**: Slate-200 with Slate-400 text
- **Usage**: Primary actions, form submission, main CTAs

**Secondary Button**
- **Background**: Slate-100
- **Text**: Slate-900
- **Border**: 1px Slate-300
- **Padding**: 12px 24px
- **Border Radius**: 8px
- **Hover**: Slate-50
- **Usage**: Alternative actions, cancellation, secondary navigation

**Tertiary/Ghost Button**
- **Background**: Transparent
- **Text**: CertifyCloud Blue
- **Padding**: 12px 24px
- **Hover**: Blue-50 background
- **Usage**: Less emphasis actions, links, text actions

**Status Action Buttons**
- **Green Background**: For compliant/approve actions
- **Amber Background**: For warning/review actions
- **Red Background**: For urgent/reject actions
- **Only for critical operational actions**

### Form Elements

**Input Fields**
- **Border**: 1px Slate-300
- **Padding**: 10px 14px
- **Border Radius**: 6px
- **Font Size**: 16px
- **Focus**: Blue border (2px), shadow
- **Error**: Red-500 border with error message
- **Disabled**: Slate-100 background, Slate-300 border

**Labels**
- **Position**: Above input field
- **Font Size**: 14px, Medium (500)
- **Color**: Slate-700
- **Required Indicator**: Red asterisk (*), margin-left: 4px

**Error States**
- **Text Color**: Red-600
- **Icon**: ⚠️ or cross icon
- **Position**: Below input field
- **Message**: Clear, actionable instruction

**Placeholder Text**
- **Color**: Slate-400
- **Font Weight**: Regular (400)
- **Opacity**: 100% (use color, not opacity)

### Cards & Surfaces

**Standard Card**
- **Background**: White / Slate-50 (dark mode: Slate-800)
- **Border**: 1px Slate-200
- **Border Radius**: 12px
- **Padding**: 24px
- **Box Shadow**: `0 1px 2px rgba(0,0,0,0.05)`
- **Hover**: Subtle shadow increase

**Traffic Light Status Card**
- **Dimensions**: Responsive, minimum 200px width
- **Content**: Large number (H1), status label (Small), icon
- **Background**: Status color (very light variant)
- **Border**: Status color accent (left border 4px)
- **Cursor**: Pointer (interactive)

**Data Table Card**
- **Header**: Slate-50 background
- **Rows**: Alternating white/Slate-50
- **Padding**: 16px per cell
- **Border**: 1px Slate-200 (top)
- **Hover State**: Slate-50 row highlight

### Badge System

**Status Badges**

| Status | Background | Text | Border | Icon |
|--------|-----------|------|--------|------|
| **Valid** | Emerald-100 | Emerald-800 | Emerald-300 | ✓ |
| **Expiring** | Amber-100 | Amber-800 | Amber-300 | ⚠ |
| **Expired** | Red-100 | Red-800 | Red-300 | ✕ |
| **Pending** | Blue-100 | Blue-800 | Blue-300 | ◐ |

**Badge Styling**
- **Padding**: 4px 12px
- **Border Radius**: 16px
- **Font Size**: 12px, Semibold (600)
- **Border**: 1px (optional)

### Spacing System

**Base Unit**: 4px

**Spacing Scale** (multiples of 4px)

| Size | Value | Tailwind | Usage |
|------|-------|----------|-------|
| **XS** | 4px | px-1 | Minimal spacing |
| **SM** | 8px | px-2 | Compact spacing |
| **MD** | 12px | px-3 | Standard spacing |
| **LG** | 16px | px-4 | Comfortable spacing |
| **XL** | 24px | px-6 | Section spacing |
| **2XL** | 32px | px-8 | Major spacing |
| **3XL** | 48px | px-12 | Large section spacing |

**Margin Guidelines**
- Between sections: 48px (2 base units)
- Between components: 24px (1.5 base units)
- Between elements: 16px (1 base unit)
- Compact spacing: 12px (0.75 base units)

---

## Part 5: Visual Patterns

### Traffic Light Dashboard

**Purpose**: Immediate organizational competence visibility

**Layout Structure**
- 3 equal-width cards
- Green (left), Amber (center), Red (right)
- Each card contains: large number (H1), label (Small), icon

**Typography Hierarchy**
Number (H1, Bold, Color-matching)
     ↓
Label (Body, Medium, Slate-700)
     ↓
Icon (32px, Color-matching)

**Interaction**
- Click to filter personnel table below
- Hover: Subtle shadow and cursor pointer
- Active: Darker background shade

### Data Tables

**Header Row**
- **Background**: Slate-100
- **Font Weight**: Semibold (600)
- **Font Size**: 14px
- **Padding**: 16px
- **Border Bottom**: 2px Slate-300
- **Sortable Columns**: Include up/down arrow icon

**Body Rows**
- **Height**: 48px (minimum)
- **Padding**: 16px
- **Border Bottom**: 1px Slate-200
- **Alternating**: White / Slate-50 backgrounds
- **Hover**: Slate-50 background on white rows

**Action Column**
- **Position**: Rightmost
- **Icon**: Menu/more button (3 dots)
- **Dropdown**: Contextual menu on click
- **Options**: Edit, view, delete (color-coded)

**Responsive Behavior**
- **Mobile**: Stack as cards or horizontal scroll
- **Tablet**: Reduce padding, hide secondary columns
- **Desktop**: Full visibility, sticky headers

### Forms & Workflows

**Form Section Structure**
- **Title**: H3, 24px, Bold
- **Description**: Small, Slate-500 (optional)
- **Fields**: Grouped with 16px vertical spacing
- **Spacing Between Sections**: 48px

**Form Validation**
- **Real-Time**: Validate on blur (input exit)
- **Error Display**: Below field in red text
- **Success Indicator**: Green checkmark on valid input
- **Loading State**: Spinner during validation

**Multi-Step Workflow**
- **Progress Indicator**: 3-5 steps maximum
- **Current Step**: Bold, CertifyCloud Blue
- **Completed Steps**: Green check, Slate text
- **Next Steps**: Slate-300, disabled appearance

---

## Part 6: Applications & Usage

### Website & Landing Page

**Header**
- **Background**: White / Slate-50
- **Logo**: CertifyCloud wordmark (color variant)
- **Navigation**: Slate-700 text, blue hover
- **CTA Button**: Primary blue button

**Hero Section**
- **Background**: Gradient (Blue-50 to Slate-50)
- **Headline**: H1, Slate-900, bold
- **Subheading**: Body, Slate-600
- **CTA**: Primary button + secondary link
- **Image**: Subtle illustration or dashboard screenshot

**Feature Cards**
- **Layout**: 3-column grid (responsive)
- **Card Style**: Standard card with icon
- **Icon**: 48px, CertifyCloud Blue
- **Title**: H4, Slate-900
- **Description**: Small, Slate-600
- **Accent**: Left border in status green

**Pricing Table**
- **Header**: H2, Slate-900
- **Plans**: 3 columns with card styling
- **Pricing**: H2, CertifyCloud Blue
- **Features**: Bulleted list, small text
- **CTA**: Primary button on each card

### Application UI

**Sidebar Navigation**
- **Width**: 260px (collapsed: 60px)
- **Background**: Slate-800 (dark mode) or White (light mode)
- **Text**: Slate-50 on dark, Slate-700 on light
- **Active Item**: CertifyCloud Blue background
- **Icons**: 20px, consistent set (Lucide)
- **Spacing**: 12px between items

**Main Content Area**
- **Max Width**: 1280px
- **Padding**: 32px on desktop, 16px on mobile
- **Background**: Slate-50
- **Header**: Page title (H2) + breadcrumbs

**Dashboard**
- **Top Cards**: Traffic light status cards
- **Tables**: Full-width with horizontal scroll
- **Charts**: Subtle grid, minimal colors
- **Color**: Use only green/amber/red for status

### Marketing Materials

**Color Usage Hierarchy**
1. **Primary**: CertifyCloud Blue (30-40% of design)
2. **Secondary**: Slate grays (40-50% of design)
3. **Accent**: Status colors for emphasis (10-20% of design)

**Print Materials**
- **Business Cards**: White background, blue accent
- **Brochures**: Blue headers, grid layout
- **Presentations**: Slate background, blue accents, consistent spacing
- **Posters**: High contrast, large text, clear CTA

**Social Media**
- **Dimensions**: Maintain 16:9 or 1:1 aspect ratios
- **Text Overlays**: White on blue or blue on white (high contrast)
- **Icons**: Consistent set, 24-48px
- **Spacing**: 16px margins minimum

**Email Templates**
- **Header**: Company name + logo
- **Body**: Slate-700 text on white background
- **CTAs**: Primary blue buttons
- **Footer**: Slate-500 text, links in blue
- **Padding**: 24px minimum

---

## Part 7: Accessibility Standards

### Color Contrast Requirements

**Minimum Contrast Ratios**
- **Normal Text** (< 18pt): 4.5:1 (WCAG AA), 7:1 (WCAG AAA)
- **Large Text** (≥ 18pt): 3:1 (WCAG AA), 4.5:1 (WCAG AAA)
- **UI Components**: 3:1 for borders and focus states
- **Graphical Elements**: 3:1 minimum

**Tested Color Combinations**

| Text Color | Background | Ratio | Level |
|-----------|-----------|-------|-------|
| Slate-900 | White | 20:1 | AAA |
| Slate-700 | White | 9:1 | AAA |
| CertifyCloud Blue | White | 6.5:1 | AA |
| Emerald-500 | White | 4.1:1 | AA |
| White | CertifyCloud Blue | 9:1 | AAA |

### Accessibility Checklist

**Color & Contrast**
- ✓ No information conveyed by color alone
- ✓ All text meets minimum contrast (4.5:1)
- ✓ Status colors paired with icons/text
- ✓ Dark mode colors properly tested
- ✓ Disabled states visually distinct

**Typography**
- ✓ Minimum font size: 12px
- ✓ Line height ≥ 1.4 for body text
- ✓ Letter spacing adequate for readability
- ✓ Font weights support hierarchy
- ✓ No all-caps for extended text

**Interactive Elements**
- ✓ Focus indicators visible (minimum 2px)
- ✓ Touch targets minimum 44px
- ✓ Hover states distinct
- ✓ Error states clear without color only
- ✓ Keyboard navigation fully supported

---

## Part 8: Implementation Guides

### Tailwind CSS Configuration

// tailwind.config.js
module.exports = {
  theme: {
    colors: {
      // Brand colors
      'tcms-blue': '#0066FF',
      'tcms-dark': '#1E293B',
      'tcms-light': '#F1F5F9',
      // Status colors
      emerald: { /* standard Tailwind */ },
      amber: { /* standard Tailwind */ },
      red: { /* standard Tailwind */ },
      // Neutrals
      slate: { /* standard Tailwind */ },
    },
    extend: {
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '24px',
        '2xl': '32px',
        '3xl': '48px',
      },
      fontSize: {
        'h1': ['36px', { lineHeight: '43px', letterSpacing: '-0.02em' }],
        'h2': ['30px', { lineHeight: '39px', letterSpacing: '-0.015em' }],
        'h3': ['24px', { lineHeight: '34px', letterSpacing: '-0.01em' }],
        'h4': ['20px', { lineHeight: '30px' }],
        'body': ['16px', { lineHeight: '26px' }],
        'small': ['14px', { lineHeight: '21px' }],
        'micro': ['12px', { lineHeight: '17px', letterSpacing: '0.02em' }],
      },
    },
  },
}

### CSS Variables (Alternative to Tailwind)

:root {
  /* Brand Colors */
  --color-primary: #0066FF;
  --color-secondary: #1E293B;
  --color-light: #F1F5F9;
  
  /* Status Colors */
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
  
  /* Grayscale */
  --color-slate-50: #F1F5F9;
  --color-slate-100: #E2E8F0;
  --color-slate-200: #CBD5E1;
  --color-slate-300: #94A3B8;
  --color-slate-400: #64748B;
  --color-slate-500: #475569;
  --color-slate-600: #334155;
  --color-slate-700: #1E293B;
  --color-slate-900: #0F172A;
  
  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 12px;
  --spacing-lg: 16px;
  --spacing-xl: 24px;
  --spacing-2xl: 32px;
  --spacing-3xl: 48px;
  
  /* Typography */
  --font-family-base: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
  --font-family-mono: 'Courier New', Courier, monospace;
  --font-size-h1: 36px;
  --font-size-h2: 30px;
  --font-size-body: 16px;
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
}

/* Dark Mode */
@media (prefers-color-scheme: dark) {
  :root {
    --color-background: #0F172A;
    --color-surface: #1E293B;
    --color-text: #F1F5F9;
    --color-primary: #60A5FA;
  }
}

### Component Examples

**Primary Button**
<button class="px-6 py-3 bg-tcms-blue text-white rounded-lg font-semibold 
                 hover:bg-blue-700 active:bg-blue-800 focus:ring-2 
                 focus:ring-blue-500 focus:ring-offset-2 transition-colors">
  Get Started
</button>

**Status Badge**
<!-- Valid -->
<span class="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 
             text-emerald-800 text-sm font-semibold rounded-full 
             border border-emerald-300">
  <span class="w-2 h-2 bg-emerald-500 rounded-full"></span>
  Valid
</span>

<!-- Expiring -->
<span class="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 
             text-amber-800 text-sm font-semibold rounded-full 
             border border-amber-300">
  <span class="w-2 h-2 bg-amber-500 rounded-full"></span>
  Expiring Soon
</span>

<!-- Expired -->
<span class="inline-flex items-center gap-1 px-3 py-1 bg-red-100 
             text-red-800 text-sm font-semibold rounded-full 
             border border-red-300">
  <span class="w-2 h-2 bg-red-500 rounded-full"></span>
  Expired
</span>

**Traffic Light Dashboard**
<div class="grid grid-cols-3 gap-6">
  <!-- Valid -->
  <div class="bg-emerald-50 border-l-4 border-emerald-500 rounded-lg p-6 
              cursor-pointer hover:shadow-lg transition-shadow">
    <div class="text-4xl font-bold text-emerald-600">247</div>
    <div class="text-sm font-medium text-slate-600 mt-2">Valid</div>
    <div class="text-2xl text-emerald-500 mt-4">✓</div>
  </div>
  
  <!-- Expiring -->
  <div class="bg-amber-50 border-l-4 border-amber-500 rounded-lg p-6 
              cursor-pointer hover:shadow-lg transition-shadow">
    <div class="text-4xl font-bold text-amber-600">12</div>
    <div class="text-sm font-medium text-slate-600 mt-2">Expiring Soon</div>
    <div class="text-2xl text-amber-500 mt-4">⚠</div>
  </div>
  
  <!-- Expired -->
  <div class="bg-red-50 border-l-4 border-red-500 rounded-lg p-6 
              cursor-pointer hover:shadow-lg transition-shadow">
    <div class="text-4xl font-bold text-red-600">3</div>
    <div class="text-sm font-medium text-slate-600 mt-2">Expired</div>
    <div class="text-2xl text-red-500 mt-4">✕</div>
  </div>
</div>

---

## Part 9: Brand Asset Repository

### Asset Files Required

**Logos**
- Logo Horizontal (color) – SVG, PNG
- Logo Vertical (color) – SVG, PNG
- Logo Icon Only – SVG, PNG
- Logo Horizontal (white) – SVG, PNG (for dark backgrounds)
- Logo Horizontal (blue) – SVG, PNG (monochrome)

**Guidelines**
- Minimum size: 120px width for horizontal
- Clear space: Equal to icon height on all sides
- No background color (transparent)
- No alterations or effects

**Icon Set**
- 24px grid, square format
- Set: Lucide Icons (recommended)
- Consistent stroke weight (2px)
- All status colors available

**Photography**
- Aviation/professional settings
- Warm lighting, approachable tone
- Diverse people and perspectives
- Consistent color treatment (slight blue overlay optional)

**Illustrations**
- Minimalist, geometric style
- 3 primary colors maximum (blue + 2 supporting)
- SVG format for scalability
- No gradients (solid colors only)

---

## Part 10: Version Control & Updates

### Document Control

**Document Version**: 2.0
**Last Updated**: January 20, 2026
**Next Review**: April 20, 2026 (Quarterly)

### Change Log

| Date | Version | Change | Author |
|------|---------|--------|--------|
| 2026-01-15 | 1.0 | Initial brand identity system (TCMS) | Design Team |
| 2026-01-20 | 2.0 | Rebrand to CertifyCloud with new tagline | Brand Team |

### Update Process

1. **Propose Changes**: Submit changes through design team review
2. **Documentation**: Update this document with change details
3. **Testing**: Verify across all applications before rollout
4. **Communication**: Notify stakeholders of significant changes
5. **Archive**: Save previous versions for reference

---

## Part 11: Quick Reference

### Color Quick Reference

Primary: #0066FF (CertifyCloud Blue)
Dark: #1E293B (Slate-800)
Light: #F1F5F9 (Slate-50)

Valid: #10B981 (Emerald-500)
Warning: #F59E0B (Amber-500)
Error: #EF4444 (Red-500)

### Typography Quick Reference

Headlines (H1-H3): Bold (700)
Subheadings (H4-H5): Semibold (600)
Body Text: Regular (400)
Labels: Medium (500)

H1: 36px, Line 1.2
H2: 30px, Line 1.3
H3: 24px, Line 1.4
Body: 16px, Line 1.6
Small: 14px, Line 1.5

### Spacing Quick Reference

XS: 4px   | SM: 8px  | MD: 12px
LG: 16px  | XL: 24px | 2XL: 32px | 3XL: 48px

Section spacing: 48px
Component spacing: 24px
Element spacing: 16px

---

## Appendix: Further Resources

### Brand Standards Documents
- Full Brand Guidelines (detailed)
- Logo Usage Guidelines
- Typography Specifications
- Color Accessibility Report

### Design Tools
- Figma Component Library
- Adobe XD Design System
- Storybook Component Documentation
- Accessibility Testing Report

### Related Documents
- CertifyCloud UI/UX Design Specification
- CertifyCloud Technical Specification
- CertifyCloud Marketing Guidelines

---

**© 2024-2026 CertifyCloud. All rights reserved. This brand identity system is proprietary and intended for internal use and authorized partners only.**