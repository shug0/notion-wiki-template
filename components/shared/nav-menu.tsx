"use client";

import { IconMenu2 } from "@tabler/icons-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? <>{children}</> : null;
}

import type { NavGroup, NavSection, NavTree } from "@/notion/lib/nav-tree";

function NavItemIcon({ icon }: { icon: string | undefined }) {
  if (!icon) return null;
  return <span className="text-sm">{icon}</span>;
}

function isExternal(href: string): boolean {
  return href.startsWith("http");
}

function NavLinkWrapper({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  if (isExternal(href)) {
    return (
      <NavigationMenuLink
        render={<a href={href} target="_blank" rel="noopener noreferrer" />}
        className={className}
      >
        {children}
      </NavigationMenuLink>
    );
  }
  return (
    <NavigationMenuLink render={<Link href={href} />} className={className}>
      {children}
    </NavigationMenuLink>
  );
}

function NavGroupDropdown({ group }: { group: NavGroup }) {
  // Single unnamed section with one item → direct link
  if (
    group.sections.length === 1 &&
    !group.sections[0].title &&
    group.sections[0].items.length === 1
  ) {
    const item = group.sections[0].items[0];
    return (
      <NavigationMenuItem>
        <NavLinkWrapper
          href={item.href}
          className={cn(navigationMenuTriggerStyle())}
        >
          <NavItemIcon icon={item.icon} />
          {item.title}
        </NavLinkWrapper>
      </NavigationMenuItem>
    );
  }

  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger>{group.title}</NavigationMenuTrigger>
      <NavigationMenuContent>
        <div className="w-[260px] p-1">
          {group.sections.map((section, i) => (
            <div key={section.title || i}>
              {section.title && (
                <p className="text-muted-foreground mb-1 px-2 pt-1 text-[11px] font-medium uppercase tracking-wider">
                  {section.title}
                </p>
              )}
              <ul className="grid gap-0.5">
                {section.items.map((item) => (
                  <li key={item.id}>
                    <NavLinkWrapper href={item.href}>
                      <NavItemIcon icon={item.icon} />
                      <span>{item.title}</span>
                    </NavLinkWrapper>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
}

function SidebarDropdown({ sections }: { sections: NavSection[] }) {
  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger>Liens</NavigationMenuTrigger>
      <NavigationMenuContent>
        <div className="w-[300px] p-2">
          {sections.map((section, i) => (
            <div key={section.title || i} className="mb-2 last:mb-0">
              {section.title && (
                <p className="text-muted-foreground mb-1 px-2 text-[11px] font-medium uppercase tracking-wider">
                  {section.title}
                </p>
              )}
              <ul className="grid gap-0.5">
                {section.items.map((item) => (
                  <li key={item.id}>
                    <NavLinkWrapper href={item.href}>
                      <NavItemIcon icon={item.icon} />
                      <span>{item.title}</span>
                      {isExternal(item.href) && (
                        <span className="text-muted-foreground ml-auto text-[10px]">
                          ↗
                        </span>
                      )}
                    </NavLinkWrapper>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
}

function MobileLinkItem({
  href,
  icon,
  title,
  external,
}: {
  href: string;
  icon: string | undefined;
  title: string;
  external: boolean;
}) {
  const inner = (
    <span className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent">
      <NavItemIcon icon={icon} />
      <span>{title}</span>
      {external && (
        <span className="text-muted-foreground ml-auto text-[10px]">↗</span>
      )}
    </span>
  );

  return (
    <SheetClose render={<li />} nativeButton={false}>
      {external ? (
        <a href={href} target="_blank" rel="noopener noreferrer">
          {inner}
        </a>
      ) : (
        <Link href={href}>{inner}</Link>
      )}
    </SheetClose>
  );
}

function MobileMenuContent({ navTree }: { navTree: NavTree }) {
  const { groups, sidebar } = navTree;

  return (
    <div className="flex flex-col gap-4 overflow-y-auto py-4">
      {groups.map((group, gi) => (
        <div key={group.title || gi}>
          {group.title && (
            <p className="mb-1 px-3 text-base font-semibold">{group.title}</p>
          )}
          {group.sections.map((section, si) => (
            <div key={section.title || si}>
              {section.title && (
                <p className="text-muted-foreground mb-1 px-3 pt-2 text-xs font-medium uppercase tracking-wider">
                  {section.title}
                </p>
              )}
              <ul>
                {section.items.map((item) => (
                  <MobileLinkItem
                    key={item.id}
                    href={item.href}
                    icon={item.icon}
                    title={item.title}
                    external={isExternal(item.href)}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      ))}

      {sidebar.length > 0 && (
        <div>
          <p className="mb-1 px-3 text-base font-semibold">Liens</p>
          {sidebar.map((section, si) => (
            <div key={section.title || si}>
              {section.title && (
                <p className="text-muted-foreground mb-1 px-3 pt-2 text-xs font-medium uppercase tracking-wider">
                  {section.title}
                </p>
              )}
              <ul>
                {section.items.map((item) => (
                  <MobileLinkItem
                    key={item.id}
                    href={item.href}
                    icon={item.icon}
                    title={item.title}
                    external={isExternal(item.href)}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MobileMenu({ navTree }: { navTree: NavTree }) {
  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon">
            <IconMenu2 className="size-5" />
            <span className="sr-only">Ouvrir le menu</span>
          </Button>
        }
      />
      <SheetContent side="right" className="w-72 p-0">
        <SheetHeader className="border-b px-4 py-3">
          <SheetTitle className="text-sm">Menu</SheetTitle>
        </SheetHeader>
        <MobileMenuContent navTree={navTree} />
      </SheetContent>
    </Sheet>
  );
}

function NavMenu({ navTree }: { navTree: NavTree }) {
  const { groups, sidebar } = navTree;
  if (groups.length === 0 && sidebar.length === 0) return null;

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:flex">
        <NavigationMenu aria-label="Navigation principale">
          <NavigationMenuList>
            {groups.map((group, i) => (
              <NavGroupDropdown key={group.title || i} group={group} />
            ))}
            {sidebar.length > 0 && <SidebarDropdown sections={sidebar} />}
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      {/* Mobile — rendered client-only to avoid Base UI ID hydration mismatch */}
      <div className="flex md:hidden">
        <ClientOnly>
          <MobileMenu navTree={navTree} />
        </ClientOnly>
      </div>
    </>
  );
}

export { NavMenu };
