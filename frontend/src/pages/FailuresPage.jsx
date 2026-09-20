import { useEffect, useState } from 'react';
import { networkService } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import { useRealtime } from '../hooks/useRealtime';
import { SortTh, TableToolbar, uniqueOptions, useTableControls } from '../components/TableControls';

export default function FailuresPage() {
  const { showError } = useNotification();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const enriched = rows.map((r) => ({
    ...r,
    nodeName: r.node?.name || r.nodeId,
    resolvedLabel: r.resolvedAt ? 'Resolved' : 'Open',
  }));

  const table = useTableControls(enriched, {
    searchKeys: ['nodeName', 'failureType', 'scenarioCode', 'details'],
    initialSort: 'detectedAt',
    initialDir: 'desc',
  });

  const load = async () => {
    try {
      const res = await networkService.failures({ limit: 500 });
      if (res.success) setRows(res.data || []);
      else showError(res.message || 'Failed to load failures');
    } catch (e) {
      showError(e.response?.data?.message || 'Failed to load failures');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useRealtime(() => load());

  return (
    <div className="space-y-4">
      <div>
        <h1 className="m-0 text-xl font-bold text-gray-900">Problems found</h1>
        <p className="m-0 mt-1 text-sm text-gray-500">
          These rows are recorded <strong>automatically</strong> when the system confirms a real failure (not from seed).
        </p>
      </div>

      <TableToolbar
        search={table.search}
        onSearch={table.setSearch}
        searchPlaceholder="Search service, type, scenario…"
        resultText={`Showing ${table.shown} of ${table.total}`}
        filters={[
          {
            key: 'nodeName',
            label: 'Service',
            value: table.filters.nodeName || 'all',
            onChange: (v) => table.setFilter('nodeName', v),
            options: uniqueOptions(enriched, 'nodeName'),
          },
          {
            key: 'scenarioCode',
            label: 'Scenario',
            value: table.filters.scenarioCode || 'all',
            onChange: (v) => table.setFilter('scenarioCode', v),
            options: uniqueOptions(enriched, 'scenarioCode'),
          },
          {
            key: 'resolvedLabel',
            label: 'State',
            value: table.filters.resolvedLabel || 'all',
            onChange: (v) => table.setFilter('resolvedLabel', v),
            options: [
              { value: 'Open', label: 'Open' },
              { value: 'Resolved', label: 'Resolved' },
            ],
          },
          {
            key: 'failureType',
            label: 'Type',
            value: table.filters.failureType || 'all',
            onChange: (v) => table.setFilter('failureType', v),
            options: uniqueOptions(enriched, 'failureType'),
          },
        ]}
      />

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#00628b]" />
          </div>
        ) : table.rows.length === 0 ? (
          <p className="p-8 text-sm text-gray-500 text-center">No failures match your filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs text-gray-500">
                <tr>
                  <SortTh label="Detected" active={table.sortKey === 'detectedAt'} dir={table.sortDir} onClick={() => table.toggleSort('detectedAt')} />
                  <SortTh label="Service" active={table.sortKey === 'nodeName'} dir={table.sortDir} onClick={() => table.toggleSort('nodeName')} />
                  <SortTh label="Type" active={table.sortKey === 'failureType'} dir={table.sortDir} onClick={() => table.toggleSort('failureType')} />
                  <SortTh label="Scenario" active={table.sortKey === 'scenarioCode'} dir={table.sortDir} onClick={() => table.toggleSort('scenarioCode')} />
                  <SortTh label="Detect ms" active={table.sortKey === 'detectionTimeMs'} dir={table.sortDir} onClick={() => table.toggleSort('detectionTimeMs')} />
                  <SortTh label="State" active={table.sortKey === 'resolvedLabel'} dir={table.sortDir} onClick={() => table.toggleSort('resolvedLabel')} />
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row) => (
                  <tr key={row.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 text-gray-700">{new Date(row.detectedAt).toLocaleString()}</td>
                    <td className="px-4 py-3">{row.nodeName}</td>
                    <td className="px-4 py-3">{row.failureType}</td>
                    <td className="px-4 py-3">{row.scenarioCode || '—'}</td>
                    <td className="px-4 py-3">
                      {row.detectionTimeMs != null ? `${row.detectionTimeMs} ms` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                          row.resolvedAt
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}
                      >
                        {row.resolvedLabel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
