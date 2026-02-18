---
name: responsive-design
description: Use this skill when styling components or fixing layout bugs in the CertifyCloud frontend to ensure functional visibility on mobile, tablet, and desktop viewports.
---

# Responsive Design Standards (Tailwind + React)

## Goal

Ensure all platform views remain functional, visible, and broken-free across device sizes (320px to 1920px+), regardless of the specific layout strategy chosen.

## Technical Strategy: Mobile-First

- **Base classes apply to mobile:** Write the default Tailwind class for the smallest screen first.
- **Overrides for larger screens:** Use `sm:`, `md:`, `lg:`, `xl:` prefixes only when the layout needs to change for that specific breakpoint.
- **Avoid fixed container widths:** Prefer percentages (`w-full`, `w-1/2`), max-widths (`max-w-screen-xl`), or flex/grid fractions over rigid pixel values (e.g., `w-[800px]`) which cause horizontal overflow.

## Viewport Compatibility

| Prefix | Min Width | Target Device Range             |
| ------ | --------- | ------------------------------- |
| (base) | 0px       | Mobile Portrait                 |
| `sm:`  | 640px     | Mobile Landscape / Large Phones |
| `md:`  | 768px     | Tablets (Portrait)              |
| `lg:`  | 1024px    | Tablets (Landscape) / Laptops   |
| `xl:`  | 1280px    | Desktop Monitors                |

## Usability Requirements

### 1. Touch & Interaction

- **Touch Targets:** Ensure interactive elements (buttons, inputs, icons) have sufficient padding/size on mobile (min ~44px height/width recommended).
- **Hover States:** Do not hide critical functionality behind `:hover` states, as these are inaccessible on touch devices. Use explicit toggles or `active:` states instead.
- **Input Zoom:** Ensure font sizes on inputs are adequate to prevent auto-zooming on iOS devices (typically `text-base` or 16px).

### 2. Layout Flexibility

- **Overflow Handling:** Prevent unintentional horizontal scrolling. Use `overflow-x-auto` explicitly if a component (like a wide table) is intended to scroll horizontally.
- **Flexibility:** Ensure flex containers allow wrapping (`flex-wrap`) or switching direction (`flex-col` to `flex-row`) if content becomes too cramped.

### 3. Visibility Control

- If a UI element is too complex for mobile, consider using display utilities (`hidden` / `block`) to swap it for a simplified version, rather than forcing a broken layout.
- Ensure modals and drawers fit within the viewport height on smaller screens (`h-screen` vs `h-full` considerations).

## Verification Checklist (DoD)

Before finalizing UI changes, verify:

1.  **Mobile (approx 375px):** No unintentional horizontal scroll; text is readable; buttons are clickable.
2.  **Tablet (approx 768px):** Layout adapts without excessive whitespace or cramping.
3.  **Desktop (1024px+):** Components utilize available space effectively.
