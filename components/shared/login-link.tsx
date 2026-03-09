"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconLogin } from "@tabler/icons-react";

const btnCls =
  "inline-flex items-center justify-center size-7 rounded-md hover:bg-muted hover:text-foreground transition-all";

export function LoginLink() {
  const pathname = usePathname();
  const isLocal = pathname.startsWith("/") && !pathname.startsWith("//");
  const href =
    pathname === "/login" || !isLocal
      ? "/login"
      : `/login?redirect=${encodeURIComponent(pathname)}`;

  return (
    <Link href={href} aria-label="Se connecter" className={btnCls}>
      <IconLogin className="h-4 w-4" />
    </Link>
  );
}
