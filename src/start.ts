import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    // Server-function RPC calls must keep their serialized error so the
    // browser can read the real message. Only genuine page/SSR crashes get
    // the friendly full-page HTML fallback.
    let isServerFn = false;
    try {
      const { getRequest } = await import("@tanstack/react-start/server");
      const url = getRequest()?.url ?? "";
      isServerFn = url.includes("_serverFn");
    } catch {
      isServerFn = false;
    }
    if (isServerFn) throw error;
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});


export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [errorMiddleware],
}));
