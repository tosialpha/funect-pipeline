import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OrganizationProvider } from "@/lib/contexts/organization-context";
import { NavLink } from "@/components/ui/nav-link";

interface OrgLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function OrgLayout({ children, params }: OrgLayoutProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: membership, error } = await supabase
    .from("organization_members")
    .select(
      `
      role,
      organizations!inner (
        id,
        name,
        slug,
        logo_url,
        created_at,
        updated_at
      )
    `
    )
    .eq("user_id", user.id)
    .eq("organizations.slug", slug)
    .single();

  if (error || !membership) {
    notFound();
  }

  const orgs = membership.organizations;
  const organization = (Array.isArray(orgs) ? orgs[0] : orgs) as {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    created_at: string;
    updated_at: string;
  };

  const baseUrl = `/org/${slug}`;

  return (
    <OrganizationProvider organization={organization}>
      <div className="min-h-screen bg-[#0a0f1a] noise">
        {/* Background effects */}
        <div className="fixed inset-0 gradient-mesh pointer-events-none" />
        <div className="fixed inset-0 grid-pattern pointer-events-none opacity-50" />

        {/* Accent glow orbs */}
        <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-cyan-500/[0.07] rounded-full blur-[120px] pointer-events-none" />
        <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-sky-500/[0.05] rounded-full blur-[100px] pointer-events-none" />

        <div className="relative flex h-screen">
          {/* Sidebar */}
          <aside className="w-[280px] bg-[#0d1320]/80 backdrop-blur-xl border-r border-white/[0.06] flex flex-col">
            {/* Logo */}
            <div className="p-6">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-400 to-sky-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                    <span className="text-slate-900 font-bold text-lg">
                      {organization.name[0]}
                    </span>
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#0d1320]" />
                </div>
                <div>
                  <h1 className="text-[15px] font-semibold text-white tracking-tight">
                    {organization.name}
                  </h1>
                  <p className="text-[11px] text-slate-500 font-medium">Sales Pipeline</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-2">
              <div className="mb-6">
                <p className="px-3 mb-2 text-[10px] font-semibold text-slate-600 uppercase tracking-[0.15em]">
                  Overview
                </p>
                <div className="space-y-0.5">
                  <NavLink
                    href={`${baseUrl}/dashboard`}
                    icon={
                      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                      </svg>
                    }
                  >
                    Pipeline
                  </NavLink>
                  <NavLink
                    href={`${baseUrl}/prospects`}
                    icon={
                      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                      </svg>
                    }
                  >
                    Prospects
                  </NavLink>
                  <NavLink
                    href={`${baseUrl}/analytics`}
                    icon={
                      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                      </svg>
                    }
                  >
                    Analytics
                  </NavLink>
                </div>
              </div>

              <div className="mb-6">
                <p className="px-3 mb-2 text-[10px] font-semibold text-slate-600 uppercase tracking-[0.15em]">
                  Planning
                </p>
                <div className="space-y-0.5">
                  <NavLink
                    href={`${baseUrl}/todos`}
                    icon={
                      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    }
                  >
                    Tasks
                  </NavLink>
                  <NavLink
                    href={`${baseUrl}/calendar`}
                    icon={
                      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                      </svg>
                    }
                  >
                    Calendar
                  </NavLink>
                </div>
              </div>
            </nav>

            {/* User */}
            <div className="p-3 border-t border-white/[0.06]">
              <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.03] transition-colors cursor-pointer group">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500/20 to-sky-500/20 border border-cyan-500/20 flex items-center justify-center">
                  <span className="text-cyan-400 font-semibold text-sm">
                    {user.email?.[0].toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-slate-300 truncate group-hover:text-white transition-colors">
                    {user.email?.split('@')[0]}
                  </p>
                  <form action="/auth/signout" method="post">
                    <button className="text-[11px] text-slate-600 hover:text-cyan-400 transition-colors">
                      Sign out
                    </button>
                  </form>
                </div>
                <svg className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto scrollbar-thin">
            {children}
          </main>
        </div>
      </div>
    </OrganizationProvider>
  );
}
