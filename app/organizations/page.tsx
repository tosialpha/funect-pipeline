import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function OrganizationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: memberships, error } = await supabase
    .from("organization_members")
    .select(
      `
      role,
      organizations (
        id,
        name,
        slug,
        logo_url
      )
    `
    )
    .eq("user_id", user.id);

  if (error) {
    console.error("Error fetching organizations:", error);
  }

  if (memberships && memberships.length === 1 && memberships[0].organizations) {
    const orgs = memberships[0].organizations;
    const org = (Array.isArray(orgs) ? orgs[0] : orgs) as { slug: string };
    redirect(`/org/${org.slug}/dashboard`);
  }

  if (!memberships || memberships.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-sky-500/10 rounded-full blur-[100px]" />
        </div>
        <div className="relative text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-slate-800/50 flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-white mb-3">
            No Organizations
          </h1>
          <p className="text-slate-500 mb-6">
            You are not a member of any organization yet.
          </p>
          <p className="text-sm text-slate-600">
            Contact an administrator to get access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-sky-500/10 rounded-full blur-[100px]" />
      </div>

      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: `linear-gradient(rgba(6, 182, 212, 0.03) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(6, 182, 212, 0.03) 1px, transparent 1px)`,
        backgroundSize: '40px 40px'
      }} />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br from-cyan-400 to-sky-500 flex items-center justify-center shadow-lg shadow-cyan-500/25">
            <svg className="w-7 h-7 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-white mb-2">
            Select Organization
          </h1>
          <p className="text-slate-500 text-sm">
            Choose which project you want to work on
          </p>
        </div>

        <div className="space-y-3">
          {memberships.map((membership) => {
            const orgs = membership.organizations;
            const org = (Array.isArray(orgs) ? orgs[0] : orgs) as {
              id: string;
              name: string;
              slug: string;
              logo_url: string | null;
            };

            return (
              <Link
                key={org.id}
                href={`/org/${org.slug}/dashboard`}
                className="block p-4 bg-slate-900/50 backdrop-blur-sm border border-white/[0.08] rounded-xl hover:border-cyan-500/30 hover:bg-slate-800/50 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-sky-500 rounded-xl flex items-center justify-center text-slate-900 font-bold text-xl shadow-lg shadow-cyan-500/20">
                    {org.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-base font-semibold text-white group-hover:text-cyan-400 transition-colors">
                      {org.name}
                    </h2>
                    <p className="text-sm text-slate-500">
                      {membership.role === "owner"
                        ? "Owner"
                        : membership.role === "admin"
                        ? "Admin"
                        : "Member"}
                    </p>
                  </div>
                  <svg
                    className="w-5 h-5 text-slate-600 group-hover:text-cyan-400 transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8.25 4.5l7.5 7.5-7.5 7.5"
                    />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-8 pt-6 border-t border-white/[0.06]">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Signed in as {user.email?.split('@')[0]}</span>
            <form action="/auth/signout" method="post">
              <button className="text-slate-500 hover:text-cyan-400 transition-colors">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
