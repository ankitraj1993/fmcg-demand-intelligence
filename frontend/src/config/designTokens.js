// Enterprise Dark Theme - Professional SaaS Design
export const colors = {
  // Dark Theme
  bg: {
    primary: '#0F1419',     // Almost black
    secondary: '#1A1F2E',   // Dark navy
    tertiary: '#252D3D',    // Slightly lighter
    hover: '#2D3749',       // Hover state
  },
  
  // Text
  text: {
    primary: '#FFFFFF',     // Pure white
    secondary: '#E4E6EB',   // Light gray
    tertiary: '#A8ADB5',    // Medium gray
    disabled: '#6B7280',    // Disabled text
  },
  
  // Accents - Professional
  accent: {
    primary: '#00D4FF',     // Bright cyan/blue
    secondary: '#7C3AED',   // Purple
    tertiary: '#06B6D4',    // Teal
  },
  
  // Status
  success: '#10B981',       // Green
  warning: '#F59E0B',       // Orange
  danger: '#EF4444',        // Red
  info: '#3B82F6',          // Blue
  
  // Borders
  border: {
    light: '#2D3749',       // Lighter borders
    default: '#1F2937',     // Default borders
    dark: '#111827',        // Dark borders
  },
  
  // Gradients
  gradient: {
    blue: 'linear-gradient(135deg, #00D4FF 0%, #3B82F6 100%)',
    purple: 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)',
    teal: 'linear-gradient(135deg, #06B6D4 0%, #0D9488 100%)',
  }
};

export const typography = {
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  h1: { fontSize: '32px', fontWeight: 700, lineHeight: '40px', letterSpacing: '-0.5px' },
  h2: { fontSize: '28px', fontWeight: 700, lineHeight: '36px', letterSpacing: '-0.3px' },
  h3: { fontSize: '20px', fontWeight: 600, lineHeight: '28px' },
  h4: { fontSize: '16px', fontWeight: 600, lineHeight: '24px' },
  body: { fontSize: '14px', fontWeight: 400, lineHeight: '20px' },
  bodySmall: { fontSize: '12px', fontWeight: 400, lineHeight: '16px' },
  label: { fontSize: '12px', fontWeight: 600, lineHeight: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' },
};

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
};

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
  md: '0 4px 12px 0 rgba(0, 0, 0, 0.4)',
  lg: '0 10px 30px 0 rgba(0, 0, 0, 0.5)',
  xl: '0 20px 40px 0 rgba(0, 0, 0, 0.6)',
};

export const radius = {
  xs: '2px',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
};
