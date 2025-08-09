import { useEffect, useState } from 'react';
const API_BASE = import.meta.env.VITE_API_BASE || '';

export default function Admin() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [toast, setToast] = useState(null); // { msg, type }
  const [toastHiding, setToastHiding] = useState(false);
  const [sortBy, setSortBy] = useState('created'); // 'created' | 'clicks'
  const [sortDir, setSortDir] = useState('desc'); // 'asc' | 'desc'

  const setThemeMeta = (t) => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'dark' ? '#111827' : '#7c3aed');
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    setThemeMeta(theme);
  }, [theme]);
  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type });
    setToastHiding(false);
    setTimeout(() => setToastHiding(true), 1400);
    setTimeout(() => { setToast(null); setToastHiding(false); }, 1700);
  };

  const copyText = async (text, label = 'Link') => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`${label} copied`, 'success');
    } catch {
      showToast(`Failed to copy ${label.toLowerCase()}`, 'error');
    }
  };

  const hostnameOf = (url) => {
    try { return new URL(url).hostname; } catch { return ''; }
  };

  const formatDate = (value) => {
    if (!value) return '-';
    const t = Date.parse(value);
    if (Number.isNaN(t)) return '-';
    try { return new Date(t).toLocaleString(); } catch { return '-'; }
  };

  // Optimistically bump clicks in UI when a short link is clicked
  const bumpClicks = (shortcode) => {
    setItems((prev) => prev.map((it) =>
      it.shortcode === shortcode ? { ...it, clicks: (it.clicks || 0) + 1 } : it
    ));
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/admin/urls`);
        if (!res.ok) throw new Error('Failed to fetch URLs');
        const data = await res.json();
        setItems(data);
        showToast(`Loaded ${data.length} URLs`, 'info');
      } catch (err) {
        const msg = err?.message || 'Error fetching URLs';
        setError(msg);
        showToast(msg, 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="container">Loading…</div>;
  if (error) return <div className="container error">{error}</div>;

  const filtered = query
    ? items.filter((i) =>
        (i.shortUrl || '').toLowerCase().includes(query.toLowerCase()) ||
        (i.originalUrl || '').toLowerCase().includes(query.toLowerCase())
      )
    : items;

  const sorted = [...filtered].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    if (sortBy === 'clicks') {
      return ((a.clicks || 0) - (b.clicks || 0)) * dir;
    }
    // created
    const at = new Date(a.createdAt).getTime();
    const bt = new Date(b.createdAt).getTime();
    return (at - bt) * dir;
  });

  const toggleSort = (field) => {
    if (sortBy !== field) {
      setSortBy(field);
      setSortDir('desc');
    } else {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    }
  };

  return (
    <div className="container">
      <header>
        <h1>Admin</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href="/">Home</a>
          <label className="switch" title="Toggle theme">
            <input
              type="checkbox"
              checked={theme === 'dark'}
              onChange={toggleTheme}
              aria-label="Toggle dark mode"
            />
            <span className="track">
              <span className="thumb" />
            </span>
            <span className="label">{theme === 'dark' ? 'Dark' : 'Light'}</span>
          </label>
        </div>
      </header>

      <div className="card table-scroll admin-safe">
        <div className="admin-toolbar">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by short or original URL…"
            aria-label="Search URLs"
          />
          <span className="admin-count">{filtered.length} result{filtered.length === 1 ? '' : 's'}</span>
        </div>
        <table className="admin-table">
          <colgroup>
            <col className="col-short" />
            <col className="col-original" />
            <col className="col-clicks" />
            <col className="col-created" />
          </colgroup>
          <thead>
            <tr>
              <th>Short</th>
              <th>Original</th>
              <th
                role="button"
                tabIndex={0}
                onClick={() => toggleSort('clicks')}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSort('clicks'); } }}
                aria-sort={sortBy === 'clicks' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                title="Sort by clicks"
                className={`th-sort ${sortBy === 'clicks' ? 'is-active' : ''}`}
              >
                Clicks {sortBy === 'clicks' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th
                role="button"
                tabIndex={0}
                onClick={() => toggleSort('created')}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSort('created'); } }}
                aria-sort={sortBy === 'created' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                title="Sort by created date"
                className={`th-sort ${sortBy === 'created' ? 'is-active' : ''}`}
              >
                Created {sortBy === 'created' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((i) => (
              <tr key={i._id || i.id || i.shortUrl}>
                <td>
                  <div className="cell-inline">
                    <a
                      href={i.shortUrl}
                      target="_blank"
                      rel="noreferrer"
                      title={i.shortUrl}
                      onClick={() => bumpClicks(i.shortcode)}
                      onAuxClick={() => bumpClicks(i.shortcode)}
                    >
                      {i.shortUrl}
                    </a>
                    <button
                      className="icon-btn align-end"
                      onClick={() => copyText(i.shortUrl, 'Short URL')}
                      title="Copy short URL"
                      data-tooltip="Copy"
                      aria-label={`Copy ${i.shortUrl}`}
                    >📋</button>
                  </div>
                </td>
                <td className="truncate">
                  <div className="cell-inline">
                    <img
                      className="favicon"
                      src={`https://www.google.com/s2/favicons?domain=${hostnameOf(i.originalUrl)}&sz=32`}
                      alt=""
                      width="16"
                      height="16"
                      loading="lazy"
                    />
                    <a href={i.originalUrl} target="_blank" rel="noreferrer" title={i.originalUrl}>
                      {i.originalUrl}
                    </a>
                    <button
                      className="icon-btn align-end"
                      onClick={() => copyText(i.originalUrl, 'Original URL')}
                      title="Copy original URL"
                      data-tooltip="Copy"
                      aria-label={`Copy ${i.originalUrl}`}
                    >📋</button>
                  </div>
                </td>
                <td className="cell-num">{i.clicks}</td>
                <td className="cell-date">{formatDate(i.createdAt || i.created_at || i.created)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {toast && (
        <div className={`toast toast--top toast--center toast--${toast.type}${toastHiding ? ' hide' : ''}`} role="status" aria-live="polite">
          <span style={{ marginRight: 8 }}>
            {toast.type === 'success' ? '✅' : toast.type === 'error' ? '⚠️' : 'ℹ️'}
          </span>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
