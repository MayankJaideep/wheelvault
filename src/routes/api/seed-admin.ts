import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/seed-admin")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get("k") !== "wv-seed-2026") {
          return new Response("forbidden", { status: 403 });
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const email = "mayankjaideep07@gmail.com";
        const password = "WheelVault@2026";

        // Find user
        const { data: list } = await supabaseAdmin.auth.admin.listUsers();
        const existing = list?.users?.find((u) => u.email?.toLowerCase() === email);

        let userId: string;
        if (existing) {
          userId = existing.id;
          await supabaseAdmin.auth.admin.updateUserById(userId, {
            password,
            email_confirm: true,
          });
        } else {
          const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
          });
          if (error) return new Response(error.message, { status: 500 });
          userId = created.user!.id;
        }

        // Ensure admin role
        await supabaseAdmin.from("user_roles").upsert({ user_id: userId, role: "admin" });
        await supabaseAdmin.from("profiles").upsert({ id: userId, display_name: "Admin" });

        return new Response(JSON.stringify({ ok: true, email, password }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
