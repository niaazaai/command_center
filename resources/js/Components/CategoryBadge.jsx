import React from 'react';
import { cn } from '@/lib/utils';

const DEFAULT_COLOR = '#6b7280';

/**
 * Badge showing category name with its color.
 * @param {{ name: string, color?: string | null }} category
 * @param {string} [className]
 */
export function CategoryBadge({ category, className }) {
  if (!category?.name) return null;
  const bg = category.color || DEFAULT_COLOR;
  const isLight = isLightColor(bg);
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium shrink-0',
        isLight ? 'text-gray-900' : 'text-white',
        className
      )}
      style={{ backgroundColor: bg }}
    >
      {category.name}
    </span>
  );
}

function isLightColor(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  if (h.length !== 6) return false;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6;
}
