"use client";

import { IconCat, IconLogout } from "@tabler/icons-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const btnCls =
  "inline-flex items-center justify-center size-7 rounded-md hover:bg-muted hover:text-foreground transition-all";

interface UserMenuProps {
  email: string;
}

export function UserMenu({ email }: UserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label="Menu utilisateur" className={btnCls}>
        <IconCat className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <p className="text-xs text-muted-foreground">Connecté en tant que</p>
            <p className="truncate font-medium text-sm">{email}</p>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <form action="/api/auth/logout" method="POST">
            <DropdownMenuItem
              nativeButton
              render={
                <button type="submit" className="w-full cursor-pointer" />
              }
            >
              <IconLogout className="h-4 w-4" />
              Se déconnecter
            </DropdownMenuItem>
          </form>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
