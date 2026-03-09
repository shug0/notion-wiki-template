export type NotionColor =
  | "default"
  | "gray"
  | "brown"
  | "orange"
  | "yellow"
  | "green"
  | "blue"
  | "purple"
  | "pink"
  | "red"
  | "gray_background"
  | "brown_background"
  | "orange_background"
  | "yellow_background"
  | "green_background"
  | "blue_background"
  | "purple_background"
  | "pink_background"
  | "red_background";

/**
 * Map des couleurs de texte Notion → Tailwind
 */
const textColorMap: Record<string, string> = {
  default: "text-foreground",
  gray: "text-gray-600 dark:text-gray-400",
  brown: "text-amber-700 dark:text-amber-400",
  orange: "text-orange-600 dark:text-orange-400",
  yellow: "text-yellow-600 dark:text-yellow-400",
  green: "text-green-600 dark:text-green-400",
  blue: "text-blue-600 dark:text-blue-400",
  purple: "text-purple-600 dark:text-purple-400",
  pink: "text-pink-600 dark:text-pink-400",
  red: "text-red-600 dark:text-red-400",
};

/**
 * Map des couleurs de fond Notion → Tailwind
 */
const backgroundColorMap: Record<string, string> = {
  default: "bg-transparent",
  gray_background: "bg-gray-100 dark:bg-gray-800",
  brown_background: "bg-amber-50 dark:bg-amber-950",
  orange_background: "bg-orange-50 dark:bg-orange-950",
  yellow_background: "bg-yellow-50 dark:bg-yellow-950",
  green_background: "bg-green-50 dark:bg-green-950",
  blue_background: "bg-blue-50 dark:bg-blue-950",
  purple_background: "bg-purple-50 dark:bg-purple-950",
  pink_background: "bg-pink-50 dark:bg-pink-950",
  red_background: "bg-red-50 dark:bg-red-950",
};

/**
 * Map pour les highlights (mark/surlignage)
 */
const highlightColorMap: Record<string, string> = {
  default: "bg-yellow-200 dark:bg-yellow-900/40",
  gray: "bg-gray-200 dark:bg-gray-800",
  brown: "bg-amber-200 dark:bg-amber-900/40",
  orange: "bg-orange-200 dark:bg-orange-900/40",
  yellow: "bg-yellow-200 dark:bg-yellow-900/40",
  green: "bg-green-200 dark:bg-green-900/40",
  blue: "bg-blue-200 dark:bg-blue-900/40",
  purple: "bg-purple-200 dark:bg-purple-900/40",
  pink: "bg-pink-200 dark:bg-pink-900/40",
  red: "bg-red-200 dark:bg-red-900/40",
};

/**
 * Map pour les bordures (callout, quote, etc.)
 */
const borderColorMap: Record<string, string> = {
  default: "border-border",
  gray: "border-gray-300 dark:border-gray-700",
  brown: "border-amber-300 dark:border-amber-700",
  orange: "border-orange-300 dark:border-orange-700",
  yellow: "border-yellow-300 dark:border-yellow-700",
  green: "border-green-300 dark:border-green-700",
  blue: "border-blue-300 dark:border-blue-700",
  purple: "border-purple-300 dark:border-purple-700",
  pink: "border-pink-300 dark:border-pink-700",
  red: "border-red-300 dark:border-red-700",
};

/**
 * Obtient la classe Tailwind pour une couleur de texte Notion
 */
export function getTextColor(color?: string | null): string {
  if (!color) return textColorMap.default;
  return textColorMap[color] || textColorMap.default;
}

/**
 * Obtient la classe Tailwind pour une couleur de fond Notion
 */
export function getBackgroundColor(color?: string | null): string {
  if (!color) return backgroundColorMap.default;

  // Si c'est une couleur simple, ajouter "_background"
  if (color && !color.endsWith("_background")) {
    const bgColor = `${color}_background`;
    return backgroundColorMap[bgColor] || backgroundColorMap.default;
  }

  return backgroundColorMap[color] || backgroundColorMap.default;
}

/**
 * Obtient la classe Tailwind pour un highlight/surlignage
 */
export function getHighlightColor(color?: string | null): string {
  if (!color) return highlightColorMap.default;
  return highlightColorMap[color] || highlightColorMap.default;
}

/**
 * Obtient la classe Tailwind pour une bordure colorée
 */
export function getBorderColor(color?: string | null): string {
  if (!color) return borderColorMap.default;
  return borderColorMap[color] || borderColorMap.default;
}
