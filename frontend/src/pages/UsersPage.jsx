import { useEffect, useMemo, useState } from 'react';
import { usersService } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import { roleLabel } from '../utils/roles';
import { SortTh, TableToolbar, uniqueOptions, useTableControls } from '../components/TableControls';

export default function UsersPage() {
  const { showError, showSuccess } = useNotification();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ names: '', email: '', password: 'Admin@123', role: 'admin' });
  const [busy, setBusy] = useState(false);

  const enriched = useMemo(
    () =>
      users.map((u) => ({
        ...u,
        roleLabel: roleLabel(u.role),
        activeLabel: u.active ? 'Active' : 'Inactive',
      })),
    [users]
  );

  const table = useTableControls(enriched, {
    searchKeys: ['names', 'email', 'role', 'phone'],
    initialSort: 'names',
    initialDir: 'asc',
  });

  const load = async () => {
    try {
      const res = await usersService.getAll();
      if (res.success) setUsers(res.data || []);
    } catch (e) {
      showError(e.response?.data?.message || 'Failed to load users');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const create = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await usersService.create(form);
      if (res.success) {
        showSuccess('User created');
        setForm({ names: '', email: '', password: 'Admin@123', role: 'admin' });
        load();
      } else showError(res.message || 'Create failed');
    } catch (err) {
      showError(err.response?.data?.message || 'Create failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="m-0 text-xl font-bold text-gray-900">People & roles</h1>
        <p className="m-0 mt-1 text-sm text-gray-500">
          Users can be created here. Default Admin/ICT/Viewer accounts also come from first-time setup.
        </p>
      </div>

      <form onSubmit={create} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          required
          placeholder="Full name"
          value={form.names}
          onChange={(e) => setForm((p) => ({ ...p, names: e.target.value }))}
          className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm"
        />
        <input
          required
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm"
        />
        <input
          required
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
          className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm"
        />
        <select
          value={form.role}
          onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
          className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm"
        >
          <option value="admin">Administrator</option>
          <option value="ict_officer">ICT Officer</option>
          <option value="viewer">Viewer</option>
        </select>
        <button
          type="submit"
          disabled={busy}
          className="md:col-span-2 rounded-lg bg-[#00628b] text-white px-4 py-2.5 text-sm font-semibold hover:bg-[#004f70] disabled:opacity-60"
        >
          {busy ? 'Creating…' : 'Add user'}
        </button>
      </form>

      <TableToolbar
        search={table.search}
        onSearch={table.setSearch}
        searchPlaceholder="Search name, email, role…"
        resultText={`Showing ${table.shown} of ${table.total}`}
        filters={[
          {
            key: 'role',
            label: 'Role',
            value: table.filters.role || 'all',
            onChange: (v) => table.setFilter('role', v),
            options: uniqueOptions(enriched, 'role').map((o) => ({
              value: o.value,
              label: roleLabel(o.value),
            })),
          },
          {
            key: 'activeLabel',
            label: 'Status',
            value: table.filters.activeLabel || 'all',
            onChange: (v) => table.setFilter('activeLabel', v),
            options: [
              { value: 'Active', label: 'Active' },
              { value: 'Inactive', label: 'Inactive' },
            ],
          },
        ]}
      />

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-500">
            <tr>
              <SortTh label="Name" active={table.sortKey === 'names'} dir={table.sortDir} onClick={() => table.toggleSort('names')} />
              <SortTh label="Email" active={table.sortKey === 'email'} dir={table.sortDir} onClick={() => table.toggleSort('email')} />
              <SortTh label="Role" active={table.sortKey === 'role'} dir={table.sortDir} onClick={() => table.toggleSort('role')} />
              <SortTh label="Active" active={table.sortKey === 'activeLabel'} dir={table.sortDir} onClick={() => table.toggleSort('activeLabel')} />
            </tr>
          </thead>
          <tbody>
            {table.rows.map((u) => (
              <tr key={u.id} className="border-t border-gray-100">
                <td className="px-4 py-3">{u.names}</td>
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3">{u.roleLabel}</td>
                <td className="px-4 py-3">{u.activeLabel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
