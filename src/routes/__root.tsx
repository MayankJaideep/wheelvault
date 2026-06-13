import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode, useState } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { supabase } from "@/integrations/supabase/client";
import { User, LogOut, Shield, Menu, X } from "lucide-react";

function NotFoundComponent() {
  const router = useRouter();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  useEffect(() => {
    if (pathname === "/_authenticated/admin") {
      router.navigate({ to: "/admin", replace: true });
    }
    if (pathname === "/_authenticated/profile") {
      router.navigate({ to: "/profile", replace: true });
    }
  }, [pathname, router]);

  if (pathname === "/_authenticated/admin" || pathname === "/_authenticated/profile") {
    return <div className="flex min-h-screen items-center justify-center bg-background px-4 text-vault-300">Opening…</div>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-primary">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <Link to="/" className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Go home</Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "tanstack_root_error_component" }); }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">Try refreshing or head home.</p>
        <div className="mt-6 flex justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Try again</button>
          <a href="/" className="rounded-md border border-input bg-background px-4 py-2 text-sm">Home</a>
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
      { title: "WheelVault — Hot Wheels Marketplace India" },
      { name: "description", content: "Buy and bid on authentic Hot Wheels die-cast collectibles from India's curated vault. WhatsApp checkout, BlueDart / DHL shipping." },
      { property: "og:title", content: "WheelVault — Hot Wheels Marketplace India" },
      { property: "og:description", content: "Buy and bid on authentic Hot Wheels die-cast collectibles from India's curated vault. WhatsApp checkout, BlueDart / DHL shipping." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "WheelVault — Hot Wheels Marketplace India" },
      { name: "twitter:description", content: "Buy and bid on authentic Hot Wheels die-cast collectibles from India's curated vault. WhatsApp checkout, BlueDart / DHL shipping." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/8eaa730f-890e-4476-be8b-957ff5c4b3da/id-preview-49ae4919--6cbe6bad-7f1e-4bb8-94ba-c5159eba0f66.lovable.app-1781368641063.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/8eaa730f-890e-4476-be8b-957ff5c4b3da/id-preview-49ae4919--6cbe6bad-7f1e-4bb8-94ba-c5159eba0f66.lovable.app-1781368641063.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600&family=Space+Grotesk:wght@500;600;700;800&display=swap" },
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
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function Navbar() {
  const [user, setUser] = useState<{ email: string; id: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    let active = true;
    async function load(u: any) {
      if (!u) { setUser(null); setIsAdmin(false); return; }
      setUser({ email: u.email ?? "", id: u.id });
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", u.id);
      if (active) setIsAdmin((data ?? []).some((r: any) => r.role === "admin"));
    }
    supabase.auth.getSession().then(({ data }) => load(data.session?.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => load(session?.user));
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const links = (
    <>
      <Link to="/browse" className="hover:text-primary transition-colors" onClick={() => setMobileOpen(false)}>Browse</Link>
      <Link to="/auctions" className="hover:text-primary transition-colors" onClick={() => setMobileOpen(false)}>Auctions</Link>
      <Link to="/collections" className="hover:text-primary transition-colors" onClick={() => setMobileOpen(false)}>Collections</Link>
    </>
  );

  return (
    <nav className="sticky top-0 z-50 bg-vault-950/85 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="font-display font-extrabold text-lg tracking-tight flex items-center gap-2 text-foreground">
            <span className="size-7 bg-gradient-to-br from-orange-500 to-red-600 rounded-md inline-flex items-center justify-center text-white text-[10px] font-black italic">HW</span>
            WHEELVAULT
          </Link>
          <div className="hidden md:flex items-center gap-7 text-sm font-medium text-vault-300">{links}</div>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link to="/admin" search={{ tab: "new" }} className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold bg-primary/15 text-primary px-3 py-1.5 rounded-full ring-1 ring-primary/30 hover:bg-primary/25">
              <Shield className="size-3.5" /> Add Collection
            </Link>
          )}
          {user ? (
            <div className="hidden sm:flex items-center gap-3 text-sm">
              <Link to="/profile" className="text-vault-300 hover:text-foreground flex items-center gap-1.5">
                <User className="size-4" />
                <span className="hidden md:inline">{user.email.split("@")[0]}</span>
              </Link>
              <button onClick={signOut} className="text-vault-400 hover:text-foreground" title="Sign out"><LogOut className="size-4" /></button>
            </div>
          ) : (
            <Link to="/auth" className="bg-primary text-vault-950 px-4 py-1.5 rounded-full text-sm font-semibold hover:bg-primary/90">Sign In</Link>
          )}
          <button className="md:hidden text-vault-300" onClick={() => setMobileOpen((v) => !v)}>
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      {mobileOpen && (
        <div className="md:hidden border-t border-white/5 bg-vault-950 px-5 py-4 flex flex-col gap-4 text-sm font-medium text-vault-300">
          {links}
          {isAdmin && <Link to="/admin" search={{ tab: "new" }} onClick={() => setMobileOpen(false)} className="text-primary">Add Collection</Link>}
          {user && <Link to="/profile" onClick={() => setMobileOpen(false)}>Profile</Link>}
          {user && <button onClick={signOut} className="text-left">Sign out</button>}
        </div>
      )}
    </nav>
  );
}

function Footer() {
  return (
    <footer className="bg-vault-950 border-t border-white/5 mt-20 pt-16 pb-10">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-10">
        <div>
          <span className="font-display font-extrabold text-lg tracking-tight flex items-center gap-2 text-foreground mb-4">
            <span className="size-7 bg-gradient-to-br from-orange-500 to-red-600 rounded-md inline-flex items-center justify-center text-white text-[10px] font-black italic">HW</span>
            WHEELVAULT
          </span>
          <p className="text-vault-400 text-sm leading-relaxed max-w-[36ch]">
            A curated Indian vault for authentic Hot Wheels and die-cast collectibles. Hand-picked, photographed, and shipped insured via BlueDart / DHL.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-4">Shop</h4>
          <ul className="space-y-3 text-sm text-vault-400">
            <li><Link to="/browse" className="hover:text-primary">All Listings</Link></li>
            <li><Link to="/auctions" className="hover:text-primary">Live Auctions</Link></li>
            <li><Link to="/collections" className="hover:text-primary">Collections</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-4">Contact</h4>
          <p className="text-sm text-vault-400 leading-relaxed">
            All orders are confirmed over WhatsApp. Send your address, payment & shipping (BlueDart / DHL) is arranged directly.
          </p>
          <a href="https://wa.me/917483595994" target="_blank" rel="noopener noreferrer" className="inline-flex mt-3 items-center gap-2 text-[#25D366] text-sm font-semibold">
            +91 74835 95994
          </a>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 mt-12 pt-6 border-t border-white/5 flex flex-col md:flex-row justify-between gap-3 text-xs text-vault-500">
        <p>© 2026 WheelVault. Hot Wheels is a trademark of Mattel; this site is a collector marketplace and is not affiliated with Mattel.</p>
      </div>
    </footer>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 flex flex-col">
        <Navbar />
        <main className="flex-1"><Outlet /></main>
        <Footer />
      </div>
    </QueryClientProvider>
  );
}
