import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from 'recharts';

const COLORS = ['#00628b', '#1e3c72', '#0f766e', '#b45309', '#b91c1c', '#6366f1', '#64748b'];

/** Dynamic tick: seconds/minutes for short windows, hours/days for long ones */
export function formatChartTick(value, bucketMs = 30 * 1000) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);

  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  const day = `${d.getMonth() + 1}/${d.getDate()}`;

  if (bucketMs <= 60 * 1000) return `${hh}:${mm}:${ss}`; // 30s / 1m
  if (bucketMs <= 15 * 60 * 1000) return `${hh}:${mm}`; // 5m / 15m
  if (bucketMs <= 60 * 60 * 1000) return `${day} ${hh}:00`; // hourly
  return day; // daily
}

export function formatChartTooltip(value, bucketMs = 30 * 1000) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  if (bucketMs <= 60 * 1000) return d.toLocaleString(undefined, { hour12: false });
  return d.toLocaleString();
}

export const RANGE_OPTIONS = [
  { key: '15m', label: 'Last 15 minutes' },
  { key: '1h', label: 'Last 1 hour' },
  { key: '6h', label: 'Last 6 hours' },
  { key: '24h', label: 'Last 24 hours' },
  { key: '7d', label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' },
];

export function ChartCard({ title, hint, children, className = '' }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm p-4 ${className}`}>
      <div className="mb-3">
        <h3 className="m-0 text-sm font-semibold text-gray-900">{title}</h3>
        {hint ? <p className="m-0 mt-1 text-xs text-gray-500">{hint}</p> : null}
      </div>
      <div className="h-64 w-full">{children}</div>
    </div>
  );
}

export function FailuresOverTimeChart({ data, bucketMs = 30 * 1000 }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="time"
          tickFormatter={(v) => formatChartTick(v, bucketMs)}
          tick={{ fontSize: 10 }}
          minTickGap={24}
        />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip labelFormatter={(v) => formatChartTooltip(v, bucketMs)} />
        <Legend />
        <Area type="monotone" dataKey="failures" name="Problems found" stroke="#b91c1c" fill="#fecaca" />
        <Area type="monotone" dataKey="recoveries" name="Fixes done" stroke="#00628b" fill="#bfdbfe" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function DetectionRecoveryTrendChart({ data, bucketMs = 30 * 1000 }) {
  const xKey = data?.[0]?.time ? 'time' : 'day';
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey={xKey}
          tickFormatter={(v) => (xKey === 'time' ? formatChartTick(v, bucketMs) : v)}
          tick={{ fontSize: 10 }}
          minTickGap={24}
        />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip labelFormatter={(v) => (xKey === 'time' ? formatChartTooltip(v, bucketMs) : v)} />
        <Legend />
        <Line type="monotone" dataKey="avgDetectionMs" name="Avg time to notice (ms)" stroke="#b45309" strokeWidth={2} />
        <Line type="monotone" dataKey="avgRecoveryMs" name="Avg time to fix (ms)" stroke="#0f766e" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function StatusPieChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2}>
          {data.map((entry, index) => (
            <Cell key={entry.key || entry.name} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function ScenarioBarChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="scenarioCode" tick={{ fontSize: 11 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip
          formatter={(value, name) => [value, name]}
          labelFormatter={(_, payload) => payload?.[0]?.payload?.plainLabel || payload?.[0]?.payload?.label}
        />
        <Legend />
        <Bar dataKey="failures" name="Times it happened" fill="#00628b" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function NodeUptimeChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ left: 24 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 10 }} />
        <Tooltip formatter={(v) => [`${v}%`, 'Working time']} />
        <Bar dataKey="uptimePercent" name="Working time %" fill="#0f766e" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function LatencyTrendChart({ data, bucketMs = 30 * 1000 }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="time"
          tickFormatter={(v) => formatChartTick(v, bucketMs)}
          tick={{ fontSize: 10 }}
          minTickGap={24}
        />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip labelFormatter={(v) => formatChartTooltip(v, bucketMs)} />
        <Legend />
        <Line type="monotone" dataKey="avgLatencyMs" name="Average response time (ms)" stroke="#1e3c72" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function ActionPieChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" outerRadius={85}>
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function RangePicker({ value, onChange, className = '' }) {
  return (
    <label className={`text-sm text-gray-700 ${className}`}>
      Time window{' '}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="ml-2 rounded-lg border border-gray-200 px-3 py-2 text-sm"
      >
        {RANGE_OPTIONS.map((o) => (
          <option key={o.key} value={o.key}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
