export const palette = {
  canvas: '#F5F0EB',
  surface: '#FFFFFF',
  border: '#E8E0D8',
  ink: '#3C3226',
  text: '#7A6E62',
  muted: '#B5AAA0',
  accent: '#C8956C',
  accentSoft: '#F5EDE6',
  secondary: '#A68B6B',
  secondarySoft: '#F0E8DE',
  teal: '#8EAE9B',
  tealSoft: '#EDF5F0',
  chip: '#EDE6DE',
  petBubble: '#F0E8DE',
  ownerBubble: '#C8956C',
  success: '#8EAE9B',
  warning: '#D4A96A',
  danger: '#C47D6D',
} as const;

export const shadow = {
  sm: {
    shadowColor: '#8B7B6B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#8B7B6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#8B7B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
} as const;
