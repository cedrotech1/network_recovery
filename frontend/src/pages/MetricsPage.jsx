import { useEffect, useState } from 'react';
import { networkService } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import {
  ChartCard,
  FailuresOverTimeChart,
  DetectionRecoveryTrendChart,
  StatusPieChart,
  ScenarioBarChart,
  NodeUptimeChart,
  LatencyTrendChart,
  ActionPieChart,
  RangePicker,
} from '../components/Charts';

function Kpi({ label, value, hint }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <p className="m-0 text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="m-0 mt-1 text-2xl font-bold text-gray-900">{value}</p>
      {hint ? <p className="m-0 mt-1 text-xs text-gray-500">{hint}</p> : null}
    </div>
  );
}

export default function MetricsPage() {
  const { showError } = useNotification();
  const [data, setData] = useState(null);
  const [range, setRange] = useState('15m');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    networkService
      .metrics({ range })
      .then((res) => {
        if (res.success) setData(res.data);
        else showError(res.message || 'Could not load statistics');
      })
      .catch((e) => showError(e.response?.data?.message || 'Could not load statistics'))
      .finally(() => setLoading(false));
  }, [range, showError]);

  const kpis = data?.kpis || {};
  const bucketMs = data?.range?.bucketMs || 30 * 1000;
  const rangeLabel = data?.range?.label || 'Last 15 minutes';
  const bucketLabel = data?.range?.bucketLabel || 'every 30 seconds';
  const hasTimelineEvents = (data?.timeline || []).some((p) => p.failures > 0 || p.recoveries > 0);
  const speedData = data?.speedTrend?.length ? data.speedTrend : data?.dailyTrend || [];

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="m-0 text-xl font-bold text-gray-900">Charts & statistics</h1>
          <p className="m-0 mt-1 text-sm text-gray-500 max-w-2xl">
            Start with a short window (minutes/seconds) for live demos, then switch to hours/days/weeks.
          </p>
        </div>
        <div className="text-right">
          <RangePicker value={range} onChange={setRange} />
          <p className="m-0 mt-1 text-xs text-gray-500">
            {rangeLabel} · buckets {bucketLabel}
          </p>
        </div>
      </div>

      {data?.plainExplanation ? (
        <div className="rounded-xl border border-[#cfe3ee] bg-[#f3f9fc] px-4 py-3 text-sm text-[#1e3c72]">
          <p className="m-0"><strong>What we watch:</strong> {data.plainExplanation.whatWeWatch}</p>
          <p className="m-0 mt-1"><strong>Why charts matter:</strong> {data.plainExplanation.howItHelps}</p>
        </div>
      ) : null}

      {loading && !data ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#00628b]" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <Kpi label="Problems found" value={kpis.totalFailures ?? 0} hint="Confirmed failures in this period" />
            <Kpi label="Automatic fixes" value={kpis.totalRecoveries ?? 0} hint={`${kpis.recoverySuccessRate ?? 0}% succeeded`} />
            <Kpi label="Avg time to notice" value={`${kpis.avgDetectionMs ?? 0} ms`} hint="Lower is better" />
            <Kpi label="Services healthy checks" value={`${kpis.healthSuccessRate ?? 0}%`} hint="Share of OK health checks" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <ChartCard
              title={`${rangeLabel} — problems vs fixes`}
              hint={`X-axis shows time in seconds/minutes for short windows (${bucketLabel}).`}
            >
              {hasTimelineEvents ? (
                <FailuresOverTimeChart data={data.timeline} bucketMs={bucketMs} />
              ) : (
                <EmptyChart />
              )}
            </ChartCard>

            <ChartCard
              title="Detection vs recovery speed"
              hint="How fast we notice vs how fast we fix, in the same time buckets."
            >
              {speedData.some((p) => (p.avgDetectionMs || 0) > 0 || (p.avgRecoveryMs || 0) > 0) ? (
                <DetectionRecoveryTrendChart data={speedData} bucketMs={bucketMs} />
              ) : (
                <EmptyChart />
              )}
            </ChartCard>

            <ChartCard title="Current service health mix" hint="Snapshot of how many services are OK vs in trouble.">
              {(data?.statusBreakdown || []).length ? (
                <StatusPieChart data={data.statusBreakdown} />
              ) : (
                <EmptyChart />
              )}
            </ChartCard>

            <ChartCard title="How we fixed problems" hint="Restart = reboot the same service. Backup = switch to standby.">
              {(data?.actionBreakdown || []).length ? (
                <ActionPieChart data={data.actionBreakdown} />
              ) : (
                <EmptyChart />
              )}
            </ChartCard>

            <ChartCard title="Which test scenarios happened most" hint="Useful after running S1–S8 intentional tests.">
              {(data?.summary || []).length ? (
                <ScenarioBarChart data={data.summary} />
              ) : (
                <EmptyChart />
              )}
            </ChartCard>

            <ChartCard title="Service working time %" hint="Higher % means the service stayed healthy more often.">
              {(data?.perNode || []).some((n) => n.uptimePercent != null) ? (
                <NodeUptimeChart data={(data.perNode || []).filter((n) => n.uptimePercent != null)} />
              ) : (
                <EmptyChart />
              )}
            </ChartCard>

            <ChartCard
              className="xl:col-span-2"
              title="Response time trend"
              hint={`Average reply speed over time (${bucketLabel}).`}
            >
              {(data?.latencyTrend || []).length ? (
                <LatencyTrendChart data={data.latencyTrend} bucketMs={bucketMs} />
              ) : (
                <EmptyChart />
              )}
            </ChartCard>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="m-0 text-sm font-semibold">Per-service summary</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Service</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Problems</th>
                    <th className="px-4 py-3">Fixes</th>
                    <th className="px-4 py-3">Fix success</th>
                    <th className="px-4 py-3">Working time</th>
                    <th className="px-4 py-3">Avg reply</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.perNode || []).map((row) => (
                    <tr key={row.key} className="border-t border-gray-100">
                      <td className="px-4 py-3 font-medium">{row.name}</td>
                      <td className="px-4 py-3 capitalize">{row.status}</td>
                      <td className="px-4 py-3">{row.failures}</td>
                      <td className="px-4 py-3">{row.recoveries}</td>
                      <td className="px-4 py-3">{row.recoverySuccessRate}%</td>
                      <td className="px-4 py-3">{row.uptimePercent != null ? `${row.uptimePercent}%` : '—'}</td>
                      <td className="px-4 py-3">{row.avgLatencyMs != null ? `${row.avgLatencyMs} ms` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="h-full flex items-center justify-center text-sm text-gray-500 px-6 text-center">
      No data in this period yet. Run a LIVE test, wait ~20 seconds, then refresh. Use “Last 15 minutes” during demos.
    </div>
  );
}
