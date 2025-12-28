import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0F1419]">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-[#1A1F2E] p-10 shadow-2xl border border-slate-800">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white">
            <span className="inline-block bg-gradient-to-r from-teal-400 via-teal-300 to-teal-500 bg-clip-text text-transparent" style={{ transform: 'skewX(-6deg)' }}>
              Funect
            </span>
          </h1>
          <p className="mt-2 text-lg text-slate-400">
            Sales Pipeline
          </p>
          <p className="mt-6 text-sm text-slate-400">
            Sign in to manage your sales prospects
          </p>
        </div>

        <div className="mt-8">
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Hello!
        </p>
      </div>
    </div>
  );
}
