import { StyleSheet } from 'react-native';

// Shared color tokens matching the web app's aesthetic
export const Colors = {
  // Primary
  blue50: '#eff6ff',
  blue100: '#dbeafe',
  blue200: '#bfdbfe',
  blue500: '#3b82f6',
  blue600: '#2563eb',
  blue700: '#1d4ed8',

  // Slate
  slate50: '#f8fafc',
  slate100: '#f1f5f9',
  slate200: '#e2e8f0',
  slate300: '#cbd5e1',
  slate400: '#94a3b8',
  slate500: '#64748b',
  slate600: '#475569',
  slate700: '#334155',
  slate800: '#1e293b',
  slate900: '#0f172a',

  // Emerald
  emerald50: '#ecfdf5',
  emerald100: '#d1fae5',
  emerald500: '#10b981',
  emerald600: '#059669',
  emerald700: '#047857',

  // Rose
  rose50: '#fff1f2',
  rose100: '#fee2e2',
  rose200: '#fecaca',
  rose500: '#f43f5e',
  rose600: '#e11d48',
  rose700: '#be123c',

  // Amber
  amber50: '#fffbeb',
  amber100: '#fef3c7',
  amber500: '#f59e0b',
  amber600: '#d97706',
  amber700: '#b45309',

  // Purple
  purple50: '#faf5ff',
  purple100: '#f3e8ff',
  purple700: '#7c3aed',

  // Pink
  pink50: '#fdf2f8',
  pink100: '#fce7f3',
  pink700: '#be185d',

  // Indigo
  indigo50: '#eef2ff',
  indigo100: '#e0e7ff',
  indigo700: '#4338ca',

  // Misc
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
};

// Common shadow style
export const shadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 3,
};

export const shadowSm = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.04,
  shadowRadius: 4,
  elevation: 2,
};

// Common styles
export const commonStyles = StyleSheet.create({
  // Containers
  screenContainer: {
    flex: 1,
    backgroundColor: Colors.slate50,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.slate200,
    ...shadow,
    overflow: 'hidden',
  },
  cardPadded: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.slate200,
    padding: 20,
    ...shadow,
  },

  // Typography
  h1: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.slate900,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.slate900,
  },
  h3: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.slate800,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.slate500,
    marginTop: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.slate400,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // Inputs
  input: {
    backgroundColor: Colors.slate50,
    borderWidth: 1,
    borderColor: Colors.slate200,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.slate800,
  },

  // Buttons
  buttonPrimary: {
    backgroundColor: Colors.blue600,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...shadowSm,
  },
  buttonPrimaryText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  buttonSecondary: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
    borderColor: Colors.slate200,
  },
  buttonSecondaryText: {
    color: Colors.slate600,
    fontSize: 15,
    fontWeight: '600',
  },

  // Badges
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Errors & Success
  errorBox: {
    backgroundColor: Colors.rose50,
    borderWidth: 1,
    borderColor: Colors.rose200,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 13,
    color: Colors.rose700,
  },
  successBox: {
    backgroundColor: Colors.emerald50,
    borderWidth: 1,
    borderColor: Colors.emerald100,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  successText: {
    fontSize: 13,
    color: Colors.emerald700,
  },

  // Row
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  rowBetween: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
});
