import { useEffect, useState } from 'react';
import { networkService } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import { useRealtime } from '../hooks/useRealtime';
import { SortTh, TableToolbar, uniqueOptions, useTableControls } from '../components/TableControls';

export default function RecoveriesPage() {
  const { showError } = useNotification();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const enriched = rows.map((r) => ({
    ...r,
    nodeName: r.node?.name || r.nodeId,
    resultLabel: r.success ? 'Success' : 'Failed',
  }));

  const table = useTableControls(enriched, {
    searchKeys: ['nodeName', 'actionType', 'targetNodeKey', 'details', 'resultLabel'],
    initialSort: 'startedAt',
    initialDir: 'desc',
  });

  const load = async () => {
    try {
      const res = await networkService.recoveries({ limit: 500 });
      if (res.success) setRows(res.data || []);
      else showError(res.message || 'Failed to load recoveries');
    } catch (e) {
      showError(e.response?.data?.message || 'Failed to load recoveries');
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
        <h1 className="m-0 text-xl font-bold text-gray-900">Fixes done</h1>
        <p className="m-0 mt-1 text-sm text-gray-500">
          These rows are recorded <strong>automatically</strong> when restart/failover runs (not dummy seed data).
        </p>
      </div>

      <TableToolbar
        search={table.search}
        onSearch={table.setSearch}
        searchPlaceholder="Search service, action, details…"
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
            key: 'actionType',
            label: 'Action',
            value: table.filters.actionType || 'all',
            onChange: (v) => table.setFilter('actionType', v),
            options: uniqueOptions(enriched, 'actionType'),
          },
          {
            key: 'resultLabel',
            label: 'Result',
            value: table.filters.resultLabel || 'all',
            onChange: (v) => table.setFilter('resultLabel', v),
            options: [
              { value: 'Success', label: 'Success' },
              { value: 'Failed', label: 'Failed' },
            ],
          },
        ]}
      />

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#00628b]" />
          </div>
        ) : table.rows.length === 0 ? (
          <p className="p-8 text-sm text-gray-500 text-center">No recoveries match your filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs text-gray-500">
                <tr>
                  <SortTh label="Started" active={table.sortKey === 'startedAt'} dir={table.sortDir} onClick={() => table.toggleSort('startedAt')} />
                  <SortTh label="Service" active={table.sortKey === 'nodeName'} dir={table.sortDir} onClick={() => table.toggleSort('nodeName')} />
                  <SortTh label="Action" active={table.sortKey === 'actionType'} dir={table.sortDir} onClick={() => table.toggleSort('actionType')} />
                  <SortTh label="Target" active={table.sortKey === 'targetNodeKey'} dir={table.sortDir} onClick={() => table.toggleSort('targetNodeKey')} />
                  <SortTh label="Duration" active={table.sortKey === 'durationMs'} dir={table.sortDir} onClick={() => table.toggleSort('durationMs')} />
                  <SortTh label="Result" active={table.sortKey === 'resultLabel'} dir={table.sortDir} onClick={() => table.toggleSort('resultLabel')} />
                  <th className="px-4 py-3 uppercase">Details</th>
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row) => (
                  <tr key={row.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 text-gray-700">{new Date(row.startedAt).toLocaleString()}</td>
                    <td className="px-4 py-3">{row.nodeName}</td>
                    <td className="px-4 py-3 capitalize">{row.actionType}</td>
                    <td className="px-4 py-3">{row.targetNodeKey || '—'}</td>
                    <td className="px-4 py-3">{row.durationMs != null ? `${row.durationMs} ms` : '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                          row.success
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}
                      >
                        {row.resultLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate" title={row.details}>
                      {row.details}
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
