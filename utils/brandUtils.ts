/**
 * Utility functions for brand color management
 * Handles dynamic CSS variable updates based on BrandSettings
 */

import { BrandSettings } from '../types';

/**
 * Default brand settings (Indigo)
 */
export const DEFAULT_BRAND_SETTINGS: BrandSettings = {
  primaryColor: {
    hue: 221.2,
    saturation: 83.2,
    lightness: 53.3
  },
  organizationName: 'EventMaster LMK'
};

/**
 * Applies brand settings to CSS variables
 * Updates the :root CSS variables dynamically
 */
export const applyBrandSettings = (settings: BrandSettings): void => {
  const root = document.documentElement;
  
  // Update primary color HSL values
  root.style.setProperty('--primary-hue', settings.primaryColor.hue.toString());
  root.style.setProperty('--primary-saturation', `${settings.primaryColor.saturation}%`);
  root.style.setProperty('--primary-lightness', `${settings.primaryColor.lightness}%`);
  
  // Update primary foreground (optional - could be calculated for contrast)
  // For now, keeping default foreground unless needed
};

/**
 * Resets brand settings to default
 */
export const resetBrandSettings = (): void => {
  applyBrandSettings(DEFAULT_BRAND_SETTINGS);
};

/**
 * Converts hex color to HSL
 * Useful when users provide hex colors
 */
export const hexToHsl = (hex: string): { hue: number; saturation: number; lightness: number } => {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Parse RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  
  return {
    hue: Math.round(h * 360),
    saturation: Math.round(s * 100),
    lightness: Math.round(l * 100)
  };
};

/**
 * Converts HSL to hex color
 * Useful for displaying color preview
 */
export const hslToHex = (h: number, s: number, l: number): string => {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

