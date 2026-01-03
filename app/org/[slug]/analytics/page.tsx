import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface AnalyticsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function AnalyticsPage({ params }: AnalyticsPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", slug)
    .single();

  if (!org) {
    return <div className="p-8 text-white">Organization not found</div>;
  }

  const { data: prospects } = await supabase
    .from("prospects")
    .select("*")
    .eq("organization_id", org.id);

  const totalProspects = prospects?.length || 0;
  const closedWon = prospects?.filter(p => p.pipeline_stage === 'offer_accepted').length || 0;
  const closedLost = prospects?.filter(p => p.pipeline_stage === 'offer_rejected').length || 0;
  const totalClosed = closedWon + closedLost;
  const conversionRate = totalClosed > 0 ? ((closedWon / totalClosed) * 100).toFixed(1) : 0;

  const stageData = [
    {
      name: 'Not Contacted',
      count: prospects?.filter(p => p.pipeline_stage === 'not_contacted').length || 0,
      color: 'bg-slate-500',
      textColor: 'text-slate-400'
    },
    {
      name: 'Cold Called',
      count: prospects?.filter(p => p.pipeline_stage === 'cold_called').length || 0,
      color: 'bg-blue-500',
      textColor: 'text-blue-400'
    },
    {
      name: 'First Demo',
      count: prospects?.filter(p => p.pipeline_stage === 'first_demo').length || 0,
      color: 'bg-purple-500',
      textColor: 'text-purple-400'
    },
    {
      name: 'Second Demo',
      count: prospects?.filter(p => p.pipeline_stage === 'second_demo').length || 0,
      color: 'bg-cyan-500',
      textColor: 'text-cyan-400'
    },
    {
      name: 'Offer Sent',
      count: prospects?.filter(p => p.pipeline_stage === 'offer_sent').length || 0,
      color: 'bg-orange-500',
      textColor: 'text-orange-400'
    },
    {
      name: 'Won',
      count: closedWon,
      color: 'bg-emerald-500',
      textColor: 'text-emerald-400'
    },
  ];

  const maxCount = Math.max(...stageData.map(s => s.count), 1);

  const highPriority = prospects?.filter(p => p.priority === 'high').length || 0;
  const mediumPriority = prospects?.filter(p => p.priority === 'medium').length || 0;
  const lowPriority = prospects?.filter(p => p.priority === 'low').length || 0;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white tracking-tight">
          Analytics
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          Track your sales performance and pipeline metrics
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {/* Total Prospects */}
        <div className="bg-slate-900/30 backdrop-blur-sm rounded-xl border border-slate-800/50 p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-colors" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-slate-400">Total Prospects</h3>
            </div>
            <p className="text-4xl font-bold text-white tracking-tight">{totalProspects}</p>
            <p className="text-sm text-slate-600 mt-1">in pipeline</p>
          </div>
        </div>

        {/* Win Rate */}
        <div className="bg-slate-900/30 backdrop-blur-sm rounded-xl border border-slate-800/50 p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-slate-400">Win Rate</h3>
            </div>
            <p className="text-4xl font-bold text-white tracking-tight">{conversionRate}%</p>
            <p className="text-sm text-slate-600 mt-1">
              <span className="text-emerald-400">{closedWon} won</span>
              <span className="mx-1.5">·</span>
              <span className="text-red-400">{closedLost} lost</span>
            </p>
          </div>
        </div>

        {/* Active Deals */}
        <div className="bg-slate-900/30 backdrop-blur-sm rounded-xl border border-slate-800/50 p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-colors" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-slate-400">Active Deals</h3>
            </div>
            <p className="text-4xl font-bold text-white tracking-tight">{totalProspects - totalClosed}</p>
            <p className="text-sm text-slate-600 mt-1">in progress</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline by Stage */}
        <div className="bg-slate-900/30 backdrop-blur-sm rounded-xl border border-slate-800/50 p-6">
          <h3 className="text-base font-semibold text-white mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
            Pipeline by Stage
          </h3>
          <div className="space-y-5">
            {stageData.map((stage) => (
              <div key={stage.name}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-300">
                    {stage.name}
                  </span>
                  <span className={`text-sm font-semibold ${stage.textColor}`}>
                    {stage.count}
                  </span>
                </div>
                <div className="h-2 bg-slate-800/50 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${stage.color} rounded-full transition-all duration-500 ease-out`}
                    style={{ width: `${(stage.count / maxCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="bg-slate-900/30 backdrop-blur-sm rounded-xl border border-slate-800/50 p-6">
          <h3 className="text-base font-semibold text-white mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0l-3.75-3.75M17.25 21L21 17.25" />
            </svg>
            Priority Breakdown
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-5 bg-red-500/5 rounded-xl border border-red-500/10 hover:border-red-500/20 transition-colors">
              <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-red-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <p className="text-3xl font-bold text-red-400">{highPriority}</p>
              <p className="text-xs text-slate-500 mt-1 font-medium">High Priority</p>
            </div>
            <div className="text-center p-5 bg-orange-500/5 rounded-xl border border-orange-500/10 hover:border-orange-500/20 transition-colors">
              <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-3xl font-bold text-orange-400">{mediumPriority}</p>
              <p className="text-xs text-slate-500 mt-1 font-medium">Medium Priority</p>
            </div>
            <div className="text-center p-5 bg-emerald-500/5 rounded-xl border border-emerald-500/10 hover:border-emerald-500/20 transition-colors">
              <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-3xl font-bold text-emerald-400">{lowPriority}</p>
              <p className="text-xs text-slate-500 mt-1 font-medium">Low Priority</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
