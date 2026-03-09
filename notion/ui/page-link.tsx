import Link from "next/link";
import type { Block, ExtendedRecordMap } from "notion-types";
import { cn } from "@/lib/utils";
import type { NotionIconType } from "../types";
import { NotionIcon } from "./icon";

interface PageLinkProps {
  href: string;
  title: string;
  icon?: NotionIconType;
  fallback?: React.ReactNode;
  block: Block;
  recordMap: ExtendedRecordMap;
  /** "block" = standalone link with margin, "inline" = compact for tables */
  variant?: "block" | "inline";
  children?: React.ReactNode;
}

const defaultFallback = (
  <span className="text-muted-foreground text-xs">📄</span>
);

export function PageLink({
  href,
  title,
  icon,
  fallback = defaultFallback,
  block,
  recordMap,
  variant = "block",
  children,
}: PageLinkProps) {
  const isBlock = variant === "block";

  return (
    <Link
      href={href}
      className={cn(
        "items-center text-foreground hover:bg-muted rounded-lg transition-colors group",
        isBlock
          ? "notion-page-link flex gap-2 px-3 py-1.5 md:py-1 min-h-[44px] md:min-h-0 touch-manipulation"
          : "inline-flex gap-1 text-sm px-2 py-1 touch-manipulation",
      )}
    >
      <span
        className={cn(
          "flex items-center justify-center shrink-0 text-muted-foreground group-hover:text-foreground transition-colors",
          isBlock && "p-0.5 rounded",
        )}
      >
        <NotionIcon
          icon={icon ?? ("📄" as NotionIconType)}
          block={block}
          recordMap={recordMap}
          size="sm"
          fallback={fallback}
        />
      </span>
      <span>{children ?? title}</span>
    </Link>
  );
}
