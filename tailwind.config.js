/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // TCMS Brand Colors
                'tcms-blue': '#0066FF',
                'tcms-dark': '#1E293B',
                'tcms-light': '#F1F5F9',
                
                // Semantic colors maintaining shadcn/ui structure
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
                sidebar: {
                    DEFAULT: 'hsl(var(--sidebar-background))',
                    foreground: 'hsl(var(--sidebar-foreground))',
                    primary: 'hsl(var(--sidebar-primary))',
                    'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
                    accent: 'hsl(var(--sidebar-accent))',
                    'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
                    border: 'hsl(var(--sidebar-border))',
                    ring: 'hsl(var(--sidebar-ring))'
                }
            },
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
                'h1': ['36px', { lineHeight: '43px', letterSpacing: '-0.02em', fontWeight: '700' }],
                'h2': ['30px', { lineHeight: '39px', letterSpacing: '-0.015em', fontWeight: '700' }],
                'h3': ['24px', { lineHeight: '34px', letterSpacing: '-0.01em', fontWeight: '700' }],
                'h4': ['20px', { lineHeight: '30px', fontWeight: '600' }],
                'h5': ['16px', { lineHeight: '24px', fontWeight: '600' }],
                'body': ['16px', { lineHeight: '26px', fontWeight: '400' }],
                'small': ['14px', { lineHeight: '21px', fontWeight: '400' }],
                'micro': ['12px', { lineHeight: '17px', letterSpacing: '0.02em', fontWeight: '400' }],
            },
            fontWeight: {
                'regular': '400',
                'medium': '500',
                'semibold': '600',
                'bold': '700',
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)'
            },
            keyframes: {
                "accordion-down": {
                    from: { height: "0" },
                    to: { height: "var(--radix-accordion-content-height)" },
                },
                "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)" },
                    to: { height: "0" },
                },
                "fade-in": {
                    from: { opacity: "0" },
                    to: { opacity: "1" },
                },
                "fade-in-up": {
                    from: { opacity: "0", transform: "translateY(10px)" },
                    to: { opacity: "1", transform: "translateY(0)" },
                },
                "fade-in-down": {
                    from: { opacity: "0", transform: "translateY(-10px)" },
                    to: { opacity: "1", transform: "translateY(0)" },
                },
                "scale-in": {
                    from: { opacity: "0", transform: "scale(0.95)" },
                    to: { opacity: "1", transform: "scale(1)" },
                },
                "slide-in-right": {
                    from: { opacity: "0", transform: "translateX(10px)" },
                    to: { opacity: "1", transform: "translateX(0)" },
                },
                "slide-in-left": {
                    from: { opacity: "0", transform: "translateX(-10px)" },
                    to: { opacity: "1", transform: "translateX(0)" },
                },
                "pulse-subtle": {
                    "0%, 100%": { opacity: "1" },
                    "50%": { opacity: "0.8" },
                },
                "shimmer": {
                    from: { backgroundPosition: "-200% 0" },
                    to: { backgroundPosition: "200% 0" },
                },
                "bounce-subtle": {
                    "0%, 100%": { transform: "translateY(0)" },
                    "50%": { transform: "translateY(-3px)" },
                },
                "wiggle": {
                    "0%, 100%": { transform: "rotate(0deg)" },
                    "25%": { transform: "rotate(-2deg)" },
                    "75%": { transform: "rotate(2deg)" },
                },
                "glow-pulse": {
                    "0%, 100%": { boxShadow: "0 0 0 0 hsl(var(--primary) / 0.4)" },
                    "50%": { boxShadow: "0 0 0 8px hsl(var(--primary) / 0)" },
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
                "fade-in": "fade-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                "fade-in-up": "fade-in-up 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                "fade-in-down": "fade-in-down 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                "scale-in": "scale-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                "slide-in-right": "slide-in-right 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                "slide-in-left": "slide-in-left 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                "pulse-subtle": "pulse-subtle 2s ease-in-out infinite",
                "shimmer": "shimmer 2s linear infinite",
                "bounce-subtle": "bounce-subtle 1s ease-in-out infinite",
                "wiggle": "wiggle 0.5s ease-in-out",
                "glow-pulse": "glow-pulse 2s ease-in-out infinite",
            },
            transitionTimingFunction: {
                "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
                "out-back": "cubic-bezier(0.34, 1.56, 0.64, 1)",
                "spring": "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
            },
            transitionDuration: {
                "fast": "150ms",
                "base": "200ms",
                "slow": "300ms",
                "slower": "500ms",
            },
            backdropBlur: {
                xs: "2px",
            },
            boxShadow: {
                "soft-sm": "0 1px 2px hsl(var(--foreground) / 0.03), 0 2px 4px hsl(var(--foreground) / 0.04)",
                "soft": "0 1px 2px hsl(var(--foreground) / 0.03), 0 4px 8px hsl(var(--foreground) / 0.04), 0 12px 24px hsl(var(--foreground) / 0.05)",
                "soft-lg": "0 2px 4px hsl(var(--foreground) / 0.02), 0 8px 16px hsl(var(--foreground) / 0.04), 0 24px 48px hsl(var(--foreground) / 0.06)",
                "glow-sm": "0 0 15px hsl(var(--primary) / 0.3)",
                "glow": "0 0 25px hsl(var(--primary) / 0.4)",
                "glow-lg": "0 0 40px hsl(var(--primary) / 0.5)",
                "glow-success": "0 0 20px rgba(16, 185, 129, 0.4)",
                "glow-warning": "0 0 20px rgba(245, 158, 11, 0.4)",
                "glow-danger": "0 0 20px rgba(239, 68, 68, 0.4)",
            },
        }
    },
    plugins: [require("tailwindcss-animate")],
}
