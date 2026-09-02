/**
 * Local, curated Lucide icon registry for Vesper.
 *
 * The registry keeps the runtime deterministic and avoids a CDN or a copy of
 * SVG markup in individual UI components. Icon geometry follows Lucide's
 * 24x24 stroke-based conventions.
 */

const ICONS = Object.freeze({
  'user-round': Object.freeze([
    '<circle cx="12" cy="8" r="5" />',
    '<path d="M20 21a8 8 0 0 0-16 0" />'
  ]),
  'log-out': Object.freeze([
    '<path d="m16 17 5-5-5-5" />',
    '<path d="M21 12H9" />',
    '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />'
  ]),
  eye: Object.freeze([
    '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />',
    '<circle cx="12" cy="12" r="3" />'
  ]),
  'eye-off': Object.freeze([
    '<path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />',
    '<path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />',
    '<path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />',
    '<path d="m2 2 20 20" />'
  ]),
  save: Object.freeze([
    '<path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />',
    '<path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7" />',
    '<path d="M7 3v4a1 1 0 0 0 1 1h7" />'
  ]),
  'rotate-ccw': Object.freeze([
    '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />',
    '<path d="M3 3v5h5" />'
  ]),
  backpack: Object.freeze([
    '<path d="M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />',
    '<path d="M8 10h8" />',
    '<path d="M8 18h8" />',
    '<path d="M8 22v-6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v6" />',
    '<path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />'
  ]),
  'book-open': Object.freeze([
    '<path d="M12 5v16" />',
    '<path d="M20.001 19A2 2 0 0 0 22 17V5a2 2 0 0 0-1.999-2L16 3.002A5 5 0 0 0 12 5a5 5 0 0 0-4-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 1.999 2H8a5 5 0 0 1 4 2 5 5 0 0 1 4-2z" />'
  ]),
  'settings-2': Object.freeze([
    '<path d="M14 17H5" />',
    '<path d="M19 7h-9" />',
    '<circle cx="17" cy="17" r="3" />',
    '<circle cx="7" cy="7" r="3" />'
  ]),
  'chevron-right': Object.freeze([
    '<path d="m9 18 6-6-6-6" />'
  ]),
  'arrow-left': Object.freeze([
    '<path d="m12 19-7-7 7-7" />',
    '<path d="M19 12H5" />'
  ]),
  x: Object.freeze([
    '<path d="M18 6 6 18" />',
    '<path d="m6 6 12 12" />'
  ]),
  'shield-check': Object.freeze([
    '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />',
    '<path d="m9 12 2 2 4-4" />'
  ]),
  play: Object.freeze([
    '<path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z" />'
  ])
});

export const ICON_REGISTRY = ICONS;
export const ICON_NAMES = Object.freeze(Object.keys(ICONS));

function escapeAttribute(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeText(value) {
  return escapeAttribute(value).replace(/'/g, '&#39;');
}

function assertIconName(name) {
  if (!Object.prototype.hasOwnProperty.call(ICONS, name)) {
    throw new RangeError(`Unknown Vesper icon: ${String(name)}`);
  }
}

/**
 * Return whether the curated registry contains an icon name.
 */
export function hasIcon(name) {
  return Object.prototype.hasOwnProperty.call(ICONS, name);
}

/**
 * Render a registered icon as deterministic inline SVG markup.
 *
 * A label, title or tooltip makes an icon informative. Without one, the
 * helper marks the SVG decorative so text remains the accessible action.
 */
export function icon(name, options = {}) {
  assertIconName(name);

  const {
    size = '1em',
    strokeWidth = 1.5,
    className = '',
    label = '',
    ariaLabel = '',
    'aria-label': explicitAriaLabel = '',
    title = '',
    tooltip = '',
    decorative = false,
    ...attributes
  } = options;
  const accessibleText = label || ariaLabel || explicitAriaLabel || tooltip || title;
  const classes = ['vesper-icon', className].filter(Boolean).join(' ');
  const customAttributes = Object.entries(attributes)
    .filter(([key]) => /^(aria-|data-)/.test(key) || ['id', 'role', 'tabindex', 'focusable'].includes(key))
    .map(([key, value]) => `${key}="${escapeAttribute(value)}"`)
    .join(' ');
  const accessibilityAttributes = decorative || !accessibleText
    ? 'aria-hidden="true" focusable="false"'
    : `role="img" aria-label="${escapeAttribute(accessibleText)}" focusable="false"`;
  const titleMarkup = tooltip || title ? `<title>${escapeText(tooltip || title)}</title>` : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${escapeAttribute(size)}" height="${escapeAttribute(size)}" fill="none" stroke="currentColor" stroke-width="${escapeAttribute(strokeWidth)}" stroke-linecap="round" stroke-linejoin="round" class="${escapeAttribute(classes)}" data-icon="${escapeAttribute(name)}" ${accessibilityAttributes}${customAttributes ? ` ${customAttributes}` : ''}>${titleMarkup}${ICONS[name].join('')}</svg>`;
}

/**
 * Create a registered icon as an SVGElement in browser contexts.
 */
export function createIcon(name, options = {}) {
  if (typeof document === 'undefined') {
    throw new Error('createIcon requires a browser document');
  }
  const template = document.createElement('template');
  template.innerHTML = icon(name, options);
  return template.content.firstElementChild;
}

export function getIconNames() {
  return [...ICON_NAMES];
}
