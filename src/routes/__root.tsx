import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { CartProvider } from "@/lib/cart";
import { AuthProvider } from "@/lib/auth";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { AnnouncementBar } from "@/components/site/AnnouncementBar";
import { ThemeProvider } from "@/lib/theme-context";
import { StorefrontThemeScope } from "@/components/site/StorefrontThemeScope";
import { useRouterState } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4">
      <div className="max-w-md text-center">
        <div className="text-display text-[8rem] leading-none text-magenta">404</div>
        <h2 className="mt-2 text-display text-2xl">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md border-2 border-ink bg-ink px-4 py-2 text-sm font-semibold text-cream hover:bg-magenta hover:border-magenta"
          >
            Back to shop
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
    <div className="flex min-h-screen items-center justify-center bg-cream px-4">
      <div className="max-w-md text-center">
        <h1 className="text-display text-2xl">Something jammed the press</h1>
        <p className="mt-2 text-sm text-muted-foreground">Try again or head home.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="rounded-md border-2 border-ink bg-ink px-4 py-2 text-sm font-semibold text-cream hover:bg-magenta hover:border-magenta"
          >
            Try again
          </button>
          <a href="/" className="rounded-md border-2 border-ink bg-cream px-4 py-2 text-sm font-semibold text-ink hover:bg-yellow">Go home</a>
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
      { title: "Craft & Cling — DTF Transfers Printed Loud" },
      { name: "description", content: "Premium Direct-to-Film transfers, custom gang sheets, and bulk designs for apparel makers. Printed to order, shipped fast." },
      { property: "og:title", content: "Craft & Cling — DTF Transfers Printed Loud" },
      { property: "og:description", content: "Premium Direct-to-Film transfers, custom gang sheets, and bulk designs for apparel makers. Printed to order, shipped fast." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Craft & Cling — DTF Transfers Printed Loud" },
      { name: "twitter:description", content: "Premium Direct-to-Film transfers, custom gang sheets, and bulk designs for apparel makers. Printed to order, shipped fast." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/14cb30f6-7c59-4b98-88b5-7ab796435e5e/id-preview-68bb4526--d9c9395c-8e2f-457e-90eb-f85c4bb76f1e.lovable.app-1783522494984.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/14cb30f6-7c59-4b98-88b5-7ab796435e5e/id-preview-68bb4526--d9c9395c-8e2f-457e-90eb-f85c4bb76f1e.lovable.app-1783522494984.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap",
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

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAdmin = pathname.startsWith("/portal-admin");
  const storefrontShell = (
    <div className="flex min-h-screen flex-col">
      <AnnouncementBar />
      <Header />
      <main className="flex-1"><Outlet /></main>
      <Footer />
    </div>
  );
  const adminShell = (
    <div className="min-h-screen"><Outlet /></div>
  );
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <CartProvider>
            {isAdmin ? adminShell : <StorefrontThemeScope>{storefrontShell}</StorefrontThemeScope>}
            <Toaster />
          </CartProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
