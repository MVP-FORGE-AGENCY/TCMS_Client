# UI/UX Specification

## Design Philosophy

TCMS allows for complex data management while maintaining a clean, accessible, and error-proof user interface. The design prioritizes **clarity**, **speed**, and **safety** (reducing flight safety risks by reducing admin errors).

### Core Principles

1. **Clarity First**: Information hierarchy and clear visual communication
2. **Speed**: Fast interactions and minimal loading times
3. **Safety**: Error prevention and clear feedback
4. **Accessibility**: Usable by all users, including those with disabilities
5. **Consistency**: Consistent patterns and interactions throughout

## Design System

### Component Library

**Shadcn UI**
- Professional, accessible component library
- Built on Radix Primitives for accessibility
- Customizable with Tailwind CSS
- TypeScript support
- Dark mode support

### Color Palette

**Primary Colors**
- **Slate/Blue-grey**: Professional aviation aesthetic
- **Primary Blue**: `hsl(221.2 83.2% 53.3%)` - Primary actions, links
- **Slate**: `hsl(222.2 84% 4.9%)` - Text, backgrounds

**Functional Colors**
- 🟢 **Green (Emerald-500)**: `hsl(142.1 76.2% 36.3%)`
  - Valid status
  - Passed results
  - Compliant state
  - Success messages

- 🟡 **Amber (Amber-500)**: `hsl(43.3 96.4% 56.3%)`
  - Expiring soon status
  - Warning messages
  - Remedial action required
  - Attention needed

- 🔴 **Red (Red-500)**: `hsl(0 84.2% 60.2%)`
  - Expired status
  - Failed results
  - Critical alerts
  - Error messages

**Neutral Colors**
- **Gray Scale**: For backgrounds, borders, and text
- **White/Black**: High contrast for readability

### Typography

**Font Stack**
- **Primary**: System fonts (San Francisco, Segoe UI, etc.)
- **Monospace**: For code, IDs, timestamps
- **Sizes**: Responsive typography scale

**Hierarchy**
- **H1**: Page titles (2.25rem / 36px)
- **H2**: Section titles (1.875rem / 30px)
- **H3**: Subsection titles (1.5rem / 24px)
- **Body**: Default text (1rem / 16px)
- **Small**: Secondary text (0.875rem / 14px)

### Spacing

**Spacing Scale**
- Consistent 4px base unit
- Scale: 4, 8, 12, 16, 24, 32, 48, 64px
- Responsive spacing for mobile/tablet/desktop

### Layout

**Grid System**
- 12-column grid (desktop)
- Responsive breakpoints:
  - Mobile: < 640px
  - Tablet: 640px - 1024px
  - Desktop: > 1024px

**Container Widths**
- Max width: 1280px (desktop)
- Padding: 16px (mobile), 24px (tablet), 32px (desktop)

## Key UI Patterns

### 1. Traffic Light Dashboard

**Purpose**: Instant situational awareness of organizational competence status

**Implementation**:
- **Three Status Cards**: Green (Valid), Amber (Expiring Soon), Red (Expired)
- **Aggregated Counts**: Total counts per status category
- **Interactive**: Click cards to filter personnel table
- **Visual Hierarchy**: Large numbers, clear labels, color-coded

**Design Details**:
- Card-based layout
- Large number display (2rem+)
- Status color as accent
- Hover effects for interactivity
- Responsive grid layout

### 2. Data Tables

**Purpose**: Display and manage large datasets (personnel, sessions, checks)

**Features**:
- **Sorting**: Click column headers to sort
- **Filtering**: Search and filter controls
- **Pagination**: Page-based navigation
- **Row Actions**: Context menu or action buttons
- **Selection**: Multi-select for bulk operations
- **Responsive**: Horizontal scroll on mobile

**Design Details**:
- Alternating row colors for readability
- Hover states for rows
- Sticky headers on scroll
- Compact mode for dense data
- Export buttons for CSV/PDF

### 3. Forms

**Purpose**: Data input and editing

**Features**:
- **Validation**: Real-time inline validation
- **Error Messages**: Clear, actionable error messages
- **Required Fields**: Visual indicators (*)
- **Help Text**: Contextual help and tooltips
- **Auto-save**: Draft saving for long forms (future)

**Design Details**:
- Label above input (not inline)
- Consistent input heights
- Focus states clearly visible
- Error states with red border and message
- Success states with green checkmark

### 4. Proficiency Check Workflow

**Flow**: Schedule → Conduct (Grading) → Sign → Finalize

