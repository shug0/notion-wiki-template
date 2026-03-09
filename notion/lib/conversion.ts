import type { Block, Decoration } from "notion-types";
import type { RichTextItem } from "../types";

/**
 * Converts legacy notion-types Decoration[] format to modern RichTextItem[] format.
 * This allows using TextRenderer with blocks that only have 'properties.title'.
 *
 * Decoration format: [["text content", [["format_type", "value"], ...]], ...]
 * Example: [["Hello", [["b"]]], [" world", [["i"]]]]
 */
export function convertDecorationToRichText(
  decorations?: Decoration[],
): RichTextItem[] {
  if (!decorations || decorations.length === 0) return [];

  return decorations.map((decoration) => {
    const textContent = decoration[0];
    const formats = decoration[1] || [];

    const annotations: RichTextItem["annotations"] = {
      bold: false,
      italic: false,
      strikethrough: false,
      underline: false,
      code: false,
      color: "default",
    };

    let href: string | undefined;
    let type: RichTextItem["type"] = "text";
    let mention: RichTextItem["mention"];

    // Process formatting annotations
    formats.forEach((format) => {
      const formatType = format[0];
      const formatValue = format[1];

      switch (formatType) {
        case "b":
          annotations.bold = true;
          break;
        case "i":
          annotations.italic = true;
          break;
        case "_":
          annotations.underline = true;
          break;
        case "s":
          annotations.strikethrough = true;
          break;
        case "c":
          annotations.code = true;
          break;
        case "h":
          if (typeof formatValue === "string") {
            annotations.color = formatValue;
          }
          break;
        case "a":
          if (typeof formatValue === "string") {
            href = formatValue;
          }
          break;
        case "p":
          if (typeof formatValue === "string") {
            type = "mention";
            mention = {
              type: "page",
              pageId: formatValue,
            };
          }
          break;
        case "eoi":
          if (typeof formatValue === "string") {
            type = "mention";
            mention = {
              type: "external_object",
              eoiId: formatValue,
            };
          }
          break;
        case "d":
          if (formatValue && typeof formatValue === "object") {
            const d = formatValue as {
              type?: string;
              start_date?: string;
              start_time?: string;
              end_date?: string;
              end_time?: string;
              time_zone?: string;
            };
            type = "mention";
            mention = {
              type: "date",
              dateType: (d.type ?? "date") as
                | "date"
                | "datetime"
                | "daterange"
                | "datetimerange",
              startDate: d.start_date ?? "",
              startTime: d.start_time,
              endDate: d.end_date,
              endTime: d.end_time,
              timeZone: d.time_zone,
            };
          } else {
            type = "mention";
          }
          break;
      }
    });

    return {
      type,
      text:
        type === "text"
          ? {
              content: textContent,
              link: href ? { url: href } : null,
            }
          : undefined,
      mention,
      annotations,
      plain_text: textContent,
      href,
    };
  });
}

/**
 * Type guard to check if a block has modern rich_text format
 */
function hasRichText(
  block: Block,
  fieldName: string,
): block is Block & {
  [key: string]: { rich_text: RichTextItem[] };
} {
  return (
    fieldName in block &&
    typeof block[fieldName as keyof Block] === "object" &&
    block[fieldName as keyof Block] !== null &&
    "rich_text" in (block[fieldName as keyof Block] as object)
  );
}

/**
 * Type guard to check if a block has legacy properties.title format
 */
function hasLegacyTitle(block: Block): block is Block & {
  properties: { title: Decoration[] };
} {
  return (
    "properties" in block &&
    typeof block.properties === "object" &&
    block.properties !== null &&
    "title" in block.properties &&
    Array.isArray(block.properties.title)
  );
}

/**
 * Extracts text content from a block, handling both modern and legacy formats.
 * This is the single source of truth for content extraction.
 *
 * @param block - Any Notion block that may contain text content
 * @param fieldName - For modern blocks, the field name (e.g., "heading_1", "paragraph")
 * @returns Normalized RichTextItem[] array
 */
export function getBlockContent(
  block: Block,
  fieldName?: string,
): RichTextItem[] {
  // Try modern format first (if fieldName is provided)
  if (fieldName && hasRichText(block, fieldName)) {
    return block[fieldName].rich_text;
  }

  // Fallback to legacy format (properties.title)
  if (hasLegacyTitle(block)) {
    return convertDecorationToRichText(block.properties.title);
  }

  // Return empty array if no content found
  return [];
}

/**
 * Joins all RichTextItem segments into a plain string, discarding annotations.
 */
export function richTextToPlainText(items: RichTextItem[]): string {
  return items
    .map((item) => item.plain_text ?? item.text?.content ?? "")
    .join("");
}
