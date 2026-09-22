import {
  CalendarDays,
  GitBranch,
  Home,
  LogOut,
  Menu,
  Settings,
  Users,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, NavLink } from "react-router-dom";

import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export const SiteHeader = () => {
  const { t } = useTranslation();
  const { profile, user, isAdmin, signOut } = useAuth();

  const navItems = [
    { to: "/", label: t("nav.home"), icon: Home },
    { to: "/activities", label: t("nav.activities"), icon: CalendarDays },
    { to: "/members", label: t("nav.members"), icon: Users },
    { to: "/tree", label: t("nav.tree"), icon: GitBranch },
  ];

  const displayName = profile?.display_name ?? user?.email ?? "";

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
      isActive
        ? "bg-primary/12 text-primary"
        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
    );

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 md:px-8">
        <Link to="/" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-warm text-sm font-semibold text-primary-foreground shadow-elegant">
            {t("common.appName").slice(0, 1)}
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-foreground">
            {t("common.appName")}
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={navLinkClass} end={item.to === "/"}>
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher className="hidden min-w-[130px] md:flex" />

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                    {displayName.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="hidden max-w-[120px] truncate text-sm sm:inline">
                    {displayName}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">
                  {displayName}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isAdmin ? (
                  <DropdownMenuItem asChild>
                    <Link to="/admin" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      {t("nav.admin")}
                    </Link>
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem
                  className="cursor-pointer"
                  onSelect={() => {
                    void signOut();
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {t("common.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-4 w-4" />
                <span className="sr-only">{t("nav.home")}</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px]">
              <SheetHeader>
                <SheetTitle className="font-display text-left">
                  {t("common.appName")}
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6 flex flex-col gap-1">
                {navItems.map((item) => (
                  <NavLink key={item.to} to={item.to} className={navLinkClass} end={item.to === "/"}>
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </NavLink>
                ))}
                {isAdmin ? (
                  <NavLink to="/admin" className={navLinkClass}>
                    <Settings className="h-4 w-4" />
                    {t("nav.admin")}
                  </NavLink>
                ) : null}
                <div className="mt-4 px-1">
                  <LanguageSwitcher />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};
