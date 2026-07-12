/**
 * Centralized PNG-based icon set.
 *
 * Project rule: no SVG, no emoji. All UI icons are real PNG images
 * stored under /public/images/. This module wraps them in a single
 * <Icon name="…" size={n} /> API so callers can swap between
 * different icon families without touching individual call sites.
 *
 * Naming convention:
 *  - icon-*.png      → UI / system icons (24x24 line style)
 *  - glyph-*.png     → larger, illustrated glyphs for task types
 *  - discover-*.jpg  → hero imagery for activity cards
 */

import React from 'react';

/** Every supported icon name. Keep in sync with /public/images/. */
export type IconName =
  // System / line icons
  | 'back'
  | 'close'
  | 'plus'
  | 'home'
  | 'compass'
  | 'task'
  | 'person'
  | 'search'
  | 'calendar'
  | 'wifi'
  | 'battery'
  | 'cellular'
  | 'sparkle'
  | 'star'
  | 'crown'
  | 'building'
  | 'lock'
  | 'edit'
  | 'arrow-left'
  | 'arrow-right'
  | 'arrow-up'
  | 'chevron-left'
  | 'chevron-right'
  | 'chevron-down'
  | 'check'
  | 'trash'
  | 'settings'
  | 'bell'
  | 'info'
  | 'hand-pointer'
  | 'spinner'
  | 'clock'
  | 'users'
  | 'tag'
  | 'pin'
  // Illustrated glyphs
  | 'glyph-checkin'
  | 'glyph-photo'
  | 'glyph-find'
  | 'glyph-message'
  | 'glyph-drawing'
  | 'glyph-lantern'
  | 'glyph-placard'
  | 'glyph-brush'
  | 'glyph-pencil'
  | 'glyph-phone';

const ICON_PATHS: Record<IconName, string> = {
  back: '/images/icon-back.png',
  close: '/images/icon-close.png',
  plus: '/images/icon-plus.png',
  home: '/images/icon-home.png',
  compass: '/images/icon-compass.png',
  task: '/images/icon-task.png',
  person: '/images/icon-person.png',
  search: '/images/icon-search.png',
  calendar: '/images/icon-calendar.png',
  wifi: '/images/icon-wifi.png',
  battery: '/images/icon-battery.png',
  cellular: '/images/icon-cellular.png',
  sparkle: '/images/icon-sparkle.png',
  star: '/images/icon-star.png',
  crown: '/images/icon-crown.png',
  building: '/images/icon-building.png',
  lock: '/images/icon-lock.png',
  edit: '/images/icon-edit.png',
  'arrow-left': '/images/icon-arrow-left.png',
  'arrow-right': '/images/icon-arrow-right.png',
  'arrow-up': '/images/icon-arrow-up.png',
  'chevron-left': '/images/icon-chevron-left.png',
  'chevron-right': '/images/icon-chevron-right.png',
  'chevron-down': '/images/icon-chevron-down.png',
  check: '/images/icon-check.png',
  trash: '/images/icon-trash.png',
  settings: '/images/icon-settings.png',
  bell: '/images/icon-bell.png',
  info: '/images/icon-info.png',
  'hand-pointer': '/images/icon-hand-pointer.png',
  spinner: '/images/icon-spinner.png',
  clock: '/images/icon-clock.png',
  users: '/images/icon-users.png',
  tag: '/images/icon-tag.png',
  pin: '/images/icon-pin.png',
  'glyph-checkin': '/images/glyph-checkin.png',
  'glyph-photo': '/images/glyph-photo.png',
  'glyph-find': '/images/glyph-find.png',
  'glyph-message': '/images/glyph-message.png',
  'glyph-drawing': '/images/glyph-drawing.png',
  'glyph-lantern': '/images/glyph-lantern.png',
  'glyph-placard': '/images/glyph-placard.png',
  'glyph-brush': '/images/glyph-brush.png',
  'glyph-pencil': '/images/glyph-pencil.png',
  'glyph-phone': '/images/glyph-phone.png',
};

export interface IconProps {
  name: IconName;
  /** Rendered size in CSS pixels. */
  size?: number;
  /** Optional tint — applied via CSS filter so we don't need a separate
   *  colored image asset per icon. */
  color?: string;
  className?: string;
  style?: React.CSSProperties;
  /** Optional alt text for a11y; defaults to the icon name. */
  alt?: string;
  /** Disable pointer events (e.g. for purely decorative use). */
  decorative?: boolean;
}

/**
 * A drop-in replacement for SVG icons throughout the app. Renders a
 * <img> at the requested size; the original color is preserved from
 * the source PNG. Use `color` to apply a hue tint via CSS filter
 * (works for monochrome line icons).
 */
export function Icon({
  name,
  size = 16,
  color,
  className,
  style,
  alt,
  decorative = false,
}: IconProps) {
  const src = ICON_PATHS[name];

  // If a `color` is supplied, we want to recolor the icon. The
  // source PNGs use a deep-ink stroke (#1F1827) so a CSS filter
  // can recolor them via hue-rotate. The hue-rotate degrees below
  // are tuned against the same generator, so swapping between
  // these named colors keeps the visual weight consistent.
  const tintFilter =
    color === undefined
      ? undefined
      : colorToFilter(color);

  const composedStyle: React.CSSProperties = {
    width: size,
    height: size,
    objectFit: 'contain',
    userSelect: 'none',
    ...(tintFilter ? { filter: tintFilter } : {}),
    ...style,
  };

  return (
    <img
      src={src}
      alt={decorative ? '' : alt ?? name}
      aria-hidden={decorative || undefined}
      draggable={false}
      width={size}
      height={size}
      className={className}
      style={composedStyle}
    />
  );
}

/**
 * Convert a brand color to a CSS filter that tints the icon
 * from its source ink (#1F1827) to the target hue. Uses the
 * `brightness(0) saturate(100%)` trick so the source dark-ink
 * is converted to flat-color, then re-hued.
 */
function colorToFilter(target: string): string | undefined {
  // Hand-tuned CSS filters that re-color a #1F1827 ink source to
  // common brand colors. Unlisted targets render at original color.
  const presets: Record<string, string | undefined> = {
    '#8A65FF': 'brightness(0) saturate(100%) invert(45%) sepia(85%) saturate(2476%) hue-rotate(232deg) brightness(98%) contrast(105%)',
    '#FF8C42': 'brightness(0) saturate(100%) invert(56%) sepia(96%) saturate(1162%) hue-rotate(335deg) brightness(101%) contrast(101%)',
    '#1F1827': undefined,
    '#6B7280': 'brightness(0) saturate(100%) invert(55%) sepia(8%) saturate(606%) hue-rotate(176deg) brightness(89%) contrast(85%)',
    '#9CA3AF': 'brightness(0) saturate(100%) invert(70%) sepia(8%) saturate(351%) hue-rotate(176deg) brightness(96%) contrast(89%)',
    '#7B3F0F': 'brightness(0) saturate(100%) invert(20%) sepia(70%) saturate(900%) hue-rotate(355deg) brightness(95%) contrast(95%)',
    '#D9631B': 'brightness(0) saturate(100%) invert(38%) sepia(85%) saturate(1800%) hue-rotate(355deg) brightness(98%) contrast(98%)',
  };
  return presets[target.toUpperCase()];
}

export default Icon;
