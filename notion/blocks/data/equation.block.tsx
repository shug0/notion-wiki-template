import type { EquationBlock as EquationBlockType } from "notion-types";

interface EquationBlockProps {
  block: EquationBlockType;
}

export function EquationBlock({ block }: EquationBlockProps) {
  const equation = block.properties?.title?.[0]?.[0];

  if (!equation) return null;

  return (
    <div className="flex justify-center overflow-x-auto text-lg italic">
      <div className="p-4 bg-muted/30 rounded-md border border-dashed font-mono">
        {equation}
      </div>
    </div>
  );
}
