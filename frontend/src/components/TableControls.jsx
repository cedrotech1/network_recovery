import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from 'lucide-react';

/**
 * Client-side search + filter + sort for table pages.
 */
export function useTableControls(rows, { searchKeys = [], initialSort = null, initialDir = 'desc' } = {}) {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [sortKey, setSortKey] = useState(initialSort);
  const [sortDir, setSortDir] = useState(initialDir);

  const setFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const filteredSorted = useMemo(() => {
    let list = Array.isArray(rows) ? [...rows] : [];

    const q = search.trim().toLowerCase();
    if (q && searchKeys.length) {
      list = list.filter((row) =>
        searchKeys.some((key) => {
          const val = typeof key === 'function' ? key(row) : getByPath(row, key);
          return String(val ?? '').toLowerCase().includes(q);
        })
      );
    }

    Object.entries(filters).forEach(([key, value]) => {
      if (value === '' || value == null || value === 'all') return;
      list = list.filter((row) => {
        const val = typeof key === 'function' ? key(row) : getByPath(row, key);
        return String(val ?? '') === String(value);
      });
    });

    if (sortKey) {
      list.sort((a, b) => {
        const av = getByPath(a, sortKey);
        const bv = getByPath(b, sortKey);
        if (av == null && bv == null) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;

        const aDate = Date.parse(av);
        const bDate = Date.parse(bv);
        if (!Number.isNaN(aDate) && !Number.isNaN(bDate) && String(av).includes('-')) {
          return sortDir === 'asc' ? aDate - bDate : bDate - aDate;
        }

        if (typeof av === 'number' && typeof bv === 'number') {
          return sortDir === 'asc' ? av - bv : bv - av;
        }

        const as = String(av).toLowerCase();
        const bs = String(bv).toLowerCase();
        if (as < bs) return sortDir === 'asc' ? -1 : 1;
        if (as > bs) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return list;
  }, [rows, search, filters, sortKey, sortDir, searchKeys]);

  return {
    search,
    setSearch,
    filters,
    setFilter,
    sortKey,
    sortDir,
    setSortKey,
    setSortDir,
    toggleSort,
    rows: filteredSorted,
    total: rows?.length || 0,
    shown: filteredSorted.length,
  };
}

function getByPath(obj, path) {
  if (!path) return undefined;
  if (typeof path === 'function') return path(obj);
  return String(path)
    .split('.')
    .reduce((acc, part) => (acc == null ? undefined : acc[part]), obj);
}

export function TableToolbar({
  search,
  onSearch,
  searchPlaceholder = 'Search…',
  filters = [],
  resultText,
  children,
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-[180px]">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2 text-sm"
        />
      </div>
      {filters.map((f) => (
        <select
          key={f.key}
          value={f.value}
          onChange={(e) => f.onChange(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm min-w-[140px]"
          title={f.label}
        >
          <option value="all">{f.label}: All</option>
          {f.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ))}
      {children}
      {resultText ? <span className="text-xs text-gray-500 ml-auto">{resultText}</span> : null}
    </div>
  );
}

export function SortTh({ label, active, dir, onClick, className = '' }) {
  return (
    <th className={`px-4 py-3 ${className}`}>
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-1 uppercase tracking-wide hover:text-gray-800"
      >
        {label}
        {active ? (
          dir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
        ) : (
          <ArrowUpDown size={12} className="opacity-40" />
        )}
      </button>
    </th>
  );
}

export function uniqueOptions(rows, getter) {
  const set = new Set();
  (rows || []).forEach((row) => {
    const v = typeof getter === 'function' ? getter(row) : getByPath(row, getter);
    if (v != null && v !== '') set.add(String(v));
  });
  return Array.from(set)
    .sort((a, b) => a.localeCompare(b))
    .map((v) => ({ value: v, label: v }));
}
