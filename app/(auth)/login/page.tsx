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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-10 shadow-2xl dark:bg-slate-900">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            Funect
          </h1>
          <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">
            Sales Pipeline
          </p>
          <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
            Sign in to manage your sales prospects
          </p>
        </div>

        <div className="mt-8">
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
          Internal tool for Funect team members only
        </p>
      </div>
    </div>
  );
}
