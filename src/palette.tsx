import { StrictMode, useState, useEffect, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/globals.css';
import { initSentry, Sentry } from '@/lib/sentry';

initSentry('palette');

interface SnippetItem {
  id: string;
  title: string;
  content: string;
  category: string;
}

function GlobalPalette() {
  const [query, setQuery] = useState('');
  const [snippets, setSnippets] = useState<SnippetItem[]>([]);
  const [selected, setSelected] = useState(0);
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chrome.storage.local.get('snippets', (res) => {
      setSnippets((res.snippets as SnippetItem[]) ?? []);
    });

    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'WAYPOINT_OPEN') {
        setVisible(true);
        setQuery('');
        setSelected(0);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.data?.type === 'WAYPOINT_CLOSE') {
        setVisible(false);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const filtered = snippets.filter(
    (s) =>
      !query ||
      s.title.toLowerCase().includes(query.toLowerCase()) ||
      s.content.toLowerCase().includes(query.toLowerCase())
  );

  const close = () => window.parent.postMessage({ type: 'WAYPOINT_PALETTE_CLOSE' }, '*');

  const copySnippet = useCallback((snippet: SnippetItem) => {
    navigator.clipboard
      .writeText(snippet.content)
      .then(() => {
        setCopied(snippet.id);
        setTimeout(() => {
          setCopied(null);
          close();
        }, 1000);
      })
      .catch((err: Error) => {
        Sentry.captureException(err, { tags: { context: 'palette', action: 'clipboard_write' } });
      });
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!visible) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowDown') setSelected((s) => Math.min(s + 1, filtered.length - 1));
      if (e.key === 'ArrowUp') setSelected((s) => Math.max(s - 1, 0));
      if (e.key === 'Enter' && filtered[selected]) copySnippet(filtered[selected]);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [visible, filtered, selected, copySnippet]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '15vh',
        zIndex: 2147483647,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        style={{
          width: '560px',
          maxHeight: '400px',
          background: 'hsl(214 15% 15%)',
          border: '1px solid hsl(214 12% 21%)',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ padding: '12px 16px', borderBottom: '1px solid hsl(214 12% 18%)' }}>
          <input
            id="palette-search"
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(0);
            }}
            placeholder="Search snippets…"
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'hsl(205 35% 90%)',
              fontSize: '15px',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
          />
        </div>

        <div style={{ overflowY: 'auto', maxHeight: '340px' }}>
          {filtered.length === 0 && (
            <div
              style={{
                padding: '24px',
                textAlign: 'center',
                color: 'hsl(213 8% 46%)',
                fontSize: '13px',
              }}
            >
              No snippets found
            </div>
          )}
          {filtered.map((s, i) => (
            <div
              key={s.id}
              data-snippet-id={s.id}
              onClick={() => copySnippet(s)}
              style={{
                padding: '10px 16px',
                cursor: 'pointer',
                background: i === selected ? 'hsl(214 12% 21%)' : 'transparent',
                borderBottom: '1px solid hsl(214 12% 18% / 0.5)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
              onMouseEnter={() => setSelected(i)}
            >
              <div>
                <div
                  style={{
                    color: 'hsl(205 35% 90%)',
                    fontSize: '13px',
                    fontWeight: 500,
                    fontFamily: 'Inter, system-ui, sans-serif',
                  }}
                >
                  {s.title}
                </div>
                <div
                  style={{
                    color: 'hsl(213 10% 59%)',
                    fontSize: '11px',
                    fontFamily: 'JetBrains Mono, monospace',
                    marginTop: '2px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '420px',
                  }}
                >
                  {s.content.slice(0, 80)}
                </div>
              </div>
              <div
                style={{
                  color: copied === s.id ? '#22c55e' : 'hsl(213 8% 46%)',
                  fontSize: '11px',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  flexShrink: 0,
                  marginLeft: '12px',
                }}
              >
                {copied === s.id ? '✓ Copied' : '↵'}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            padding: '8px 16px',
            borderTop: '1px solid hsl(214 12% 18%)',
            display: 'flex',
            gap: '16px',
            color: 'hsl(213 8% 46%)',
            fontSize: '11px',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          <span>↑↓ navigate</span>
          <span>↵ copy</span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  );
}

const root = document.getElementById('palette-root')!;
createRoot(root).render(
  <StrictMode>
    <Sentry.ErrorBoundary
      fallback={
        <div style={{ color: 'hsl(213 8% 46%)', fontSize: 13, padding: 24, textAlign: 'center' }}>
          Palette unavailable
        </div>
      }
    >
      <GlobalPalette />
    </Sentry.ErrorBoundary>
  </StrictMode>
);
