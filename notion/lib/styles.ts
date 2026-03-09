import { cn } from "@/lib/utils";
import { notionTokens } from "@/notion/ui/design-system";

/**
 * Standard border styling for nested block content (paragraphs, lists, todos).
 */
export function getNestedContentBorder(className?: string): string {
  return cn(
    notionTokens.spacing.nestedContent,
    notionTokens.borders.nestedContent,
    className,
  );
}
