import { useState } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { Issue } from '../types/Issue';
import { useReactions } from '../hooks/useReactions';

interface IssueReactionsProps {
  issue: Issue;
  userId: number | null;
  setIssueList: React.Dispatch<React.SetStateAction<Issue[]>>;
}

export function IssueReactions({ issue, userId, setIssueList }: IssueReactionsProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [allReactionsOpen, setAllReactionsOpen] = useState(false);
  const { toggleReaction } = useReactions(issue, setIssueList);
  
  const reactions = issue.reactions || [];
  const topReactions = reactions.slice(0, 3);

  return (
    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'nowrap' }}>
      
      {/* Display Container for the Reactions, only shows the Top 3 */}
      {reactions.length > 0 && (
        <button 
          title="Alle Reaktionen anzeigen"
          onClick={(e) => { e.stopPropagation(); setAllReactionsOpen(true); }}
          style={{
            display: 'flex',
            gap: '4px',
            padding: '4px 8px',
            borderRadius: '20px',
            background: 'var(--surface-strong)',
            border: '1px solid var(--border)',
            alignItems: 'center',
            cursor: 'pointer',
            lineHeight: '1'
          }}
        >
          {topReactions.map(r => (
            <span key={r.emoji} style={{ fontSize: '14px' }}>
              {r.emoji}
            </span>
          ))}
        </button>
      )}

      {/* Button to React */}
      {userId && (
        <div style={{ position: 'relative' }}>
          <button
            title="Reaktion hinzufügen"
            onClick={(e) => { e.stopPropagation(); setPickerOpen(true); }}
            style={{
              padding: '4px 10px',
              borderRadius: '20px',
              background: '#e0e0e0',
              border: 'none',
              color: '#333',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'none',
              lineHeight: '1'
            }}
          > + </button>

          {/* Emoji Picker */}
          {pickerOpen && (
            <div className="modal-overlay" onClick={(e) => { e.stopPropagation(); setPickerOpen(false); }}>
              <div className="modal-pane swipe-ignore" onClick={(e) => e.stopPropagation()} style={{ padding: '20px', maxWidth: '350px' }}>
                <div className="modal-header">
                  <h3 style={{ margin: 0 }}>Reaktion wählen</h3>
                  <button className="modal-close-btn" onClick={() => setPickerOpen(false)}>X</button>
                </div>
                <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                  <EmojiPicker 
                    lazyLoadEmojis={true}
                    onEmojiClick={(e) => { 
                      toggleReaction(e.emoji); 
                      setPickerOpen(false); 
                    }} 
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Shows all Reactions */}
      {allReactionsOpen && (
        <div className="modal-overlay" onClick={(e) => { e.stopPropagation(); setAllReactionsOpen(false); }}>
          <div className="modal-pane swipe-ignore" onClick={(e) => e.stopPropagation()} style={{ padding: '20px', maxWidth: '350px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>Alle Reaktionen</h3>
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
        </div>
      )}

    </div>
  );
}