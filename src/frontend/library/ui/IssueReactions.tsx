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
  const { addReaction } = useReactions(issue, setIssueList);
  const reactions = issue.reactions || [];

  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginTop: '12px', marginBottom: '8px' }}>
      
      {/* Display Container for Reactions */}
      {reactions.length > 0 && (
        <div style={{
          display: 'flex',
          gap: '8px',
          padding: '4px 10px',
          borderRadius: '20px',
          background: 'var(--surface-strong)',
          border: '1px solid var(--border)',
          alignItems: 'center'
        }}>
          {reactions.map(r => (
            <span key={r.emoji} style={{ fontSize: '14px', display: 'flex', gap: '4px', alignItems: 'center' }}>
              <span>{r.emoji}</span>
              <span style={{ fontWeight: 'bold', color: 'var(--text-muted)' }}>{r.count}</span>
            </span>
          ))}
        </div>
      )}

      {/* Button to add Reaction */}
      {userId && (
        <div style={{ position: 'relative' }}>
          <button
            title="Reaktion hinzufügen"
            onClick={(e) => { e.stopPropagation(); setPickerOpen(true); }}
            style={{
              padding: '4px 12px',
              borderRadius: '20px',
              background: '#e0e0e0', 
              border: 'none',
              color: '#333',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'none'
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
                  <EmojiPicker lazyLoadEmojis={true} onEmojiClick={(e) => {addReaction(e.emoji); setPickerOpen(false); }} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}