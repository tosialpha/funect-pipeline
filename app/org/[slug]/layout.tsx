import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OrganizationProvider } from "@/lib/contexts/organization-context";
import { NavLink } from "@/components/ui/nav-link";
import Link from "next/link";

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

  // Get organization by slug and verify membership
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
    // User is not a member of this organization
    notFound();
  }

  // Handle both array and object response from Supabase join
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
      <div className="min-h-screen bg-[#0F1419]">
        <div className="flex h-screen">
          {/* Sidebar */}
          <aside className="w-64 bg-[#1A1F2E] border-r border-slate-800 flex flex-col">
            <div className="p-6">
              <h1 className="text-3xl font-bold text-white tracking-tight">
                <span
                  className="inline-block bg-gradient-to-r from-teal-400 via-teal-300 to-teal-500 bg-clip-text text-transparent"
                  style={{ transform: "skewX(-6deg)" }}
                >
                  {organization.name}
                </span>
              </h1>
              <p className="text-sm text-slate-400 mt-2 font-medium">
                Sales Pipeline
              </p>
            </div>

            <nav className="px-4 space-y-1 flex-1">
              <NavLink
                href={`${baseUrl}/dashboard`}
                icon={
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                }
              >
                Pipeline
              </NavLink>
              <NavLink
                href={`${baseUrl}/prospects`}
                icon={
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                }
              >
                Prospects
              </NavLink>
              <NavLink
                href={`${baseUrl}/analytics`}
                icon={
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                }
              >
                Analytics
              </NavLink>
              <NavLink
                href={`${baseUrl}/todos`}
                icon={
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                    />
                  </svg>
                }
              >
                To Do List
              </NavLink>
              <NavLink
                href={`${baseUrl}/calendar`}
                icon={
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                }
              >
                Calendar
              </NavLink>
            </nav>

            <div className="p-4 border-t border-slate-800">
              {/* User Info */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl flex items-center justify-center text-white font-semibold">
                  {user.email?.[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user.email}
                  </p>
                  <form action="/auth/signout" method="post">
                    <button className="text-xs text-slate-400 hover:text-slate-300">
                      Sign out
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto bg-[#0F1419] scroll-smooth">
            {children}
          </main>
        </div>
      </div>
    </OrganizationProvider>
  );
}
