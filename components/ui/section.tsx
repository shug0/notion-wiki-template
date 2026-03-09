import { cn } from "@/lib/utils";

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  spacing?: "sm" | "md" | "lg" | "xl";
  as?: "section" | "main" | "div";
}

export function Section({
  children,
  className,
  spacing = "md",
  as: Component = "section",
}: SectionProps) {
  return (
    <Component
      className={cn(
        {
          "py-8": spacing === "sm",
          "py-12": spacing === "md",
          "py-16": spacing === "lg",
          "py-24": spacing === "xl",
        },
        className,
      )}
    >
      {children}
    </Component>
  );
}
