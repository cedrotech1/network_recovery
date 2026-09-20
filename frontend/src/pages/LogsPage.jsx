import { useCallback, useEffect, useState } from 'react';
import { ScrollText, RefreshCw } from 'lucide-react';
import { networkService } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import { useRealtime } from '../hooks/useRealtime';
import { TableToolbar, uniqueOptions, useTableControls } from '../components/TableControls';

const TYPE_FILTERS = [
  { id: 'all', label: 'All events' },
  { id: 'important', label: 'Failures + fixes only' },
  { id: 'failure', label: 'Failures (red)' },
  { id: 'recovery', label: 'Auto fixed / recovery' },
  { id: 'health_fail', label: 'Failed health checks' },
  { id: 'health_ok', label: 'OK health checks' },
];

function tone(level) {
  switch (level) {
    case 'danger':
      return {
        row: 'border-l-4 border-l-red-500 bg-red-50',
        badge: 'bg-red-600 text-white',
        title: 'text-red-800',
      };
    case 'success':
      return {
        row: 'border-l-4 border-l-emerald-500 bg-emerald-50',
        badge: 'bg-emerald-600 text-white',
        title: 'text-emerald-800',
      };
    case 'warning':
      return {
        row: 'border-l-4 border-l-amber-500 bg-amber-50',
        badge: 'bg-amber-500 text-white',
        title: 'text-amber-900',
      };
    default:
      return {
        row: 'border-l-4 border-l-slate-300 bg-white',
        badge: 'bg-slate-500 text-white',
        title: 'text-slate-800',
      };
  }
}

function formatTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

export default function LogsPage() {
  const { showError } = useNotification();
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [filter, setFilter] = useState('all');
  const [includeHealthy, setIncludeHealthy] = useState(false);
  const [loading, setLoading] = useState(true);

  const table = useTableControls(logs, {
    searchKeys: ['title', 'service', 'message', 'details', 'type', 'serviceKey'],
    initialSort: 'at',
    initialDir: 'desc',
  });

  const load = useCallback(async () => {
    try {
      const res = await networkService.logs({
        type: filter,
        limit: 500,
        includeHealthy: includeHealthy ? 'true' : 'false',
      });
      if (res.success) {
        setLogs(res.data || []);
        setSummary(res.summary || null);
      } else showError(res.message || 'Could not load logs');
    } catch (e) {
      showError(e.response?.data?.message || 'Could not load logs');
    } finally {
      setLoading(false);
    }
  }, [filter, includeHealthy, showError]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  useRealtime(() => {
    load();
  });

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="m-0 text-xl font-bold text-gray-900">Activity logs (by time)</h1>
          <p className="m-0 mt-1 text-sm text-gray-500 max-w-2xl">
            Long live history recorded automatically. Red = failure, green = auto fixed, orange = failed check.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            load();
          }}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {summary ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
          <SummaryChip label="API total (type)" value={summary.total} tone="slate" />
          <SummaryChip label="Failures" value={summary.failures} tone="red" />
          <SummaryChip label="Auto fixed" value={summary.autoFixed} tone="green" />
          <SummaryChip label="Recovery failed" value={summary.recoveryFailed} tone="red" />
          <SummaryChip label="Health fails" value={summary.healthFails} tone="amber" />
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {TYPE_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium border ${
              filter === f.id
                ? 'bg-[#00628b] text-white border-[#00628b]'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
        <label className="ml-auto inline-flex items-center gap-2 text-xs text-gray-600">
          <input
            type="checkbox"
            checked={includeHealthy}
            onChange={(e) => setIncludeHealthy(e.target.checked)}
          />
          Also include OK health checks
        </label>
      </div>

      <TableToolbar
        search={table.search}
        onSearch={table.setSearch}
        searchPlaceholder="Search logs by service, message, title…"
        resultText={`Showing ${table.shown} of ${table.total}`}
        filters={[
          {
            key: 'service',
            label: 'Service',
            value: table.filters.service || 'all',
            onChange: (v) => table.setFilter('service', v),
            options: uniqueOptions(logs, 'service'),
          },
          {
            key: 'level',
            label: 'Level',
            value: table.filters.level || 'all',
            onChange: (v) => table.setFilter('level', v),
            options: [
              { value: 'danger', label: 'Red (danger)' },
              { value: 'success', label: 'Green (success)' },
              { value: 'warning', label: 'Orange (warning)' },
              { value: 'info', label: 'Gray (info)' },
            ],
          },
          {
            key: 'type',
            label: 'Type',
            value: table.filters.type || 'all',
            onChange: (v) => table.setFilter('type', v),
            options: uniqueOptions(logs, 'type'),
          },
        ]}
      >
        <select
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          value={table.sortDir}
          onChange={(e) => {
            table.setSortKey('at');
            table.setSortDir(e.target.value);
          }}
          title="Sort direction"
        >
          <option value="desc">Newest first</option>
          <option value="asc">Oldest first</option>
        </select>
      </TableToolbar>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <ScrollText size={16} className="text-[#00628b]" />
          <h2 className="m-0 text-sm font-semibold">Timeline</h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#00628b]" />
          </div>
        ) : table.rows.length === 0 ? (
          <p className="p-8 text-sm text-gray-500 text-center">
            No logs match. Run a LIVE test, then refresh.
          </p>
        ) : (
          <ul className="m-0 p-0 list-none divide-y divide-gray-100 max-h-[70vh] overflow-y-auto">
            {table.rows.map((log) => {
              const t = tone(log.level);
              return (
                <li key={log.id} className={`px-4 py-3 ${t.row}`}>
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`inline-flex rounded px-2 py-0.5 text-[10px] font-bold tracking-wide ${t.badge}`}>
                          {log.title}
                        </span>
                        <span className="text-xs text-gray-500">{formatTime(log.at)}</span>
                      </div>
                      <p className={`m-0 text-sm font-semibold ${t.title}`}>{log.service}</p>
                      <p className="m-0 mt-0.5 text-sm text-gray-700">{log.message}</p>
                      {log.details ? <p className="m-0 mt-1 text-xs text-gray-500">{log.details}</p> : null}
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-500">
                        {log.meta?.scenarioCode ? <span>Scenario: {log.meta.scenarioCode}</span> : null}
                        {log.meta?.actionType ? <span>Action: {log.meta.actionType}</span> : null}
                        {log.meta?.durationMs != null ? <span>Duration: {log.meta.durationMs} ms</span> : null}
                        {log.meta?.detectionTimeMs != null ? <span>Detect: {log.meta.detectionTimeMs} ms</span> : null}
                        {log.meta?.latencyMs != null ? <span>Latency: {log.meta.latencyMs} ms</span> : null}
                        {log.meta?.open === true ? <span className="text-red-600 font-medium">Still open</span> : null}
                        {log.meta?.open === false ? <span className="text-emerald-700">Resolved</span> : null}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function SummaryChip({ label, value, tone }) {
  const colors = {
    red: 'bg-red-50 border-red-200 text-red-800',
    green: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    amber: 'bg-amber-50 border-amber-200 text-amber-900',
    slate: 'bg-slate-50 border-slate-200 text-slate-800',
  };
  return (
    <div className={`rounded-xl border px-3 py-2 ${colors[tone] || colors.slate}`}>
      <p className="m-0 text-[11px] uppercase tracking-wide opacity-80">{label}</p>
      <p className="m-0 text-lg font-bold">{value ?? 0}</p>
    </div>
  );
}
