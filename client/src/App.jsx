import { useEffect, useState } from 'react';
import { shortenUrl } from './api';

export default function App() {
  const [longUrl, setLongUrl] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [toast, setToast] = useState(null); // { msg, type }
  const [toastHiding, setToastHiding] = useState(false);

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
    // start hide animation shortly before removal
    setTimeout(() => setToastHiding(true), 1400);
    setTimeout(() => { setToast(null); setToastHiding(false); }, 1700);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    if (!longUrl) return;
    setLoading(true);
    try {
      const data = await shortenUrl(longUrl);
      setResult(data);
      // Optional info toast on success
      showToast('Short URL created', 'info');
    } catch (err) {
      const msg = err?.message || 'Failed to shorten URL';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!result?.shortUrl) return;
    await navigator.clipboard.writeText(result.shortUrl);
    showToast('Copied to clipboard', 'success');
  };

  return (
    <div className="container">
      <header>
        <h1>URL Shortener</h1>
        <p className="subtitle">Shorten long links. Share instantly. Track clicks.</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href="/admin">Admin</a>
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

      <form onSubmit={onSubmit} className="card">
        <label>Enter a long URL</label>
        <input
          type="url"
          placeholder="https://www.example.com/some/very/long/path"
          value={longUrl}
          onChange={(e) => setLongUrl(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Shortening…' : 'Shorten'}
        </button>
      </form>

      {error && <div className="error">{error}</div>}

      {result && (
        <div className="card">
          <div className="row">
            <span className="label">Short URL:</span>
            <a href={result.shortUrl} target="_blank" rel="noreferrer">
              {result.shortUrl}
            </a>
          </div>
          <div className="row">
            <span className="label">Original:</span>
            <a href={result.originalUrl} target="_blank" rel="noreferrer">
              {result.originalUrl}
            </a>
          </div>
          <button onClick={copy}>Copy</button>
        </div>
      )}
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
