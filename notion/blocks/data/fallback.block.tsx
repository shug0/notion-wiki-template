import type { Block } from "notion-types";
import { Card, CardContent } from "@/components/ui/card";

export function FallBackBlock({ block }: { block: Block }) {
  return (
    <Card>
      <CardContent>
        This Block is not supported yet:{" "}
        <code className="text-destructive">{block.type}</code>
      </CardContent>
    </Card>
  );
}
