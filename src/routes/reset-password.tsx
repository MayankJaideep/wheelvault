import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Lock, Loader2 } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset Password — WheelVault" },
      { name: "description", content: "Set a new password for your WheelVault account." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Supabase recovery link puts tokens in the URL hash and auto-creates a session.
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) setReady(true);
    };
    check();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) throw err;
      setDone(true);
      setTimeout(() => window.location.assign("/"), 1500);
    } catch (err: any) {
      setError(err.message ?? "Could not update password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 py-20">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-display font-semibold mb-2 text-center">Set a new password</h1>
        <p className="text-vault-400 text-sm text-center mb-8">
          {ready ? "Enter a new password below." : "Open the reset link from your email to continue."}
        </p>

        {error && <div className="mb-6 px-4 py-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">{error}</div>}
        {done && <div className="mb-6 px-4 py-3 bg-primary/10 border border-primary/20 rounded-lg text-sm text-primary">Password updated. Redirecting…</div>}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-vault-400 mb-1.5 block">New password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-vault-500" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={!ready || done}
                className="w-full bg-vault-900 ring-1 ring-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:ring-primary/50 outline-none disabled:opacity-50"
                placeholder="••••••••" required minLength={6} />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-vault-400 mb-1.5 block">Confirm password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-vault-500" />
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} disabled={!ready || done}
                className="w-full bg-vault-900 ring-1 ring-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:ring-primary/50 outline-none disabled:opacity-50"
                placeholder="••••••••" required minLength={6} />
            </div>
          </div>
          <button type="submit" disabled={!ready || loading || done}
            className="w-full bg-primary text-vault-950 font-semibold py-2.5 rounded-lg hover:bg-primary/90 flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <Loader2 className="size-4 animate-spin" /> : null}
            Update password
          </button>
        </form>
      </div>
    </div>
  );
}
