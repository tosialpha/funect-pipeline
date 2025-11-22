import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const supabase = await createClient();

  // Fetch all prospects
  const { data: prospects } = await supabase
    .from("prospects")
    .select("*");

  // Calculate metrics
  const totalProspects = prospects?.length || 0;
  const closedWon = prospects?.filter(p => p.pipeline_stage === 'offer_accepted').length || 0;
  const closedLost = prospects?.filter(p => p.pipeline_stage === 'offer_rejected').length || 0;
  const totalClosed = closedWon + closedLost;
  const conversionRate = totalClosed > 0 ? ((closedWon / totalClosed) * 100).toFixed(1) : 0;

  // Calculate prospects by stage
  const stageData = [
    {
      name: 'Not Contacted',
      count: prospects?.filter(p => p.pipeline_stage === 'not_contacted').length || 0,
      color: 'bg-slate-500'
    },
    {
      name: 'Cold Called',
      count: prospects?.filter(p => p.pipeline_stage === 'cold_called').length || 0,
      color: 'bg-blue-500'
    },
    {
      name: 'First Demo',
      count: prospects?.filter(p => p.pipeline_stage === 'first_demo').length || 0,
      color: 'bg-purple-500'
    },
    {
      name: 'Second Demo',
      count: prospects?.filter(p => p.pipeline_stage === 'second_demo').length || 0,
      color: 'bg-teal-500'
    },
    {
      name: 'Offer Sent',
      count: prospects?.filter(p => p.pipeline_stage === 'offer_sent').length || 0,
      color: 'bg-orange-500'
    },
    {
      name: 'Offer Accepted',
      count: closedWon,
      color: 'bg-green-500'
    },
  ];

  const maxCount = Math.max(...stageData.map(s => s.count), 1);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white">
          Analytics
        </h2>
        <p className="text-slate-400 mt-2">
          Track your sales performance and pipeline metrics
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#1A1F2E] rounded-2xl p-6 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-400">Total Prospects</h3>
          </div>
          <p className="text-3xl font-bold text-white">{totalProspects}</p>
          <p className="text-sm text-slate-500 mt-2">in pipeline</p>
        </div>

        <div className="bg-[#1A1F2E] rounded-2xl p-6 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-400">Win Rate</h3>
          </div>
          <p className="text-3xl font-bold text-white">{conversionRate}%</p>
          <p className="text-sm text-slate-500 mt-2">{closedWon} won, {closedLost} lost</p>
        </div>

        <div className="bg-[#1A1F2E] rounded-2xl p-6 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-400">Active Deals</h3>
          </div>
          <p className="text-3xl font-bold text-white">{totalProspects - totalClosed}</p>
          <p className="text-sm text-slate-500 mt-2">in progress</p>
        </div>
      </div>

      {/* Pipeline by Stage */}
      <div className="bg-[#1A1F2E] rounded-2xl border border-slate-800 p-6 mb-8">
        <h3 className="text-lg font-semibold text-white mb-6">
          Pipeline by Stage
        </h3>
        <div className="space-y-4">
          {stageData.map((stage) => (
            <div key={stage.name}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-300">
                  {stage.name}
                </span>
                <span className="text-sm text-slate-400">
                  {stage.count} prospect{stage.count !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2.5">
                <div
                  className={`${stage.color} h-2.5 rounded-full transition-all`}
                  style={{ width: `${(stage.count / maxCount) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Priority Breakdown */}
      <div className="bg-[#1A1F2E] rounded-2xl border border-slate-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-6">
          Priority Breakdown
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-6 bg-red-500/10 rounded-xl border border-red-500/20">
            <p className="text-3xl font-bold text-red-400">
              {prospects?.filter(p => p.priority === 'high').length || 0}
            </p>
            <p className="text-sm text-red-400 mt-2 font-medium">High Priority</p>
          </div>
          <div className="text-center p-6 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
            <p className="text-3xl font-bold text-yellow-400">
              {prospects?.filter(p => p.priority === 'medium').length || 0}
            </p>
            <p className="text-sm text-yellow-400 mt-2 font-medium">Medium Priority</p>
          </div>
          <div className="text-center p-6 bg-green-500/10 rounded-xl border border-green-500/20">
            <p className="text-3xl font-bold text-green-400">
              {prospects?.filter(p => p.priority === 'low').length || 0}
            </p>
            <p className="text-sm text-green-400 mt-2 font-medium">Low Priority</p>
          </div>
        </div>
      </div>
    </div>
  );
}
