import "server-only";

export interface AccessEntry {
  email: string;
  roles: string[];
}

async function queryNotionAccessList(
  email: string,
  filter: unknown,
): Promise<AccessEntry | null> {
  const dbId = process.env.NOTION_ACCESS_LIST_DB_ID;
  const notionToken = process.env.NOTION_TOKEN;
  if (!dbId || !notionToken) return null;

  const res = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${notionToken}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ filter, page_size: 1 }),
    cache: "no-store",
  });

  if (!res.ok) return null;

  const data = (await res.json()) as {
    results?: {
      properties?: { roles?: { relation?: { id: string }[] } };
    }[];
  };
  const result = data.results?.[0];
  if (!result) return null;

  const roles =
    result.properties?.roles?.relation?.map((r) => r.id.replace(/-/g, "")) ??
    [];
  return { email, roles };
}

export async function lookupByEmailAndToken(
  email: string,
  token: string,
): Promise<AccessEntry | null> {
  return queryNotionAccessList(email, {
    and: [
      { property: "email", title: { equals: email } },
      { property: "token", rich_text: { equals: token } },
    ],
  });
}

export async function lookupByEmail(
  email: string,
): Promise<AccessEntry | null> {
  return queryNotionAccessList(email, {
    property: "email",
    title: { equals: email },
  });
}
