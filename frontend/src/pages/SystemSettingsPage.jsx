import { useEffect, useState } from 'react';
import { Eraser, RotateCcw, Trash2 } from 'lucide-react';
import { networkService } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import { canManageOrg, isAdmin } from '../utils/roles';

const DEFAULTS = {
  checkIntervalMs: '5000',
  failureThreshold: '3',
  healthTimeoutMs: '3000',
  autoRecoveryEnabled: 'true',
  persistHealthChecks: 'true',
};

export default function SystemSettingsPage() {
  const { user } = useAuth();
  const { showError, showSuccess } = useNotification();
  const [form, setForm] = useState({ ...DEFAULTS });
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [factoryResetting, setFactoryResetting] = useState(false);

  useEffect(() => {
    networkService.settings().then((res) => {
      if (res.success && res.data) {
        setForm((prev) => ({ ...prev, ...res.data }));
      }
    });
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await networkService.updateSettings(form);
      if (res.success) {
        showSuccess('Settings saved');
        if (res.data) setForm((prev) => ({ ...prev, ...res.data }));
      } else showError(res.message || 'Save failed');
    } catch (err) {
      showError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const resetAndStartFresh = async () => {
    if (
      !window.confirm(
        'Reset for a new test?\n\nThis will:\n1) Clear all Problems, Fixes, health logs, and charts\n2) Heal all services back to healthy\n3) Restore default settings\n\nUsers and service list are kept.'
      )
    ) {
      return;
    }

    setResetting(true);
    try {
      const clearRes = await networkService.clearHistory();
      if (!clearRes.success) {
        showError(clearRes.message || 'Could not clear history');
        return;
      }

      const saveRes = await networkService.updateSettings(DEFAULTS);
      if (!saveRes.success) {
        showError(saveRes.message || 'History cleared, but settings restore failed');
        return;
      }

      setForm({ ...DEFAULTS, ...(saveRes.data || {}) });
      showSuccess('Ready for a new test. Open Home, then run a LIVE test. Charts start empty.');
    } catch (err) {
      showError(err.response?.data?.message || 'Reset failed');
    } finally {
      setResetting(false);
    }
  };

  const resetAllToStart = async () => {
    if (
      !window.confirm(
        'FULL RESET to first start?\n\nThis will:\n1) Keep ONLY the 3 default users (Admin / ICT / Viewer)\n2) Delete extra users\n3) Restore ONLY the 6 default lab services\n4) Delete extra services you added\n5) Clear all history, logs, and charts\n6) Restore default settings\n\nContinue?'
      )
    ) {
      return;
    }
    if (!window.confirm('Are you sure? Extra users and added services will be removed.')) {
      return;
    }

    setFactoryResetting(true);
    try {
      const res = await networkService.resetToStart();
      if (!res.success) {
        showError(res.message || 'Full reset failed');
        return;
      }
      setForm({ ...DEFAULTS });
      showSuccess(res.message || 'System reset to start. Only 3 users and 6 default services remain.');
    } catch (err) {
      showError(err.response?.data?.message || 'Full reset failed');
    } finally {
      setFactoryResetting(false);
    }
  };

  if (!canManageOrg(user?.role)) {
    return (
      <div className="max-w-xl bg-white rounded-xl border border-gray-200 p-5 text-sm text-gray-600">
        Only Admin or ICT Officer can change settings.
      </div>
    );
  }

  const busy = saving || resetting || factoryResetting;

  return (
    <div className="space-y-4 max-w-xl">
      <div>
        <h1 className="m-0 text-xl font-bold text-gray-900">Settings</h1>
        <p className="m-0 mt-1 text-sm text-gray-500">
          Change how sensitive monitoring is — or reset data for a clean demo / first start.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-amber-200 shadow-sm p-5 space-y-3">
        <h2 className="m-0 text-sm font-semibold text-gray-900 flex items-center gap-2">
          <Eraser size={16} className="text-amber-700" />
          Clear history only (keep users & services)
        </h2>
        <p className="m-0 text-sm text-gray-600">
          Clears Problems, Fixes, and Charts. Heals services. Restores default settings.
          Keeps all users and the current service list.
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={resetAndStartFresh}
          className="inline-flex items-center gap-2 rounded-lg bg-amber-600 text-white px-4 py-2.5 text-sm font-semibold hover:bg-amber-700 disabled:opacity-60"
        >
          <RotateCcw size={16} />
          {resetting ? 'Resetting…' : 'Reset & start fresh'}
        </button>
      </div>

      {isAdmin(user?.role) ? (
        <div className="bg-white rounded-xl border border-red-200 shadow-sm p-5 space-y-3">
          <h2 className="m-0 text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Trash2 size={16} className="text-red-700" />
            Full reset to first start (Admin only)
          </h2>
          <p className="m-0 text-sm text-gray-600">
            Resets the system like day one:
          </p>
          <ul className="m-0 pl-5 list-disc text-sm text-gray-600 space-y-1">
            <li>Keeps only <strong>admin@uok.ac.rw</strong>, <strong>ict@uok.ac.rw</strong>, <strong>viewer@uok.ac.rw</strong></li>
            <li>Restores only the 6 default lab services (ports 9401–9406)</li>
            <li>Deletes extra users and extra services you added</li>
            <li>Clears all history / charts and restores default settings</li>
          </ul>
          <button
            type="button"
            disabled={busy}
            onClick={resetAllToStart}
            className="inline-flex items-center gap-2 rounded-lg bg-red-700 text-white px-4 py-2.5 text-sm font-semibold hover:bg-red-800 disabled:opacity-60"
          >
            <Trash2 size={16} />
            {factoryResetting ? 'Resetting all data…' : 'Reset all data (keep 3 users)'}
          </button>
        </div>
      ) : null}

      <form onSubmit={save} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
        <h2 className="m-0 text-sm font-semibold text-gray-900">Monitoring options</h2>

        {[
          { key: 'checkIntervalMs', label: 'How often to check (ms)', hint: '5000 = every 5 seconds' },
          { key: 'failureThreshold', label: 'Failed checks before it is a real problem', hint: '3 = ignore short glitches' },
          { key: 'healthTimeoutMs', label: 'Max wait for a reply (ms)', hint: '3000 = 3 seconds' },
        ].map((field) => (
          <div key={field.key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
            <input
              type="number"
              value={form[field.key]}
              onChange={(e) => setForm((p) => ({ ...p, [field.key]: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm"
            />
            <p className="m-0 mt-1 text-xs text-gray-500">{field.hint}</p>
          </div>
        ))}

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={String(form.autoRecoveryEnabled) === 'true'}
            onChange={(e) => setForm((p) => ({ ...p, autoRecoveryEnabled: String(e.target.checked) }))}
          />
          Enable automatic recovery (turn OFF if you want to show a red failed state longer)
        </label>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={String(form.persistHealthChecks) === 'true'}
            onChange={(e) => setForm((p) => ({ ...p, persistHealthChecks: String(e.target.checked) }))}
          />
          Save every health check in PostgreSQL
        </label>

        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-[#00628b] text-white px-4 py-2.5 text-sm font-semibold hover:bg-[#004f70] disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save settings'}
        </button>
      </form>
    </div>
  );
}
