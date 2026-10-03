import { Link, NavLink, useLocation } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/", label: "Engine" },
  { to: "/rate-card", label: "Rate Card" },
  { to: "/proposals", label: "Proposals" },
];

export function AppHeader() {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-4 px-4 sm:px-6">
        <Link to="/" className="flex min-h-[44px] items-center gap-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-tier-better opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-tier-better" />
          </span>
          <span className="font-display hidden text-sm font-semibold tracking-wide min-[480px]:inline">
            MAB AI Strategies
          </span>
          <span className="label-caps hidden text-muted-foreground lg:inline">
            / Pricing Engine
          </span>
        </Link>

        <nav className="ml-auto flex items-center gap-0.5 sm:gap-2">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `label-caps flex min-h-[44px] items-center rounded-md px-2 sm:px-3 transition-colors ${
                  isActive
                    ? "bg-secondary text-tier-better"
                    : "text-muted-foreground hover:text-foreground"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
          <span className="mx-1 hidden h-5 w-px bg-border sm:block" />
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <span className="label-caps hidden max-w-[140px] truncate text-muted-foreground md:inline">
                {user?.name ?? "Signed in"}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="min-h-[36px] font-mono2 text-xs"
                onClick={logout}
              >
                Sign out
              </Button>
            </div>
          ) : (
            location.pathname !== "/login" && (
              <Link to="/login">
                <Button size="sm" className="min-h-[36px] font-mono2 text-xs">
                  Sign in
                </Button>
              </Link>
            )
          )}
        </nav>
      </div>
    </header>
  );
}
