import { lazy, Suspense, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Issue } from '../types/Issue';
import { useReactions } from '../hooks/useReactions';

const EmojiPickerPanel = lazy(() =>
  import('./EmojiPickerPanel').then((module) => ({ default: module.EmojiPickerPanel }))
);

interface IssueReactionsProps {
  issue: Issue;
  userId: number | null;
  setIssueList: React.Dispatch<React.SetStateAction<Issue[]>>;
}

export function IssueReactions({ issue, userId, setIssueList }: IssueReactionsProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [allReactionsOpen, setAllReactionsOpen] = useState(false);
  const [pickerTheme, setPickerTheme] = useState<'auto' | 'light' | 'dark'>('auto');
  const { toggleReaction } = useReactions(issue, setIssueList);
  const reactions = issue.reactions || [];
  const topReactions = reactions.slice(0, 3);

  // Sync theme with global
  useEffect(() => {
    const syncTheme = () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      if (currentTheme === 'dark') {
        setPickerTheme('dark');
      } else if (currentTheme === 'light') {
        setPickerTheme('light');
      } else {
        setPickerTheme('auto');
      }
    };

    syncTheme();

    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['data-theme'] 
    });

    return () => observer.disconnect();
  }, []);

  if (reactions.length === 0 && !userId) {
    return null;
  }

  return (
    <div 
      style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        background: 'var(--surface-strong)', 
        border: '1px solid var(--border)', 
        borderRadius: '16px',
        height: '30px',
        padding: reactions.length > 0 ? '0 2px 0 8px' : '0 8px',
        gap: '4px',
        boxSizing: 'border-box',
        verticalAlign: 'middle'
      }}
    >
      
      {/* Display Container for the Reactions, only shows the Top 3 */}
      {reactions.length > 0 && (
        <button 
          title="Alle Reaktionen anzeigen"
          onClick={(e) => { e.stopPropagation(); setAllReactionsOpen(true); }}
          style={{
            display: 'flex',
            gap: '4px',
            padding: '2px 4px',
            borderRadius: '12px',
            background: 'transparent',
            border: 'none',
            alignItems: 'center',
            cursor: 'pointer',
            lineHeight: '1',
            color: 'var(--text)'
          }}
        >
          {topReactions.map(r => (
            <span key={r.emoji} style={{ fontSize: '13px' }}>
              {r.emoji}
            </span>
          ))}
        </button>
      )}

      {/* linie zwischen reactions und "+" wenn reacions da sind*/}
      {reactions.length > 0 && userId && (
        <div style={{ width: '1px', height: '14px', background: 'var(--border)', margin: '0 2px' }} />
      )}

      {/* Button to React */}
      {userId && (
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <button
            title="Reaktion hinzufügen"
            onClick={(e) => { e.stopPropagation(); setPickerOpen(true); }}
            style={{
              padding: '2px 6px',
              borderRadius: '12px',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              lineHeight: '1',
              boxShadow: 'none',
              transition: 'all 0.15s ease'
            }}
          >
            {reactions.length === 0 ? (
              <>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="14" 
                  height="14" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  style={{ display: 'block', opacity: 0.8 }}
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                  <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="3" />
                  <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="3" />
                </svg>
                <span>+</span>
              </>
            ) : (
              <span>+</span>
            )}
          </button>

          {/* Emoji Picker */}
          {pickerOpen && createPortal(
            <div className="modal-overlay" onClick={(e) => { e.stopPropagation(); setPickerOpen(false); }}>
              <div className="modal-pane swipe-ignore" onClick={(e) => e.stopPropagation()} style={{ padding: '20px', maxWidth: '350px', width: '90%' }}>
                <div className="modal-header" style={{ marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-h)' }}>Reaktion wählen</h3>
                  <button className="modal-close-btn" onClick={() => setPickerOpen(false)}>X</button>
                </div>
                <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                  <Suspense fallback={<div>Emoji-Auswahl wird geladen…</div>}>
                    <EmojiPickerPanel
                      theme={pickerTheme}
                      onEmojiClick={(emoji) => {
                        toggleReaction(emoji);
                        setPickerOpen(false);
                      }}
                    />
                  </Suspense>
                </div>
              </div>
            </div>,
            document.body
          )}
        </div>
      )}

      {/* Shows all Reactions */}
      {allReactionsOpen && createPortal(
        <div className="modal-overlay" onClick={(e) => { e.stopPropagation(); setAllReactionsOpen(false); }}>
          <div className="modal-pane swipe-ignore" onClick={(e) => e.stopPropagation()} style={{ padding: '20px', maxWidth: '350px', width: '90%' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-h)' }}>Alle Reaktionen</h3>
              <button className="modal-close-btn" onClick={() => setAllReactionsOpen(false)}>X</button>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '16px' }}>
              {reactions.map(r => {
                const isActive = issue.user_reaction === r.emoji;
                return (
                  <button 
                    key={r.emoji} 
                    disabled={!userId}
                    onClick={(e) => { e.stopPropagation(); toggleReaction(r.emoji); }}
                    title={isActive ? "Reaktion entfernen" : "Mitreagieren"}
                    style={{ 
                      fontSize: '16px', 
                      padding: '6px 12px', 
                      background: isActive ? 'var(--accent-transparent)' : 'var(--surface-strong)', 
                      borderRadius: '20px', 
                      border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                      fontWeight: 'bold',
                      display: 'flex',
                      gap: '6px',
                      alignItems: 'center',
                      cursor: userId ? 'pointer' : 'default'
                    }}>
                    <span>{r.emoji}</span>
                    <span style={{ color: isActive ? 'var(--text)' : 'var(--text-muted)' }}>{r.count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
