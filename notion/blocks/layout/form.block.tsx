import { IconForms } from "@tabler/icons-react";

export function FormBlock() {
  return (
    <div className="my-4 flex items-start gap-3 rounded-md border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
      <IconForms className="mt-0.5 size-4 shrink-0" />
      <span>
        Ce bloc est un formulaire Notion natif — non pris en charge par ce site.
      </span>
    </div>
  );
}
