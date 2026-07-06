import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "../features/i18n/LanguageSwitcher";
import { ThemeToggle } from "../features/theme/ThemeToggle";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-svh flex-col lg:flex-row">
      <aside className="flex w-full shrink-0 flex-col gap-4 border-b border-[var(--border-subtle)] bg-[var(--surface)] px-7 py-6 lg:h-svh lg:w-72 lg:border-b-0 lg:border-r">
        <div>
          <h1 className="m-0 text-xl font-semibold tracking-tight text-[var(--text)]">
            {t("app.title")}
          </h1>
          <p className="mt-2 text-sm leading-snug text-[var(--text-secondary)]">
            {t("app.tagline")}
          </p>
        </div>

        <nav className="flex flex-col gap-1 text-sm">
          <NavItem to="/" label={t("nav.bracket")} />
          <NavItem to="/teams" label={t("nav.teams")} />
          <NavItem to="/groups" label={t("nav.groups")} />
        </nav>

        <div className="mt-auto flex flex-col gap-3 pt-6 text-sm">
          <LanguageSwitcher />
          <ThemeToggle />
          <p className="text-xs text-[var(--text-muted)]">{t("app.footer")}</p>
        </div>
      </aside>

      <main className="flex flex-1 items-start justify-center overflow-x-auto p-6">
        <Outlet />
      </main>

      {import.meta.env.DEV ? <TanStackRouterDevtools position="bottom-right" /> : null}
    </div>
  );
}

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      activeOptions={{ exact: to === "/" }}
      className="rounded px-2 py-1.5 text-[var(--text)] hover:bg-[var(--surface-muted)]"
      activeProps={{ className: "bg-[var(--surface-elevated)] font-semibold" }}
    >
      {label}
    </Link>
  );
}