**Grading UI**:
- **Scale Display**: Clear 1-5 or 1-4 scale visualization
- **Input Methods**: Radio buttons or sliders
- **Element Breakdown**: Grade each element separately
- **Overall Result**: Calculated from element grades
- **Comments**: Text area for assessor comments

**Signature Pad**:
- **Modal Dialog**: Full-screen or large modal
- **Canvas**: Drawing canvas for signature
- **Clear Button**: Reset signature
- **Submit Button**: Confirm and save
- **Preview**: Show signature preview before submission

### 5. Modals & Drawers

**Purpose**: Context-preserving actions without losing place

**Use Cases**:
- Edit user/profile
- View detailed history
- Quick actions
- Confirmation dialogs

**Design Details**:
- **Modals**: Centered overlay for important actions
- **Drawers**: Slide-in from side for secondary actions
- **Backdrop**: Semi-transparent backdrop
- **Close Button**: Clear close button (X)
- **Escape Key**: Close on Escape key
- **Click Outside**: Close on backdrop click (optional)

### 6. Navigation

**Purpose**: Primary navigation and user orientation

**Components**:
- **Sidebar Navigation**: Collapsible sidebar menu
- **Breadcrumbs**: Show current location
- **User Menu**: Profile and logout
- **Search**: Global search (future)

**Design Details**:
- **Active State**: Highlight current page
- **Icons**: Lucide icons for visual recognition
- **Labels**: Clear text labels
- **Mobile**: Hamburger menu on mobile
- **Collapsible**: Collapse sidebar for more space

### 7. Status Indicators

**Purpose**: Visual status communication

**Traffic Light System**:
- 🟢 **Green Dot**: Valid, compliant
- 🟡 **Amber Dot**: Expiring soon, attention needed
- 🔴 **Red Dot**: Expired, critical

**Badge Components**:
- **Status Badges**: Colored badges with text
- **Count Badges**: Number badges for counts
- **Icon Badges**: Icon + text badges

### 8. Direct Feedback

**Toasts (Sonner)**:
- **Success**: Green toast with checkmark icon
- **Error**: Red toast with X icon
- **Warning**: Amber toast with warning icon
- **Info**: Blue toast with info icon
- **Position**: Bottom-right (default)
- **Auto-dismiss**: 3-5 seconds
- **Manual Dismiss**: Click to dismiss

**Inline Validation**:
- **Real-time**: Validate on blur or change
- **Error Messages**: Below input field
- **Success Indicators**: Green checkmark on valid input
- **Loading States**: Spinner during validation

**Loading States**:
- **Skeleton Screens**: Placeholder content during loading
- **Spinners**: For actions and buttons
- **Progress Bars**: For long operations
- **Optimistic Updates**: Update UI before server response

## Responsive Design

### Mobile (< 640px)

**Adaptations**:
- Single column layout
- Collapsible navigation
- Stacked form fields
- Touch-friendly targets (44px minimum)
- Simplified tables (cards or list view)
- Bottom navigation for primary actions

### Tablet (640px - 1024px)

**Adaptations**:
- Two-column layouts where appropriate
- Sidebar navigation (collapsible)
- Optimized table views
- Touch-friendly interactions
- Landscape/portrait support

### Desktop (> 1024px)

**Adaptations**:
- Multi-column layouts
- Persistent sidebar navigation
- Full table views with all columns
- Hover states and interactions
- Keyboard shortcuts

## Accessibility (a11y)

### WCAG 2.1 Compliance

**Level AA Compliance** (Target)

**Color Contrast**:
- **Text**: Minimum 4.5:1 contrast ratio
- **Large Text**: Minimum 3:1 contrast ratio
- **UI Components**: Minimum 3:1 contrast ratio
- **Status Colors**: Use both color and text/icons

**Keyboard Navigation**:
- **Tab Order**: Logical tab order
- **Focus Indicators**: Clear focus states
- **Keyboard Shortcuts**: Common shortcuts (Enter, Escape, etc.)
- **Skip Links**: Skip to main content

**Screen Readers**:
- **Semantic HTML**: Proper HTML semantics
- **ARIA Labels**: Descriptive labels for interactive elements
- **Alt Text**: Alt text for images
- **Live Regions**: Announce dynamic content changes

**Visual Accessibility**:
- **High Contrast Mode**: Support for high contrast
- **Text Scaling**: Support for text scaling up to 200%
- **Focus Indicators**: Clear, visible focus indicators
- **Error Identification**: Clear error identification

### Implementation

**Radix Primitives**:
- Built-in accessibility features
- Keyboard navigation support
- ARIA attributes automatically applied
- Focus management

