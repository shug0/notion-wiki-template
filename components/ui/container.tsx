import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const containerVariants = cva("mx-auto px-6 md:px-8", {
  variants: {
    size: {
      default: "max-w-[65ch]",
      wide: "max-w-7xl",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

interface ContainerProps extends VariantProps<typeof containerVariants> {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}

export function Container({
  children,
  className,
  size,
  as: Component = "div",
}: ContainerProps) {
  return (
    <Component className={cn(containerVariants({ size, className }))}>
      {children}
    </Component>
  );
}
