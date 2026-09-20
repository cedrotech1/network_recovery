import { useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { nodesService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { canManageOrg, statusTone } from '../utils/roles';
import { useRealtime } from '../hooks/useRealtime';
import { SortTh, TableToolbar, uniqueOptions, useTableControls } from '../components/TableControls';

function plainStatus(status) {
  const map = {
    healthy: 'Working well',
    degraded: 'Having trouble',
    failed: 'Not working',
    recovering: 'Being fixed',
    failed_over: 'Using backup',
    unknown: 'Checking',
  };
  return map[status] || status;
}

function suggestPort(nodes) {
  const used = new Set((nodes || []).map((n) => Number(n.port)).filter(Boolean));
  let port = 9407;
  while (used.has(port) && port < 9499) port += 1;
  return port;
}

function slugKey(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export default function NodesPage() {
  const { user } = useAuth();
  const { showError, showSuccess } = useNotification();
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    key: '',
    description: '',
    port: '',
    recoveryPolicy: 'restart',
    role: 'primary',
  });
  const canAdd = canManageOrg(user?.role);
  const nextPort = useMemo(() => suggestPort(nodes), [nodes]);

  const table = useTableControls(nodes, {
    searchKeys: ['name', 'key', 'host', 'description', 'role', 'status', 'recoveryPolicy'],
    initialSort: 'name',
    initialDir: 'asc',
  });

  const load = async () => {
    try {
      // heal=1 makes local added services start like the default lab nodes
      const res = await nodesService.getAll({ heal: 1 });
      if (res.success) setNodes(res.data || []);
      else showError(res.message || 'Failed to load nodes');
    } catch (e) {
      showError(e.response?.data?.message || 'Failed to load nodes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useRealtime((event, payload) => {
    if (event === 'node:updated' && payload?.id) {
      setNodes((prev) => prev.map((n) => (n.id === payload.id ? payload : n)));
    } else {
      load();
    }
  });

  const openForm = () => {
    setForm({
      name: '',
      key: '',
      description: '',
      port: String(nextPort),
      recoveryPolicy: 'restart',
      role: 'primary',
    });
    setShowForm(true);
  };

  const recover = async (id) => {
    try {
      const res = await nodesService.recover(id);
      if (res.success) {
        showSuccess('Manual recovery triggered');
        load();
      } else showError(res.message || 'Recovery failed');
    } catch (e) {
      showError(e.response?.data?.message || 'Recovery failed');
    }
  };

  const submitAdd = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showError('Service name is required');
      return;
    }
    setSaving(true);
    try {
      const key = (form.key.trim() || slugKey(form.name) || `service-${Date.now()}`).toLowerCase();
      const payload = {
        key,
        name: form.name.trim(),
        description: form.description.trim() || `Lab service: ${form.name.trim()}`,
        host: '127.0.0.1',
        port: Number(form.port) || nextPort,
        healthPath: '/health',
        recoverPath: '/admin/recover',
        injectPath: '/admin/inject',
        role: form.role,
        recoveryPolicy: form.recoveryPolicy,
        isMonitored: true,
        isActive: true,
        autoProvision: true,
      };
      const res = await nodesService.create(payload);
      if (res.success) {
        showSuccess(res.message || `Service added on port ${res.data?.port || payload.port}`);
        setShowForm(false);
        setLoading(true);
        await load();
      } else showError(res.message || 'Could not add service');
    } catch (err) {
      showError(err.response?.data?.message || 'Could not add service');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="m-0 text-xl font-bold text-gray-900">Our services</h1>
          <p className="m-0 mt-1 text-sm text-gray-500 max-w-3xl">
            Default lab services use ports 9401–9406. Add another local service with a free port (suggested {nextPort}).
            After save/refresh it works like the others (same health, recover, and monitoring).
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw size={16} /> Refresh
          </button>
          {canAdd ? (
            <button
              type="button"
              onClick={() => (showForm ? setShowForm(false) : openForm())}
              className="inline-flex items-center gap-2 rounded-lg bg-[#00628b] px-3 py-2 text-sm font-medium text-white hover:bg-[#004e6e]"
            >
              <Plus size={16} />
              {showForm ? 'Close form' : 'Add service'}
            </button>
          ) : null}
        </div>
      </div>

      {canAdd && showForm ? (
        <form onSubmit={submitAdd} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
          <h2 className="m-0 text-sm font-bold text-[#1e3c72]">Add lab service</h2>
          <p className="m-0 text-xs text-gray-500">
            Use a free port. The system starts a simulated process automatically, checks health, then saves.
            Refresh afterwards if needed — it should show Working well like Campus App / Portal.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            <label className="text-xs text-gray-600 space-y-1">
              <span>Display name *</span>
              <input
                required
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((p) => ({
                    ...p,
                    name,
                    key: p.key && p.key !== slugKey(p.name) ? p.key : slugKey(name),
                  }));
                }}
                placeholder="e.g. Staff Portal App"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs text-gray-600 space-y-1">
              <span>Machine key</span>
              <input
                value={form.key}
                onChange={(e) => setForm((p) => ({ ...p, key: e.target.value }))}
                placeholder="auto from name"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs text-gray-600 space-y-1">
              <span>Port (must be free)</span>
              <input
                type="number"
                min="1"
                value={form.port}
                onChange={(e) => setForm((p) => ({ ...p, port: e.target.value }))}
                placeholder={String(nextPort)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs text-gray-600 space-y-1">
              <span>Fix style</span>
              <select
                value={form.recoveryPolicy}
                onChange={(e) => setForm((p) => ({ ...p, recoveryPolicy: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="restart">Restart</option>
                <option value="failover">Failover</option>
              </select>
            </label>
            <label className="text-xs text-gray-600 space-y-1 md:col-span-2">
              <span>Description</span>
              <input
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Short explanation"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </label>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[#00628b] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {saving ? 'Starting & saving…' : 'Add & start service'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      <TableToolbar
        search={table.search}
        onSearch={table.setSearch}
        searchPlaceholder="Search service name, key, host…"
        resultText={`Showing ${table.shown} of ${table.total}`}
        filters={[
          {
            key: 'status',
            label: 'Status',
            value: table.filters.status || 'all',
            onChange: (v) => table.setFilter('status', v),
            options: uniqueOptions(nodes, 'status').map((o) => ({
              value: o.value,
              label: plainStatus(o.value),
            })),
          },
          {
            key: 'role',
            label: 'Role',
            value: table.filters.role || 'all',
            onChange: (v) => table.setFilter('role', v),
            options: uniqueOptions(nodes, 'role'),
          },
          {
            key: 'recoveryPolicy',
            label: 'Fix style',
            value: table.filters.recoveryPolicy || 'all',
            onChange: (v) => table.setFilter('recoveryPolicy', v),
            options: uniqueOptions(nodes, 'recoveryPolicy'),
          },
        ]}
      />

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#00628b]" />
          </div>
        ) : table.rows.length === 0 ? (
          <p className="p-8 text-sm text-gray-500 text-center">No services match your filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs text-gray-500">
                <tr>
                  <SortTh label="Name" active={table.sortKey === 'name'} dir={table.sortDir} onClick={() => table.toggleSort('name')} />
                  <SortTh label="Endpoint" active={table.sortKey === 'port'} dir={table.sortDir} onClick={() => table.toggleSort('port')} />
                  <SortTh label="Policy" active={table.sortKey === 'recoveryPolicy'} dir={table.sortDir} onClick={() => table.toggleSort('recoveryPolicy')} />
                  <SortTh label="Status" active={table.sortKey === 'status'} dir={table.sortDir} onClick={() => table.toggleSort('status')} />
                  <SortTh label="Monitored" active={table.sortKey === 'isMonitored'} dir={table.sortDir} onClick={() => table.toggleSort('isMonitored')} />
                  <th className="px-4 py-3 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {table.rows.map((node) => (
                  <tr key={node.id} className="border-t border-gray-100">
                    <td className="px-4 py-3">
                      <p className="m-0 font-medium">{node.name}</p>
                      <p className="m-0 text-xs text-gray-500">
                        {node.key} · {node.role}
                        {node.standbyKey ? ` · standby: ${node.standbyKey}` : ''}
                      </p>
                      {node.description ? <p className="m-0 mt-1 text-xs text-gray-500">{node.description}</p> : null}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      http://{node.host}:{node.port}
                      {node.healthPath}
                    </td>
                    <td className="px-4 py-3 capitalize">{node.recoveryPolicy}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusTone(node.status)}`}>
                        {plainStatus(node.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">{node.isMonitored ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-3">
                      {canAdd ? (
                        <button
                          type="button"
                          onClick={() => recover(node.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium hover:bg-gray-50"
                        >
                          <RefreshCw size={14} />
                          Recover
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">View only</span>
                      )}
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