**Testing**:
- Screen reader testing (NVDA, JAWS, VoiceOver)
- Keyboard-only navigation testing
- Color contrast checking
- Automated accessibility testing (axe, Lighthouse)

## Dark Mode

### Theme Support

**Implementation**:
- **next-themes**: Theme management
- **System Preference**: Respects OS theme preference
- **Manual Toggle**: Theme switcher in UI
- **Persistence**: Saves preference in localStorage

**Design Considerations**:
- **Contrast**: Maintain contrast ratios in dark mode
- **Colors**: Adjust colors for dark backgrounds
- **Images**: Consider dark mode variants
- **Consistency**: Consistent theming across components

## Animation & Transitions

### Principles

- **Purposeful**: Animations serve a purpose
- **Subtle**: Not distracting or excessive
- **Fast**: Quick transitions (150-300ms)
- **Smooth**: Easing functions for natural motion

### Common Animations

- **Page Transitions**: Fade or slide transitions
- **Modal Open/Close**: Fade + scale animation
- **Button Hover**: Subtle scale or color change
- **Loading**: Skeleton screens or spinners
- **Toast**: Slide-in from bottom-right

## Error Handling

### Error States

**404 Not Found**:
- Clear message
- Helpful navigation options
- Search functionality (if applicable)

**500 Server Error**:
- User-friendly error message
- Retry button
- Support contact information

**Validation Errors**:
- Inline error messages
- Clear indication of problematic fields
- Suggestions for correction

**Network Errors**:
- Retry mechanism
- Offline indicator
- Graceful degradation

## Performance Optimization

### Loading Performance

- **Code Splitting**: Route-based code splitting
- **Lazy Loading**: Load components on demand
- **Image Optimization**: Optimized images, lazy loading
- **Font Loading**: Optimize font loading

### Interaction Performance

- **Debouncing**: Debounce search inputs
- **Throttling**: Throttle scroll events
- **Virtual Scrolling**: For large lists
- **Optimistic Updates**: Update UI before server response

## User Testing & Feedback

### Usability Testing

- **User Interviews**: Regular user interviews
- **Usability Testing**: Test with real users
- **A/B Testing**: Test different designs
- **Analytics**: Track user behavior

### Feedback Collection

- **In-App Feedback**: Feedback widget
- **Surveys**: Periodic user surveys
- **Support Tickets**: Learn from support tickets
- **Analytics**: Track user interactions

## Design Tokens

### Spacing Scale
```
0: 0px
1: 4px
2: 8px
3: 12px
4: 16px
5: 20px
6: 24px
8: 32px
10: 40px
12: 48px
16: 64px
```

### Border Radius
```
sm: 2px
md: 4px
lg: 8px
xl: 12px
full: 9999px
```

### Shadows
```
sm: 0 1px 2px rgba(0,0,0,0.05)
md: 0 4px 6px rgba(0,0,0,0.1)
lg: 0 10px 15px rgba(0,0,0,0.1)
xl: 0 20px 25px rgba(0,0,0,0.1)
```

## Component Guidelines

### Buttons

- **Primary**: Main actions (blue)
- **Secondary**: Secondary actions (gray)
- **Destructive**: Delete/dangerous actions (red)
- **Ghost**: Subtle actions (transparent)
- **Sizes**: sm, md, lg
- **States**: Default, hover, active, disabled, loading

### Inputs

- **Text Input**: Standard text input
- **Textarea**: Multi-line text input
- **Select**: Dropdown selection
- **Checkbox**: Boolean selection
- **Radio**: Single selection from group
- **Date Picker**: Date selection
- **File Upload**: File selection

### Cards

- **Default Card**: Standard content card
- **Interactive Card**: Clickable card
- **Stat Card**: Dashboard stat card
- **Profile Card**: User/profile card

### Tables

- **Default Table**: Standard data table
- **Sortable Table**: Sortable columns
- **Selectable Table**: Row selection
- **Responsive Table**: Mobile-optimized

## Best Practices

### Do's

- ✅ Use consistent spacing and sizing
- ✅ Provide clear feedback for all actions
- ✅ Use appropriate color for status
- ✅ Ensure keyboard accessibility
- ✅ Test on multiple devices
- ✅ Use semantic HTML
- ✅ Provide alt text for images
- ✅ Maintain color contrast ratios

### Don'ts

- ❌ Rely solely on color for status
- ❌ Use small touch targets (< 44px)
- ❌ Hide important information
- ❌ Use excessive animations
- ❌ Break keyboard navigation
- ❌ Ignore screen readers
- ❌ Use low contrast text
- ❌ Overwhelm users with options
