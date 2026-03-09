import { cva, type VariantProps } from "class-variance-authority";

/**
 * Design tokens for Notion blocks.
 * Centralized Tailwind classes for consistency across all block components.
 * Integrates with the Tailwind v4 setup in globals.css.
 */
export const notionTokens = {
  spacing: {
    nestedContent: "pl-4 md:pl-6",
    caption: "mt-2",
  },
  borders: {
    default: "border",
    rounded: "rounded-lg",
    nestedContent: "border-l-2 border-border",
    quote: "border-l-2",
  },
  text: {
    caption: "text-sm text-center text-muted-foreground",
    heading1: "scroll-m-20 font-bold tracking-tight",
    heading2: "scroll-m-20 font-semibold tracking-tight",
    heading3: "scroll-m-20 font-semibold tracking-tight",
    body: "",
  },
  colors: {
    muted: "bg-muted",
  },
} as const;

/**
 * CVA variants for MediaFigure component
 */
export const mediaFigureVariants = cva("", {
  variants: {
    spacing: {
      default: "",
      compact: "",
      none: "",
    },
  },
  defaultVariants: {
    spacing: "default",
  },
});

/**
 * CVA variants for NotionIcon component
 */
export const notionIconVariants = cva("flex items-center justify-center", {
  variants: {
    size: {
      sm: "w-3.5 h-3.5 text-sm",
      md: "w-4 h-4 text-base",
      lg: "w-5 h-5 text-lg",
      xl: "w-6 h-6 text-2xl md:w-8 md:h-8 md:text-3xl",
      "2xl": "w-7 h-7 text-2xl",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

/**
 * CVA variants for Callout component
 */
export const calloutVariants = cva(
  "p-5 rounded-lg flex flex-col gap-2 md:flex-row md:items-start md:gap-3 border",
  {
    variants: {
      color: {
        gray: "bg-[#f1f1ef] dark:bg-[#2f2f2f]",
        brown: "bg-[#f4eeee] dark:bg-[#3d3229]",
        orange: "bg-[#fbecdd] dark:bg-[#4a3422]",
        yellow: "bg-[#fef3c7] dark:bg-[#4d3f1a]",
        green: "bg-[#edf3ec] dark:bg-[#2b3d2b]",
        blue: "bg-[#e7f3f8] dark:bg-[#203a43]",
        purple: "bg-[#f3ecf8] dark:bg-[#3a2d43]",
        pink: "bg-[#fce7f3] dark:bg-[#432d3a]",
        red: "bg-[#ffe2dd] dark:bg-[#4a2d2d]",
      },
    },
    defaultVariants: {
      color: "gray",
    },
  },
);

export type MediaFigureVariants = VariantProps<typeof mediaFigureVariants>;
export type NotionIconVariants = VariantProps<typeof notionIconVariants>;
export type CalloutColor = NonNullable<
  VariantProps<typeof calloutVariants>["color"]
>;
