/** @type {import('tailwindcss').Config} */
const ch = (v) => `rgb(var(${v}) / <alpha-value>)`;

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // raw graphite ramp (for new components)
        graphite: {
          0: ch('--g-000'), 50: ch('--g-050'), 100: ch('--g-100'),
          150: ch('--g-150'), 200: ch('--g-200'), 250: ch('--g-250'),
          300: ch('--g-300'), 350: ch('--g-350'),
        },
        // semantic surfaces (existing names kept so the reskin is inherited)
        'surface-void':          ch('--g-000'),
        'surface-base':          ch('--g-050'),
        'surface-raised':        ch('--g-100'),
        'surface-header':        ch('--g-150'),
        'surface-overlay':       ch('--g-200'),
        'surface-hover':         ch('--g-250'),
        'surface-border':        ch('--line'),
        'surface-border-strong': ch('--g-300'),
        'surface-emphasis':      ch('--g-350'),
        // text
        'text-primary':   ch('--text'),
        'text-secondary': ch('--text-2'),
        'text-muted':     ch('--text-3'),
        'text-faint':     ch('--text-4'),
        // accent — rationed green
        'accent':         ch('--accent'),
        'accent-dim':     ch('--accent-dim'),
        'accent-subtle':  'rgb(var(--accent) / 0.12)',
        'accent-line':    'rgb(var(--accent) / 0.30)',
        'on-accent':      ch('--on-accent'),
        // status
        'status-success': ch('--status-success'),
        'status-error':   ch('--status-error'),
        'status-warning': ch('--status-warning'),
        'status-info':    ch('--status-info'),
        // tools
        'tool-read':     ch('--tool-read'),
        'tool-write':    ch('--tool-write'),
        'tool-edit':     ch('--tool-edit'),
        'tool-bash':     ch('--tool-bash'),
        'tool-glob':     ch('--tool-glob'),
        'tool-thinking': ch('--text-3'),
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
