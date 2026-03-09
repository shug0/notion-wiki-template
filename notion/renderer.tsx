import type { Decoration, ExtendedRecordMap } from "notion-types";
import {
  isPrivateAccessEnabled,
  PRIVATE_TOGGLE,
  PUBLIC_TOGGLE,
} from "@/lib/auth/constants";
import { getSessionStore } from "@/lib/auth/session-cache";
import { FallBackBlock } from "./blocks/data/fallback.block";
import { BlockChildren } from "./lib/block-children";
import { convertDecorationToRichText } from "./lib/conversion";
import { getBlockData } from "./lib/notion-compat";
import { getBlockComponent } from "./lib/registry";
import type { RichTextItem } from "./types";
import { PrivateContentBlock } from "./blocks/layout/private-content.block";

interface NotionBlockRendererProps {
  blockId: string;
  recordMap: ExtendedRecordMap;
}

type ToggleMarker =
  | { marker: typeof PRIVATE_TOGGLE; requiredRolePageId: string | undefined; label: RichTextItem[] }
  | { marker: typeof PUBLIC_TOGGLE }
  | null;

/**
 * Detect 🔒 / 🔏 toggles and extract role from page mention.
 *
 * 🔒 [@RolePage] → private content, role = page ID of the mention
 * 🔏             → public fallback, visible to non-authenticated only
 *
 * Role is a Notion page mention: decoration ["‣", [["p", "pageId"]]]
 */
function parseToggleMarker(block: {
  type: string;
  properties?: Record<string, unknown>;
}): ToggleMarker {
  if (block.type !== "toggle") return null;

  const titleRaw = block.properties?.title;
  if (!Array.isArray(titleRaw)) return null;

  const decorations = titleRaw as [string, [string, unknown][]?][];
  const firstText = decorations[0]?.[0] ?? "";

  if (firstText.startsWith(PUBLIC_TOGGLE)) return { marker: PUBLIC_TOGGLE };

  if (firstText.startsWith(PRIVATE_TOGGLE)) {
    let requiredRolePageId: string | undefined;
    let mentionIndex = -1;
    for (let i = 0; i < decorations.length; i++) {
      const formats = decorations[i][1];
      if (!formats) continue;
      for (const fmt of formats) {
        if (fmt[0] === "p" && typeof fmt[1] === "string") {
          requiredRolePageId = fmt[1].replace(/-/g, "");
          mentionIndex = i;
          break;
        }
      }
      if (requiredRolePageId) break;
    }
    const afterMention = mentionIndex >= 0
      ? (decorations.slice(mentionIndex + 1) as Decoration[])
      : [];
    // Strip residual ] from bracket convention and leading whitespace
    const cleaned: Decoration[] = afterMention
      .map(([text, fmt], i) => [i === 0 ? text.replace(/^\s*\]?\s*/, "") : text, fmt] as Decoration)
      .filter(([text]) => text.length > 0);
    const label = convertDecorationToRichText(cleaned);
    return { marker: PRIVATE_TOGGLE, requiredRolePageId, label };
  }

  return null;
}

/**
 * Centrally manages the rendering of Notion blocks by looking up their type
 * in the block registry.
 */
export function NotionBlockRenderer({
  blockId,
  recordMap,
}: NotionBlockRendererProps) {
  const block = getBlockData(recordMap, blockId);

  if (!block) {
    if (process.env.NODE_ENV === "development") {
      return (
        <div className="text-destructive text-sm p-1 border border-dashed border-destructive/20 rounded">
          ❌ Block {blockId} missing in recordMap
        </div>
      );
    }
    return null;
  }

  // Private/public toggle interception — before registry lookup
  if (isPrivateAccessEnabled()) {
    const marker = parseToggleMarker(
      block as { type: string; properties?: Record<string, unknown> },
    );

    if (marker !== null) {
      const { user: session } = getSessionStore();

      if (marker.marker === PRIVATE_TOGGLE) {
        const hasAccess =
          session !== null &&
          (marker.requiredRolePageId === undefined ||
            session.roles.includes(marker.requiredRolePageId));
        if (!hasAccess) return <PrivateContentBlock label={marker.label} recordMap={recordMap} />;
        return <BlockChildren block={block} recordMap={recordMap} />;
      }

      if (marker.marker === PUBLIC_TOGGLE) {
        if (session !== null) return null;
        return <BlockChildren block={block} recordMap={recordMap} />;
      }
    }
  }

  const type = block.type as string;
  const config = getBlockComponent(type);

  if (!config) {
    if (process.env.NODE_ENV === "development") {
      return <FallBackBlock block={block} />;
    }
    return null;
  }

  const { Component: Comp, props: extraProps = {} } = config;

  // Must use JSX syntax (not direct function call) for client component support
  return <Comp block={block} recordMap={recordMap} {...extraProps} />;
}
