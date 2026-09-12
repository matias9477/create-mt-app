/**
 * Project configuration: everything the templates need to render.
 * All derivations (slug, bundle id, app group, pascal case, accent RGB)
 * live here so prompts/flags and templates stay dumb.
 */

export interface ProjectConfig {
  appName: string;
  slug: string;
  bundleId: string;
  appGroup: string;
  /** Lowercase feature name used for folders, tables, and routes (e.g. "items"). */
  feature: string;
  /** PascalCase feature name (e.g. "Items"). */
  featurePascal: string;
  /** Accent color as hex, e.g. "#fcba03". */
  accent: string;
  targetDir: string;
  appleTeamId: string;
  appleId: string;
  expoOwner: string;
  dbName: string;
}

export const DEFAULTS = {
  bundlePrefix: "com.matiasturra",
  appleTeamId: "7VJ997Q842",
  appleId: "matias.turra@gmail.com",
  expoOwner: "matias.turra",
  accent: "#fcba03",
  feature: "items",
};

const JS_RESERVED = new Set([
  "break", "case", "catch", "class", "const", "continue", "debugger", "default", "delete",
  "do", "else", "enum", "export", "extends", "false", "finally", "for", "function", "if",
  "import", "in", "instanceof", "new", "null", "return", "super", "switch", "this", "throw",
  "true", "try", "typeof", "var", "void", "while", "with", "yield", "let", "static", "await",
]);

export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

/** Feature names become JS identifiers, SQL table names, and file names. */
export function normalizeFeature(input: string): string {
  const cleaned = slugify(input).replace(/-/g, "");
  return cleaned;
}

export function validateFeature(feature: string): string | undefined {
  if (!feature) return "Feature name is required";
  if (!/^[a-z][a-z0-9]*$/.test(feature)) {
    return "Feature must start with a letter and contain only lowercase letters/digits";
  }
  if (JS_RESERVED.has(feature)) return `"${feature}" is a reserved word`;
  return undefined;
}

export function validateBundleId(id: string): string | undefined {
  // Must also be a valid Android package: each segment starts with a letter.
  if (!/^[A-Za-z][A-Za-z0-9_]*(\.[A-Za-z][A-Za-z0-9_]*)+$/.test(id)) {
    return "Bundle id must look like com.company.app (each segment starts with a letter)";
  }
  return undefined;
}

export function validateAccent(hex: string): string | undefined {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return "Accent must be a 6-digit hex color like #fcba03";
  return undefined;
}

export function toPascal(feature: string): string {
  return feature.charAt(0).toUpperCase() + feature.slice(1);
}

/** "#fcba03" -> "252 186 3" (space-separated RGB triplet for CSS variables). */
export function hexToRgbTriplet(hex: string): string {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  return `${r} ${g} ${b}`;
}

/** Foreground that stays readable on the accent (simple luminance check). */
export function accentForegroundTriplet(hex: string): string {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance > 145 ? "23 23 23" : "255 255 255";
}

/** Token map consumed by the template renderer. Keys appear literally in template files. */
export function buildTokens(config: ProjectConfig): Record<string, string> {
  return {
    __APP_NAME__: config.appName,
    __SLUG__: config.slug,
    __BUNDLE_ID__: config.bundleId,
    __APP_GROUP__: config.appGroup,
    __FEATURE_PASCAL__: config.featurePascal,
    __FEATURE__: config.feature,
    __ACCENT_RGB__: hexToRgbTriplet(config.accent),
    __ACCENT_ON_RGB__: accentForegroundTriplet(config.accent),
    __ACCENT__: config.accent,
    __DB_NAME__: config.dbName,
    __APPLE_TEAM_ID__: config.appleTeamId,
    __APPLE_ID__: config.appleId,
    __EXPO_OWNER__: config.expoOwner,
  };
}
