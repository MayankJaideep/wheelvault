import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode, useState } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { supabase } from "@/integrations/supabase/client";
import { Search, ShoppingCart, User } from "lucide-react";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-primary">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "WheelVault — Die-Cast Marketplace" },
      { name: "description", content: "The premier global marketplace for buying and selling Hot Wheels and die-cast collectibles." },
      { property: "og:title", content: "WheelVault — Die-Cast Marketplace" },
      { property: "og:description", content: "The premier global marketplace for buying and selling Hot Wheels and die-cast collectibles." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@WheelVault" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function Navbar() {
  const [user, setUser] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) setUser(data.session.user.email ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user?.email ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <nav className="sticky top-0 z-50 bg-vault-950/80 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-10">
          <Link to="/" className="font-display font-semibold text-xl tracking-tight flex items-center gap-2 text-foreground hover:text-primary transition-colors">
            <span className="size-6 bg-primary rounded-sm inline-block" />
            WHEELVAULT
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-vault-400">
            <Link to="/browse" className="hover:text-primary transition-colors">Browse</Link>
            <Link to="/browse" search={{ auction: true } as any} className="hover:text-primary transition-colors">Auctions</Link>
            <Link to="/sell" className="hover:text-primary transition-colors">Sell</Link>
            <Link to="/collections" className="hover:text-primary transition-colors">Collections</Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className={`relative ${searchOpen ? "block" : "hidden lg:block"}`}>
            <input
              type="text"
              placeholder="Search the vault..."
              className="bg-vault-900 border-none ring-1 ring-white/10 rounded-full py-1.5 pl-4 pr-10 text-sm w-48 md:w-64 focus:ring-primary/50 transition-all outline-none text-foreground placeholder:text-vault-500"
              onBlur={() => setSearchOpen(false)}
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-vault-500" />
          </div>
          <button onClick={() => setSearchOpen(true)} className="lg:hidden text-vault-400 hover:text-foreground">
            <Search className="size-5" />
          </button>
          <div className="flex items-center gap-4 text-sm font-medium">
            {user ? (
              <>
                <Link to="/_authenticated/profile" className="text-vault-400 hover:text-foreground transition-colors flex items-center gap-1">
                  <User className="size-4" />
                  <span className="hidden sm:inline">{user.split("@")[0]}</span>
                </Link>
                <Link to="/_authenticated/cart" className="bg-foreground text-vault-950 px-4 py-1.5 rounded-full hover:bg-primary hover:text-vault-950 transition-colors flex items-center gap-2">
                  <ShoppingCart className="size-4" />
                  <span className="hidden sm:inline">Cart</span>
                </Link>
              </>
            ) : (
              <>
                <Link to="/auth" className="text-vault-400 hover:text-foreground transition-colors">Sign In</Link>
                <Link to="/auth" className="bg-foreground text-vault-950 px-4 py-1.5 rounded-full hover:bg-primary hover:text-vault-950 transition-colors">Cart (0)</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="bg-vault-950 border-t border-white/5 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-3 gap-16 mb-20">
          <div>
            <span className="font-display font-semibold text-xl tracking-tight flex items-center gap-2 mb-6 text-foreground">
              <span className="size-6 bg-primary rounded-sm inline-block" />
              WHEELVAULT
            </span>
            <p className="text-vault-400 text-sm leading-relaxed max-w-[35ch] mb-8">
              The premier global marketplace for the high-end die-cast enthusiast. Authenticated, insured, and verified for serious collectors.
            </p>
          </div>

          <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-12">
            <div>
              <h4 className="text-foreground font-semibold mb-6">Marketplace</h4>
              <ul className="space-y-4 text-sm text-vault-400">
                <li><Link to="/browse" className="hover:text-primary transition-colors">All Listings</Link></li>
                <li><Link to="/browse" search={{ auction: true } as any} className="hover:text-primary transition-colors">Live Auctions</Link></li>
                <li><Link to="/browse" search={{ trending: true } as any} className="hover:text-primary transition-colors">Trending Now</Link></li>
                <li><Link to="/browse" search={{ sold: true } as any} className="hover:text-primary transition-colors">Recently Sold</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-foreground font-semibold mb-6">Collector Services</h4>
              <ul className="space-y-4 text-sm text-vault-400">
                <li><Link to="/sell" className="hover:text-primary transition-colors">Sell Your Collection</Link></li>
                <li><Link to="/collections" className="hover:text-primary transition-colors">Collections</Link></li>
                <li><Link to="/auth" className="hover:text-primary transition-colors">Consignment</Link></li>
                <li><Link to="/auth" className="hover:text-primary transition-colors">Insured Shipping</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-foreground font-semibold mb-6">The Vault</h4>
              <ul className="space-y-4 text-sm text-vault-400">
                <li><Link to="/" className="hover:text-primary transition-colors">Our Standard</Link></li>
                <li><Link to="/" className="hover:text-primary transition-colors">Collector Guides</Link></li>
                <li><Link to="/" className="hover:text-primary transition-colors">Journal</Link></li>
                <li><Link to="/" className="hover:text-primary transition-colors">FAQ</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-12 border-t border-white/5">
          <p className="text-xs text-vault-500">© 2025 WheelVault Die-cast Exchange. All rights reserved.</p>
          <div className="flex gap-8">
            <a href="#" className="text-xs text-vault-500 hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="#" className="text-xs text-vault-500 hover:text-foreground transition-colors">Terms of Service</a>
            <a href="#" className="text-xs text-vault-500 hover:text-foreground transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
        <Navbar />
        <Outlet />
        <Footer />
      </div>
    </QueryClientProvider>
  );
}
