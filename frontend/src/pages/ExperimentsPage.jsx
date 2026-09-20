import { useEffect, useState } from 'react';
import { FlaskConical, Eraser } from 'lucide-react';
import { networkService, nodesService } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import { canInject, canManageOrg } from '../utils/roles';
import { Navigate } from 'react-router-dom';
import { appPath } from '../utils/appPaths';

const SCENARIO_LIST = [
  { code: 'S1', label: 'Service stopped answering', plain: 'Like a frozen computer — no reply at all.', mode: 'unresponsive' },
  { code: 'S2', label: 'Service returned an error', plain: 'Best live demo. Service answers with error.', mode: 'http500' },
  { code: 'S3', label: 'Service was too slow', plain: 'Takes too long → treated as failure.', mode: 'timeout' },
  { code: 'S4', label: 'Main service fails → use backup', plain: 'Use Campus App (main). Proves failover.', mode: 'crashed' },
  { code: 'S5', label: 'Service crashed', plain: 'Hard crash; system should restart it.', mode: 'crashed' },
  { code: 'S6', label: 'Needed helper service failed', plain: 'Dependency missing.', mode: 'dependency' },
  { code: 'S7', label: 'Short glitch (should NOT big-fix)', plain: 'Clears before threshold — no false recovery.', mode: 'http500' },
  { code: 'S8', label: 'Several services fail together', plain: 'Two services break; sequential recovery.', mode: 'http500', multi: true },
];

export default function ExperimentsPage() {
  const { user } = useAuth();
  const { showError, showSuccess } = useNotification();
  const [nodes, setNodes] = useState([]);
  const [nodeId, setNodeId] = useState('');
  const [scenarioCode, setScenarioCode] = useState('S2');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    nodesService.getAll().then((res) => {
      if (res.success) {
        const list = (res.data || []).filter((n) => n.isMonitored);
        setNodes(list);
        const portal = list.find((n) => n.key === 'portal-service');
        setNodeId(portal?.id || list[0]?.id || '');
      }
    });
  }, []);

  if (!canInject(user?.role)) {
    return <Navigate to={appPath('guide')} replace />;
  }

  const scenario = SCENARIO_LIST.find((s) => s.code === scenarioCode);

  const run = async () => {
    setBusy(true);
    try {
      if (scenario?.multi) {
        const ids = nodes.slice(0, 2).map((n) => n.id);
        const res = await networkService.injectMulti({ nodeIds: ids, scenarioCode: 'S8', mode: 'http500' });
        if (res.success) {
          showSuccess('LIVE multi-failure started. Keep Home open ~20–30 seconds.');
        } else showError(res.message || 'Test failed to start');
      } else {
        const res = await networkService.inject({ nodeId, scenarioCode, mode: scenario?.mode });
        if (res.success) {
          showSuccess('LIVE problem started NOW. Watch Home — status should go bad, then recover.');
        } else showError(res.message || 'Test failed to start');
      }
    } catch (e) {
      showError(e.response?.data?.message || 'Test failed to start');
    } finally {
      setBusy(false);
    }
  };

  const clear = async () => {
    if (!window.confirm('Clear ALL past failures, recoveries, and chart history? Use this before a presentation so charts show only LIVE proof.')) {
      return;
    }
    setBusy(true);
    try {
      const res = await networkService.clearHistory();
      if (res.success) showSuccess(res.message || 'History cleared — charts are empty until next live test.');
      else showError(res.message || 'Could not clear history');
    } catch (e) {
      showError(e.response?.data?.message || 'Could not clear history');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h1 className="m-0 text-xl font-bold text-gray-900">Live proof tests (not dummy data)</h1>
        <p className="m-0 mt-1 text-sm text-gray-500">
          When you click Start, a real service on this PC is broken on purpose. The monitor must notice and repair it.
          New rows appear in Problems / Fixes with today’s timestamp — that is your proof.
        </p>
      </div>

      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 space-y-1">
        <p className="m-0 font-semibold">Presentation proof order</p>
        <ol className="m-0 pl-5 list-decimal">
          <li>Admin: Clear history (charts become empty)</li>
          <li>Show empty Problems / Fixes / Charts</li>
          <li>Start S2 on Student Portal</li>
          <li>Watch Home change live (~15–25 seconds)</li>
          <li>Show new failure + recovery rows with current time</li>
          <li>Show charts filling from that live event</li>
        </ol>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">What kind of problem?</label>
          <select
            value={scenarioCode}
            onChange={(e) => setScenarioCode(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm"
          >
            {SCENARIO_LIST.map((s) => (
              <option key={s.code} value={s.code}>
                {s.code} — {s.label}
              </option>
            ))}
          </select>
          <p className="m-0 mt-2 text-xs text-gray-500">{scenario?.plain}</p>
        </div>

        {scenarioCode !== 'S8' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Which service?</label>
            <select
              value={nodeId}
              onChange={(e) => setNodeId(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm"
            >
              {nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name} — fix style: {n.recoveryPolicy === 'failover' ? 'switch to backup' : 'restart'}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy || (!nodeId && scenarioCode !== 'S8')}
            onClick={run}
            className="inline-flex items-center gap-2 rounded-lg bg-[#00628b] text-white px-4 py-2.5 text-sm font-semibold hover:bg-[#004f70] disabled:opacity-60"
          >
            <FlaskConical size={16} />
            {busy ? 'Working…' : 'Start LIVE test'}
          </button>

          {canManageOrg(user?.role) && (
            <button
              type="button"
              disabled={busy}
              onClick={clear}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white text-gray-800 px-4 py-2.5 text-sm font-semibold hover:bg-gray-50 disabled:opacity-60"
            >
              <Eraser size={16} />
              Clear history (before demo)
            </button>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 space-y-2">
        <p className="m-0 font-semibold text-gray-900">Harder proof (optional): kill a service from terminal</p>
        <p className="m-0">
          In PowerShell, break Student Portal health yourself, then watch the dashboard react:
        </p>
        <pre className="m-0 overflow-x-auto rounded-lg bg-gray-900 text-gray-100 text-xs p-3">{`Invoke-RestMethod -Method Post http://127.0.0.1:9406/admin/inject -ContentType 'application/json' -Body '{"mode":"http500"}'`}</pre>
        <p className="m-0">
          Or open that URL with Postman. After ~3 failed checks the system records a failure and calls recover automatically.
          Heal manually if needed: <code>POST http://127.0.0.1:9406/admin/recover</code>
        </p>
      </div>
    </div>
  );
}
