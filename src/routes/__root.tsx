import { useEffect, useState } from "react";
import { createRootRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { FocusTrap } from "focus-trap-react";
import { Sidebar } from "../components/Sidebar";
import { AppHeader } from "../components/MobileHeader";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const routerLocation = useRouterState({ select: (s) => s.location.pathname });

  // Close drawer on route change (nav-item click) and on Esc.
  useEffect(() => setDrawerOpen(false), [routerLocation]);
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  return (
    <div className="flex min-h-svh flex-col">
      <AppHeader onOpenMenu={() => setDrawerOpen(true)} />

      {drawerOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setDrawerOpen(false)}
          className="fixed inset-0 z-40 bg-[var(--modal-overlay)]"
        />
      ) : null}

      <FocusTrap
        active={drawerOpen}
        focusTrapOptions={{
          escapeDeactivates: false,
          allowOutsideClick: true,
          clickOutsideDeactivates: true,
        }}
      >
        <aside
          id="app-sidebar"
          aria-label="App sidebar"
          className={
            "fixed inset-y-0 left-0 z-50 flex w-80 max-w-[85vw] flex-col " +
            "border-r border-[var(--border-subtle)] bg-[var(--surface)] " +
            "transition-transform duration-200 ease-out " +
            (drawerOpen ? "translate-x-0" : "-translate-x-full")
          }
        >
          <Sidebar
            onNavClick={() => setDrawerOpen(false)}
            onClose={() => setDrawerOpen(false)}
          />
        </aside>
      </FocusTrap>

      <main className="flex min-h-0 flex-1 flex-col p-4 sm:p-6">
        <Outlet />
      </main>

      {import.meta.env.DEV ? <TanStackRouterDevtools position="bottom-right" /> : null}
    </div>
  );
}
