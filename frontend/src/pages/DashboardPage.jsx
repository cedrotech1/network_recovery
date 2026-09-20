import { useCallback, useEffect, useState } from 'react';
import { Activity, AlertTriangle, RefreshCw, Server, Timer } from 'lucide-react';
import { networkService } from '../services/api';
import { useRealtime } from '../hooks/useRealtime';
import { statusTone } from '../utils/roles';
import { useNotification } from '../contexts/NotificationContext';
import { ChartCard, StatusPieChart, FailuresOverTimeChart, RangePicker } from '../components/Charts';

function StatCard({ icon, label, value, hint }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="m-0 text-xs uppercase tracking-wide text-gray-500">{label}</p>
          <p className="m-0 mt-1 text-2xl font-bold text-gray-900">{value}</p>
          {hint ? <p className="m-0 mt-1 text-xs text-gray-500">{hint}</p> : null}
        </div>
        <div className="h-10 w-10 rounded-lg bg-[#e8f3f8] text-[#00628b] flex items-center justify-center">
          {icon}
        </div>
      </div>
    </div>
  );
}

function plainStatus(status) {
  const map = {
    healthy: 'Working well',
    degraded: 'Having trouble',
    failed: 'Not working',
    recovering: 'Being fixed…',
    failed_over: 'Using backup',
    unknown: 'Checking…',
  };
  return map[status] || status;
}

export default function DashboardPage() {
  const { showError } = useNotification();
  const [data, setData] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [range, setRange] = useState('15m');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [dash, met] = await Promise.all([
        networkService.dashboard(),
        networkService.metrics({ range }),
      ]);
      if (dash.success) setData(dash.data);
      else showError(dash.message || 'Failed to load dashboard');
      if (met.success) setMetrics(met.data);
    } catch (e) {
      showError(e.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [showError, range]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const { connected } = useRealtime(() => {
    load();
  });

  if (loading && !data) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#00628b]" />
      </div>
    );
  }

  const totals = data?.totals || {};
  const kpis = data?.kpis || {};
  const nodes = data?.nodes || [];
  const bucketMs = metrics?.range?.bucketMs || metrics?.kpis?.bucketMs || 30 * 1000;
  const rangeLabel = metrics?.range?.label || 'Last 15 minutes';
  const bucketLabel = metrics?.range?.bucketLabel || 'every 30 seconds';
  const hasTimelineEvents = (metrics?.timeline || []).some((p) => p.failures > 0 || p.recoveries > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="m-0 text-xl font-bold text-gray-900">Home — are our services OK?</h1>
          <p className="m-0 mt-1 text-sm text-gray-500 max-w-2xl">
            This screen shows the university lab services we watch. Green means working.
            If something breaks, the system tries to fix it automatically.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <RangePicker value={range} onChange={setRange} />
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium border ${
              connected ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-600 border-gray-200'
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-gray-400'}`} />
            {connected ? 'Live updates ON' : 'Live updates OFF'}
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-[#cfe3ee] bg-[#f3f9fc] px-4 py-3 text-sm text-[#1e3c72]">
        We are watching <strong>internal campus lab services</strong> (website, campus app, student portal, API) —
        not the public internet. The system detects failures and recovers automatically.
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={<Server size={18} />} label="Services watched" value={totals.nodes ?? 0} hint={`${totals.healthy ?? 0} working well`} />
        <StatCard icon={<AlertTriangle size={18} />} label="Open problems" value={totals.openFailures ?? 0} hint={`${totals.failures ?? 0} total recorded`} />
        <StatCard icon={<RefreshCw size={18} />} label="Automatic fixes" value={totals.recoveries ?? 0} hint={`${kpis.recoverySuccessRate ?? 0}% success`} />
        <StatCard icon={<Timer size={18} />} label="Avg time to notice" value={`${kpis.avgDetectionMs ?? 0} ms`} hint={`Avg fix ${kpis.avgRecoveryMs ?? 0} ms`} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <ChartCard title="Today’s health mix" hint="Quick picture of how many services are OK right now.">
          {(metrics?.statusBreakdown || []).length ? (
            <StatusPieChart data={metrics.statusBreakdown} />
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-gray-500">Waiting for status data…</div>
          )}
        </ChartCard>
        <ChartCard
          title={`${rangeLabel} — problems vs fixes`}
          hint={`Points shown ${bucketLabel}. Labels use seconds/minutes for short windows.`}
        >
          {hasTimelineEvents ? (
            <FailuresOverTimeChart data={metrics.timeline} bucketMs={bucketMs} />
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-gray-500 px-4 text-center">
              No problems in {rangeLabel.toLowerCase()} yet. Run a LIVE test, keep this page open, and watch points appear by minute/second.
            </div>
          )}
        </ChartCard>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <Activity size={16} className="text-[#00628b]" />
          <h2 className="m-0 text-sm font-semibold text-gray-900">Each service right now</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Service</th>
                <th className="px-4 py-3 font-medium">What it is</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Failed checks in a row</th>
                <th className="px-4 py-3 font-medium">Reply speed</th>
              </tr>
            </thead>
            <tbody>
              {nodes.map((node) => (
                <tr key={node.id} className="border-t border-gray-100">
                  <td className="px-4 py-3">
                    <p className="m-0 font-medium text-gray-900">{node.name}</p>
                    <p className="m-0 text-xs text-gray-500 capitalize">{node.role} service</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs">{node.description || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusTone(node.status)}`}>
                      {plainStatus(node.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{node.consecutiveFailures}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {node.lastLatencyMs != null ? `${node.lastLatencyMs} ms` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
