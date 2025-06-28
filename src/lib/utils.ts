import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function hexToRgba(hex: string, alpha: number): string {
  if (!/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
    return hex; // Return original if not a valid hex
  }

  let c: any = hex.substring(1).split('');
  if (c.length === 3) {
    c = [c[0], c[0], c[1], c[1], c[2], c[2]];
  }
  c = '0x' + c.join('');
  
  const r = (c >> 16) & 255;
  const g = (c >> 8) & 255;
  const b = c & 255;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
