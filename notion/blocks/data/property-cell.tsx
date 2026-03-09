import type { Decoration, ExtendedRecordMap, PropertyType } from "notion-types";
import { Badge } from "@/components/ui/badge";
import { convertDecorationToRichText } from "../../lib/conversion";
import { getPageTitle, getRelationIds } from "../../lib/data";
import { getBlockData } from "../../lib/notion-compat";
import { TextRenderer } from "../../renderers/text";
import type { NotionIconType } from "../../types";
import { PageLink } from "../../ui/page-link";

interface PropertyCellProps {
  value: unknown;
  propertyType: PropertyType;
  recordMap: ExtendedRecordMap;
}

export function PropertyCell({
  value,
  propertyType,
  recordMap,
}: PropertyCellProps) {
  // Handle empty/null values
  if (!value) {
    return <span className="text-muted-foreground">—</span>;
  }

  switch (propertyType) {
    case "title":
    case "text": {
      // value is Decoration[]
      const decorations = value as Decoration[];
      const richText = convertDecorationToRichText(decorations);
      return <TextRenderer text={richText} recordMap={recordMap} />;
    }

    case "auto_increment_id":
    case "number": {
      const raw = (value as Array<[string]>)?.[0]?.[0];
      const num = Number(raw);
      return (
        <span className="font-mono tabular-nums font-semibold text-muted-foreground">
          {Number.isFinite(num) ? num.toLocaleString() : "—"}
        </span>
      );
    }

    case "checkbox": {
      const checked = (value as Array<[string]>)?.[0]?.[0] === "Yes";
      return <span>{checked ? "✓" : "—"}</span>;
    }

    case "select": {
      const selectValue = (value as Array<[string]>)?.[0]?.[0];
      return selectValue ? (
        <Badge variant="outline" className="font-normal">
          {selectValue}
        </Badge>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    }

    case "multi_select": {
      const values = value as Array<[string]>;
      if (!values?.length) {
        return <span className="text-muted-foreground">—</span>;
      }
      return (
        <div className="flex flex-wrap gap-1">
          {values.map((v) => (
            <Badge key={v[0]} variant="outline" className="font-normal">
              {v[0]}
            </Badge>
          ))}
        </div>
      );
    }

    case "date": {
      // Notion date format: [["", [["d", {type, start_date, end_date?}]]]]
      type DateInfo = { type: string; start_date: string; end_date?: string };
      const formatting = (
        value as Array<[string, Array<[string, unknown]>?]>
      )?.[0]?.[1];
      const dateData = formatting?.find((f) => f[0] === "d")?.[1] as
        | DateInfo
        | undefined;
      if (!dateData?.start_date) {
        return <span className="text-muted-foreground">—</span>;
      }
      const { start_date, end_date } = dateData;
      const fmt = (d: string) =>
        new Date(d).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
      return (
        <span>
          {end_date ? `${fmt(start_date)} → ${fmt(end_date)}` : fmt(start_date)}
        </span>
      );
    }

    case "url": {
      const url = (value as Array<[string]>)?.[0]?.[0];
      return url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          {url}
        </a>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    }

    case "email": {
      const email = (value as Array<[string]>)?.[0]?.[0];
      return email ? (
        <a href={`mailto:${email}`} className="text-primary hover:underline">
          {email}
        </a>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    }

    case "phone_number": {
      const phone = (value as Array<[string]>)?.[0]?.[0];
      return phone ? (
        <a href={`tel:${phone}`} className="text-primary hover:underline">
          {phone}
        </a>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    }

    case "person": {
      // Person values are user IDs - for now just show count
      const persons = value as Array<[string]>;
      const count = persons?.length || 0;
      return count > 0 ? (
        <span className="text-muted-foreground">
          {count} person{count > 1 ? "s" : ""}
        </span>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    }

    case "file": {
      // File values contain URLs - for now just show count
      const files = value as Array<unknown>;
      const count = files?.length || 0;
      return count > 0 ? (
        <span className="text-muted-foreground">
          {count} file{count > 1 ? "s" : ""}
        </span>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    }

    case "created_time":
    case "last_edited_time": {
      const timestamp = (value as Array<[string]>)?.[0]?.[0];
      if (!timestamp) {
        return <span className="text-muted-foreground">—</span>;
      }
      const date = new Date(timestamp);
      return (
        <span className="text-muted-foreground">
          {date.toLocaleDateString()}
        </span>
      );
    }

    case "created_by":
    case "last_edited_by": {
      // User ID - could be enhanced later to show name
      return <span className="text-muted-foreground">—</span>;
    }

    case "relation": {
      const ids = getRelationIds(value);
      if (ids.length === 0) {
        return <span className="text-muted-foreground">—</span>;
      }
      const resolved = ids
        .map((id) => {
          const refBlock = getBlockData(recordMap, id);
          if (!refBlock) return null;
          return { id, block: refBlock };
        })
        .filter(
          (r): r is { id: string; block: NonNullable<typeof r>["block"] } =>
            r !== null,
        );
      if (resolved.length === 0) {
        return <span className="text-muted-foreground">—</span>;
      }
      return (
        <div className="flex flex-wrap gap-1">
          {resolved.map(({ id, block }) => (
            <PageLink
              key={id}
              href={`/${id.replace(/-/g, "")}`}
              title={getPageTitle(block)}
              icon={block.format?.page_icon as NotionIconType | undefined}
              block={block}
              recordMap={recordMap}
              variant="inline"
            />
          ))}
        </div>
      );
    }

    case "formula": {
      // Rollup/formula: Notion sometimes stores computed values as Decoration[]
      if (Array.isArray(value) && value.length > 0) {
        const firstItem = (value as Array<unknown>)[0];
        if (Array.isArray(firstItem) && typeof firstItem[0] === "string") {
          const decorations = value as Decoration[];
          const richText = convertDecorationToRichText(decorations);
          return <TextRenderer text={richText} recordMap={recordMap} />;
        }
      }
      return <span className="text-muted-foreground">—</span>;
    }

    default: {
      // Fallback: try to extract first value as string
      const fallback = Array.isArray(value)
        ? (value as Array<[unknown]>)[0]?.[0]
        : value;
      const str = String(fallback || "");
      return str ? (
        <span>{str}</span>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    }
  }
}
