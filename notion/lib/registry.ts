import type { Block, ExtendedRecordMap } from "notion-types";
import { CodeBlock } from "../blocks/data/code.block";
import { CollectionBlock } from "../blocks/data/collection.block";
import { CollectionPageBlock } from "../blocks/data/collection-page.block";
import { TableBlock, TableRowBlock } from "../blocks/data/table.block";
import { CalloutBlock } from "../blocks/layout/callout.block";
import { ColumnBlock } from "../blocks/layout/column.block";
import { ColumnListBlock } from "../blocks/layout/column-list.block";
import { DividerBlock } from "../blocks/layout/divider.block";
import { FormBlock } from "../blocks/layout/form.block";
import { PageBlock } from "../blocks/layout/page.block";
import { TableOfContentsBlock } from "../blocks/layout/table-of-contents.block";
import { ToggleBlock } from "../blocks/layout/toggle.block";
import { BookmarkBlock } from "../blocks/media/bookmark.block";
import { EmbedBlock } from "../blocks/media/embed.block";
import { FileBlock } from "../blocks/media/file.block";
import { ImageBlock } from "../blocks/media/image.block";
import { LinkPreviewBlock } from "../blocks/media/link-preview.block";
import { VideoBlock } from "../blocks/media/video.block";
import { HeadingBlock } from "../blocks/text/heading.block";
import { ListBlock } from "../blocks/text/list.block";
import { ParagraphBlock } from "../blocks/text/paragraph.block";
import { QuoteBlock } from "../blocks/text/quote.block";
import { ToDoBlock } from "../blocks/text/todo.block";

export type BlockComponentProps = {
  block: Block;
  recordMap: ExtendedRecordMap;
  level?: number;
  type?: string;
  [key: string]: unknown;
};

/**
 * Block components accept varying block subtypes, so we use a broad function
 * signature at the registry boundary. Each component narrows internally.
 */
export type BlockComponent = (props: BlockComponentProps) => React.ReactNode;

/**
 * Helper to register block components. Handles the variance mismatch between
 * specific block types (e.g., ColumnBlock) and the generic Block type.
 */
function register<T extends (props: never) => React.ReactNode>(
  component: T,
): BlockComponent {
  return component as unknown as BlockComponent;
}

export const blockRegistry: Record<string, BlockComponent> = {
  column_list: register(ColumnListBlock),
  column: register(ColumnBlock),
  paragraph: register(ParagraphBlock),
  text: register(ParagraphBlock), // Legacy
  to_do: register(ToDoBlock),
  toggle: register(ToggleBlock),
  table_of_contents: register(TableOfContentsBlock),
  quote: register(QuoteBlock),
  callout: register(CalloutBlock),
  divider: register(DividerBlock),
  image: register(ImageBlock),
  video: register(VideoBlock),
  audio: register(VideoBlock), // Reuse video layout for audio
  file: register(FileBlock),
  pdf: register(FileBlock),
  table: register(TableBlock),
  table_row: register(TableRowBlock),
  page: register(PageBlock),
  bookmark: register(BookmarkBlock),
  embed: register(EmbedBlock),
  link_preview: register(LinkPreviewBlock),
  collection_view_page: register(CollectionPageBlock), // Show as link with collection title/icon
  collection_view: register(CollectionBlock), // Show inline table (if data available)
  code: register(CodeBlock),
  form: register(FormBlock),
};

/**
 * Configuration for a block component including extra props
 */
export interface BlockConfig {
  Component: BlockComponent;
  props?: Record<string, unknown>;
}

/**
 * Functional registry for blocks that need extra props (like headings and lists)
 */
export const getBlockComponent = (type: string): BlockConfig | null => {
  // Direct mappings
  if (blockRegistry[type]) {
    return { Component: blockRegistry[type] };
  }

  // Heading logic
  if (
    type.startsWith("heading_") ||
    ["header", "sub_header", "sub_sub_header"].includes(type)
  ) {
    let level = 1;
    if (type === "heading_2" || type === "sub_header") level = 2;
    if (type === "heading_3" || type === "sub_sub_header") level = 3;

    return {
      Component: register(HeadingBlock),
      props: { level },
    };
  }

  // List logic
  if (type.includes("list_item") || type === "bulleted_list") {
    return {
      Component: register(ListBlock),
      props: { type },
    };
  }

  return null;
};
