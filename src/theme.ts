import React, { createContext, useContext } from 'react';

// ---- Palette type ----
export interface Palette {
  canvas: string;
  surface: string;
  surfaceAlpha: string;
  border: string;
  ink: string;
  text: string;
  muted: string;
  accent: string;
  accentSoft: string;
  secondary: string;
  secondarySoft: string;
  teal: string;
  tealSoft: string;
  chip: string;
  petBubble: string;
  ownerBubble: string;
  success: string;
  warning: string;
  danger: string;
}

// ---- Theme definitions ----
// 全テーマ共通の「ニュートラル色」を維持しつつ accent 系だけ変える
const base = {
  surface: '#FFFFFF',
  surfaceAlpha: 'rgba(255, 255, 255, 0.85)',
  ink: '#3C3226',
  success: '#8EAE9B',
  warning: '#D4A96A',
};

const themes = {
  beige: {
    ...base,
    danger: '#C47D6D',
    canvas: '#F5F0EB',
    border: '#E8E0D8',
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
  },
  pink: {
    ...base,
    danger: '#C4707D',
    canvas: '#F8F0F0',
    border: '#E8D8D8',
    text: '#7A6268',
    muted: '#B5A0A6',
    accent: '#D4889B',
    accentSoft: '#F8ECF0',
    secondary: '#B88A94',
    secondarySoft: '#F5E8EC',
    teal: '#8EAE9B',
    tealSoft: '#EDF5F0',
    chip: '#F0E2E6',
    petBubble: '#F5E8EC',
    ownerBubble: '#D4889B',
  },
  blue: {
    ...base,
    danger: '#9B7EAA',
    canvas: '#EEF2F7',
    border: '#D8E0E8',
    text: '#5E6E7A',
    muted: '#9CAAB5',
    accent: '#6A9EC8',
    accentSoft: '#E6F0F8',
    secondary: '#7A9AB0',
    secondarySoft: '#E8F0F5',
    teal: '#8EAE9B',
    tealSoft: '#EDF5F0',
    chip: '#DEE6EE',
    petBubble: '#E8F0F5',
    ownerBubble: '#6A9EC8',
  },
  green: {
    ...base,
    danger: '#B08A6E',
    canvas: '#EFF5F0',
    border: '#D8E8DC',
    text: '#5E7A64',
    muted: '#9CB5A2',
    accent: '#6EAE82',
    accentSoft: '#E6F5EC',
    secondary: '#7AAE8E',
    secondarySoft: '#E8F5EE',
    teal: '#8EAE9B',
    tealSoft: '#EDF5F0',
    chip: '#DEF0E4',
    petBubble: '#E8F5EE',
    ownerBubble: '#6EAE82',
  },
  gray: {
    ...base,
    danger: '#A08080',
    canvas: '#F0F0F0',
    border: '#DCDCDC',
    text: '#6E6E6E',
    muted: '#ABABAB',
    accent: '#8A8A8A',
    accentSoft: '#ECECEC',
    secondary: '#999999',
    secondarySoft: '#E8E8E8',
    teal: '#8EAE9B',
    tealSoft: '#EDF5F0',
    chip: '#E2E2E2',
    petBubble: '#E8E8E8',
    ownerBubble: '#8A8A8A',
  },
} as const satisfies Record<string, Palette>;

export type ThemeKey = keyof typeof themes;
export const THEME_KEYS: ThemeKey[] = ['beige', 'pink', 'blue', 'green', 'gray'];

// テーマ選択UIに使うプレビュー色
export const THEME_PREVIEW_COLORS: Record<ThemeKey, string> = {
  beige: '#C8956C',
  pink: '#D4889B',
  blue: '#6A9EC8',
  green: '#6EAE82',
  gray: '#8A8A8A',
};

export function getPalette(theme: ThemeKey): Palette {
  return themes[theme];
}

// ---- Default export for backward compat (beige) ----
export const palette: Palette = themes.beige;

// ---- Shadow (theme-independent) ----
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

// ---- Theme Context ----
const ThemeContext = createContext<Palette>(themes.beige);

export const ThemeProvider = ThemeContext.Provider;

export function useThemePalette(): Palette {
  return useContext(ThemeContext);
}
