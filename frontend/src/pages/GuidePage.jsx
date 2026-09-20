import { Link } from 'react-router-dom';
import { appPath } from '../utils/appPaths';

function Section({ title, children }) {
  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
      <h2 className="m-0 text-base font-bold text-[#1e3c72]">{title}</h2>
      <div className="text-sm text-gray-700 leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

const SCENARIOS = [
  {
    code: 'S1',
    name: 'Service stopped answering',
    meaning: 'The service does not reply at all (like a frozen computer). The system should notice and restart it.',
  },
  {
    code: 'S2',
    name: 'Service returned an error',
    meaning: 'The service answers, but with an error (HTTP 500). Clearest demo of automatic restart.',
  },
  {
    code: 'S3',
    name: 'Service was too slow',
    meaning: 'The health check takes too long (timeout). Treated as a failure, then restarted.',
  },
  {
    code: 'S4',
    name: 'Main service fails → use backup',
    meaning: 'The primary Campus App fails. Traffic/role switches to the standby backup (failover).',
  },
  {
    code: 'S5',
    name: 'Service crashed',
    meaning: 'A hard crash of the service process. The system should bring it back with a restart.',
  },
  {
    code: 'S6',
    name: 'Needed helper service failed',
    meaning: 'A required dependency is missing (dependency / 503 style failure). System restarts the service.',
  },
  {
    code: 'S7',
    name: 'Short glitch (should NOT big-fix)',
    meaning: 'A brief problem that clears before the failure threshold. Should not force a full recovery.',
  },
  {
    code: 'S8',
    name: 'Several services fail together',
    meaning: 'Two services break at once. The system fixes them one after another (sequential recovery).',
  },
];

export default function GuidePage() {
  return (
    <div className="space-y-4 max-w-4xl">
      <div>
        <h1 className="m-0 text-xl font-bold text-gray-900">Simple guide — how this system works</h1>
        <p className="m-0 mt-1 text-sm text-gray-500">
          Automatic Failure Detection and Recovery System — written in everyday language for demos.
        </p>
      </div>

      <Section title="1. What is this project in one sentence?">
        <p className="m-0">
          The <strong>Automatic Failure Detection and Recovery System</strong> watches university services,
          notices when one stops working, and <strong>tries to fix it automatically</strong> — then shows you
          what happened with numbers and charts.
        </p>
        <p className="m-0">
          Think of it like a night security guard for the university’s digital services: it checks doors every few
          seconds, and if a door is stuck, it opens a backup door or restarts the lock.
        </p>
      </Section>

      <Section title="2. What do we monitor? (important)">
        <p className="m-0">
          We monitor <strong>internal university lab services</strong> (a small private network simulation),
          <strong> not the whole internet</strong>, not MTN/Airtel, and not someone’s home Wi‑Fi.
        </p>
        <ul className="m-0 pl-5 list-disc space-y-1">
          <li><strong>University Website</strong> — the public campus website</li>
          <li><strong>Campus App</strong> — internal staff application (+ a backup copy)</li>
          <li><strong>Internal API Service</strong> — the “messenger” between systems</li>
          <li><strong>Student Portal</strong> — where students check results / info</li>
        </ul>
        <p className="m-0">
          By default these run on this computer as small test services (ports 9401–9406). That is our “LAN laboratory”.
        </p>
        <p className="m-0">
          Admin / ICT Officer can also open <Link className="text-[#00628b] font-medium" to={appPath('nodes')}>Our services</Link> →
          <strong> Add service</strong> and register another reachable host + port (with a <code>/health</code> endpoint).
          The system will then monitor it the same way. Adding on the web registers monitoring only — the real service
          process must already be running.
        </p>
      </Section>

      <Section title="3. How does it work? (4 easy steps)">
        <ol className="m-0 pl-5 list-decimal space-y-2">
          <li><strong>Check</strong> — every few seconds ask each service: “Are you OK?”</li>
          <li><strong>Confirm</strong> — if it fails many times in a row, treat it as a real problem (not a short glitch)</li>
          <li><strong>Fix</strong> — restart the service, or switch to a backup service</li>
          <li><strong>Record</strong> — save history in PostgreSQL and show charts for supervisors</li>
        </ol>
      </Section>

      <Section title="4. Who can use the system? (roles)">
        <ul className="m-0 pl-5 list-disc space-y-2">
          <li>
            <strong>Administrator</strong> (`admin@uok.ac.rw` / `Admin@123`) — full control: users, settings, tests, everything
          </li>
          <li>
            <strong>ICT Officer</strong> (`ict@uok.ac.rw` / `Ict@12345`) — can run failure tests, recover services, change settings; cannot manage users
          </li>
          <li>
            <strong>Viewer</strong> (`viewer@uok.ac.rw` / `View@12345`) — can only look at dashboard, history, and charts (safe for demos to non-technical people)
          </li>
        </ul>
      </Section>

      <Section title="5. How do I test intentionally? (demo script)">
        <ol className="m-0 pl-5 list-decimal space-y-2">
          <li>Sign in as <strong>Admin</strong> or <strong>ICT Officer</strong>.</li>
          <li>Open <Link className="text-[#00628b] underline" to={appPath('dashboard')}>Home dashboard</Link> — show all services green/working.</li>
          <li>Open <Link className="text-[#00628b] underline" to={appPath('experiments')}>Test a problem</Link> (URL: <code>/experiments</code>).</li>
          <li>Choose a scenario below (start with <strong>S2</strong> on Student Portal) → click start.</li>
          <li>Wait about 15–20 seconds (3 failed checks). Watch the dashboard turn red, then recover.</li>
          <li>Open <Link className="text-[#00628b] underline" to={appPath('failures')}>Problems found</Link> and <Link className="text-[#00628b] underline" to={appPath('recoveries')}>Fixes done</Link>.</li>
          <li>Open <Link className="text-[#00628b] underline" to={appPath('metrics')}>Charts & statistics</Link> and explain the graphs.</li>
        </ol>
      </Section>

      <Section title="6. Test scenarios (S1–S8) — what each means">
        <p className="m-0">
          These are the intentional problems you can start from <code>/experiments</code>. Each code is a different kind of failure.
        </p>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-3 py-2.5 font-medium">Code</th>
                <th className="px-3 py-2.5 font-medium">Scenario</th>
                <th className="px-3 py-2.5 font-medium">What it means</th>
              </tr>
            </thead>
            <tbody>
              {SCENARIOS.map((s) => (
                <tr key={s.code} className="border-t border-gray-100">
                  <td className="px-3 py-2.5 font-semibold text-[#00628b] whitespace-nowrap">{s.code}</td>
                  <td className="px-3 py-2.5 font-medium text-gray-900">{s.name}</td>
                  <td className="px-3 py-2.5 text-gray-600">{s.meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="7. Seed vs automatic recording">
        <p className="m-0">
          <strong>Seed/setup</strong> only creates users and the service list (like installing cameras).
          It does <strong>not</strong> invent failures or charts.
        </p>
        <p className="m-0">
          <strong>Automatic recording</strong> saves every health check, confirmed failure, and auto-fix
          to PostgreSQL with a real timestamp while the system runs.
        </p>
      </Section>
    </div>
  );
}
