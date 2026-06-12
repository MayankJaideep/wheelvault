import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Mail, Lock, Chrome, ArrowRight, Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign In — WheelVault" },
      { name: "description", content: "Sign in to WheelVault to buy, sell, and collect die-cast treasures." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (mode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (signUpError) throw signUpError;
        // Auto sign-in after signup (email confirmation disabled)
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        navigate({ to: "/", replace: true });
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        navigate({ to: "/", replace: true });
      }
    } catch (err: any) {
      setError(err.message ?? "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  async function signInWithGoogle() {
    setError(null);
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) throw result.error;
      if (!result.redirected) {
        navigate({ to: "/", replace: true });
      }
    } catch (err: any) {
      setError(err.message ?? "Google sign-in failed.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 py-20">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-display font-semibold mb-2">
            {mode === "signin" ? "Welcome back" : "Join the vault"}
          </h1>
          <p className="text-vault-400 text-sm">
            {mode === "signin" ? "Sign in to access your collection." : "Create an account to start collecting."}
          </p>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-6 px-4 py-3 bg-primary/10 border border-primary/20 rounded-lg text-sm text-primary">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-vault-400 mb-1.5 block">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-vault-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-vault-900 border-none ring-1 ring-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:ring-primary/50 outline-none text-foreground placeholder:text-vault-500"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-vault-400 mb-1.5 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-vault-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-vault-900 border-none ring-1 ring-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:ring-primary/50 outline-none text-foreground placeholder:text-vault-500"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-vault-950 font-semibold py-2.5 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : null}
            {mode === "signin" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/5" />
          </div>
          <div className="relative flex justify-center text-xs uppercase tracking-wider">
            <span className="bg-background px-4 text-vault-500">Or continue with</span>
          </div>
        </div>

        <button
          onClick={signInWithGoogle}
          disabled={loading}
          className="w-full bg-vault-900 border border-white/10 text-foreground font-semibold py-2.5 rounded-lg hover:bg-vault-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Chrome className="size-4" />
          Google
        </button>

        <p className="mt-8 text-center text-sm text-vault-400">
          {mode === "signin" ? (
            <>Don't have an account? <button onClick={() => setMode("signup")} className="text-primary hover:underline font-medium">Sign up</button></>
          ) : (
            <>Already have an account? <button onClick={() => setMode("signin")} className="text-primary hover:underline font-medium">Sign in</button></>
          )}
        </p>
      </div>
    </div>
  );
}
