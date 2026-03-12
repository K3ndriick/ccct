export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Surfaces
        'surface-base':    '#0f0e0d',
        'surface-raised':  '#1a1917',
        'surface-overlay': '#252320',
        'surface-border':  '#2e2c29',
        // Text
        'text-primary':   '#f0ede8',
        'text-secondary': '#9c9790',
        'text-muted':     '#5c5a56',
        // Accent
        'accent':        '#06d472',
        'accent-dim':    '#059950',
        'accent-subtle': '#041f0e',
        // Status
        'status-success': '#22c55e',
        'status-error':   '#ef4444',
        'status-warning': '#eab308',
        'status-info':    '#3b82f6',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
