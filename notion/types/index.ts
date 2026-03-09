import type { Block, Decoration } from "notion-types";

/**
 * Union type for blocks that can contain text content
 */
export type TextContentBlock = Block & {
  properties?: {
    title?: Decoration[];
  };
};

/**
 * Modern heading block types
 */
export type ModernHeadingBlock = Block & {
  type: "heading_1" | "heading_2" | "heading_3";
  heading_1?: { rich_text: RichTextItem[] };
  heading_2?: { rich_text: RichTextItem[] };
  heading_3?: { rich_text: RichTextItem[] };
};

/**
 * Legacy heading block types
 */
export type LegacyHeadingBlock = Block & {
  type: "header" | "sub_header" | "sub_sub_header";
  properties: {
    title: Decoration[];
  };
};

/**
 * Modern paragraph block
 */
export type ModernParagraphBlock = Block & {
  type: "paragraph";
  paragraph: { rich_text: RichTextItem[] };
};

/**
 * Legacy text block
 */
export type LegacyTextBlock = Block & {
  type: "text";
  properties: {
    title: Decoration[];
  };
};

/**
 * Union of all heading types
 */
export type HeadingBlock = ModernHeadingBlock | LegacyHeadingBlock;

/**
 * Union of all paragraph types
 */
export type ParagraphBlock = ModernParagraphBlock | LegacyTextBlock;

export interface RichTextItem {
  type: "text" | "mention" | "equation";
  text?: {
    content: string;
    link: { url: string } | null;
  };
  mention?:
    | {
        type: "page";
        pageId: string;
      }
    | {
        type: "external_object";
        eoiId: string;
      }
    | {
        type: "date";
        dateType: "date" | "datetime" | "daterange" | "datetimerange";
        startDate: string;
        startTime?: string;
        endDate?: string;
        endTime?: string;
        timeZone?: string;
      };
  annotations: {
    bold: boolean;
    italic: boolean;
    strikethrough: boolean;
    underline: boolean;
    code: boolean;
    color: string;
  };
  plain_text: string;
  href?: string | null;
}

/**
 * Type for Notion page icons.
 * notion-types defines page_icon as string only,
 * but the runtime structure can be more complex.
 */
export type NotionIconType =
  | string
  | { type: "emoji"; emoji: string }
  | { type: "external"; external: { url: string } }
  | { type: "file"; file: { url: string } }
  | undefined;

/**
 * Collection types for database rendering
 */
export type {
  Collection,
  CollectionPropertySchema,
  CollectionView,
  PropertyType,
} from "notion-types";

/**
 * Notion relation property schema (extends CollectionPropertySchema).
 * `property` is the key of the inverse relation in the same collection
 * (e.g. WkKf.property = "wvi]" for a self-referential parent↔children pair).
 * Not included in notion-types@7.7.3.
 */
export type RelationPropertySchema =
  import("notion-types").CollectionPropertySchema & {
    property?: string;
  };
