import { Button } from "@/components/ui/button";
import { Link, useLocation } from "@tanstack/react-router";
import { Database, Shield, Upload, User } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useIsAdmin } from "../hooks/useQueries";

export function Layout({ children }: { children: React.ReactNode }) {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const { data: isAdmin } = useIsAdmin();
  const location = useLocation();
  const isLoggedIn = !!identity;
  const isLoggingIn = loginStatus === "logging-in";

  const navLink = (path: string, label: string, ocid: string) => {
    const isActive = location.pathname === path;
    return (
      <Link
        to={path}
        data-ocid={ocid}
        className={`text-xs font-mono font-bold tracking-widest uppercase transition-colors px-2 py-1 ${
          isActive
            ? "text-primary border border-primary bg-primary/10"
            : "text-muted-foreground hover:text-foreground border border-transparent hover:border-border"
        }`}
      >
        {isActive ? `[${label}]` : label}
      </Link>
    );
  };

  function handleResetColors() {
    localStorage.removeItem("tui-main-color");
    localStorage.removeItem("tui-secondary-color");
    window.location.reload();
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Terminal title bar header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 h-12 flex items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 group"
            data-ocid="nav.link"
          >
            <Database className="w-4 h-4 text-primary" />
            <span className="font-mono font-bold text-sm tracking-tight">
              <span className="text-primary">ACADEMIC</span>
              <span className="text-muted-foreground">::</span>
              <span className="text-accent">TORRENTS</span>
            </span>
          </Link>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLink("/", "BROWSE", "nav.browse.link")}
            {navLink("/submit", "SUBMIT", "nav.submit.link")}
            {isAdmin && (
              <Link
                to="/admin"
                data-ocid="nav.admin.link"
                className={`text-xs font-mono font-bold tracking-widest uppercase transition-colors px-2 py-1 flex items-center gap-1 ${
                  location.pathname === "/admin"
                    ? "text-primary border border-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground border border-transparent hover:border-border"
                }`}
              >
                <Shield className="w-3 h-3" />
                {location.pathname === "/admin" ? "[ADMIN]" : "ADMIN"}
              </Link>
            )}
          </nav>

          {/* Auth */}
          <div className="flex items-center gap-1">
            {isLoggedIn ? (
              <>
                <Link to="/profile" data-ocid="nav.profile.link">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs font-mono font-bold tracking-widest uppercase gap-1.5 h-7 px-2"
                  >
                    <User className="w-3 h-3" />
                    <span className="hidden sm:inline">PROFILE</span>
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => clear()}
                  data-ocid="nav.logout.button"
                  className="text-xs font-mono font-bold tracking-widest uppercase h-7 px-2"
                >
                  SIGN_OUT
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                onClick={() => login()}
                disabled={isLoggingIn}
                data-ocid="nav.login.button"
                className="text-xs font-mono font-bold tracking-widest uppercase bg-primary text-primary-foreground hover:bg-primary/80 h-7 px-2"
              >
                {isLoggingIn ? "CONNECTING..." : "> SIGN_IN"}
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Permanence notice */}
      <div className="permanence-banner px-4 py-1.5">
        <div className="container mx-auto flex items-center gap-2 text-xs text-muted-foreground font-mono">
          <span className="text-primary font-bold">!</span>
          <span>
            <span className="text-foreground/70">OPEN_ACCESS_COMMITMENT:</span>{" "}
            content is permanent. removal only if data is{" "}
            <em className="text-primary not-italic font-bold">PROVEN_FALSE</em>
          </span>
        </div>
      </div>

      <main className="flex-1">{children}</main>

      {/* Status bar footer */}
      <footer className="border-t border-border bg-card mt-8 py-2">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
            <div className="flex items-center gap-0">
              <span className="text-primary font-bold">ACADEMIC::TORRENTS</span>
              <span className="mx-2 text-border">|</span>
              <span>OPEN RESEARCH DATA</span>
              <span className="mx-2 text-border">|</span>
              <Link
                to="/"
                className="hover:text-foreground transition-colors"
                data-ocid="footer.browse.link"
              >
                BROWSE
              </Link>
              <span className="mx-2 text-border">|</span>
              <Link
                to="/submit"
                className="hover:text-foreground transition-colors flex items-center gap-1"
                data-ocid="footer.submit.link"
              >
                <Upload className="w-2.5 h-2.5" />
                SUBMIT
              </Link>
              <span className="mx-2 text-border">|</span>
              <button
                type="button"
                onClick={handleResetColors}
                data-ocid="footer.colors.button"
                className="hover:text-primary transition-colors cursor-pointer"
              >
                [COLORS]
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span>© {new Date().getFullYear()}</span>
              <span className="text-border">|</span>
              <span>
                built with ♥ using{" "}
                <a
                  href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
                  className="text-primary hover:text-accent transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  caffeine.ai
                </a>
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
