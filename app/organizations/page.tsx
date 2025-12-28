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

  // Get user's organizations
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

  // If user has exactly one org, redirect directly to it
  if (memberships && memberships.length === 1 && memberships[0].organizations) {
    const org = memberships[0].organizations as { slug: string };
    redirect(`/org/${org.slug}/dashboard`);
  }

  // If user has no orgs, show a message
  if (!memberships || memberships.length === 0) {
    return (
      <div className="min-h-screen bg-[#0F1419] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            No Organizations
          </h1>
          <p className="text-slate-400 mb-6">
            You are not a member of any organization yet.
          </p>
          <p className="text-sm text-slate-500">
            Contact an administrator to get access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1419] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Select Organization
          </h1>
          <p className="text-slate-400">
            Choose which project you want to work on
          </p>
        </div>

        <div className="space-y-3">
          {memberships.map((membership) => {
            const org = membership.organizations as {
              id: string;
              name: string;
              slug: string;
              logo_url: string | null;
            };

            return (
              <Link
                key={org.id}
                href={`/org/${org.slug}/dashboard`}
                className="block p-4 bg-[#1A1F2E] border border-slate-800 rounded-xl hover:border-teal-500/50 hover:bg-[#1E2433] transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                    {org.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-white group-hover:text-teal-400 transition-colors">
                      {org.name}
                    </h2>
                    <p className="text-sm text-slate-400">
                      {membership.role === "owner"
                        ? "Owner"
                        : membership.role === "admin"
                        ? "Admin"
                        : "Member"}
                    </p>
                  </div>
                  <svg
                    className="w-5 h-5 text-slate-400 group-hover:text-teal-400 transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Signed in as {user.email}</span>
            <form action="/auth/signout" method="post">
              <button className="text-slate-400 hover:text-white transition-colors">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
