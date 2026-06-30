import { createPortal } from 'react-dom';

interface UserProfileProps {
  email: string | null;
  onClose: () => void;
}

export function UserProfile({ email, onClose }: UserProfileProps) {

  if (!email) return null;

  return createPortal(
    <div className="modal-overlay" onClick={(e) => { e.stopPropagation(); onClose(); }}>
      <div 
        className="modal-pane swipe-ignore" 
        onClick={(e) => e.stopPropagation()} 
        style={{ padding: '24px', maxWidth: '400px', width: '90%' }}
      >
        <div className="modal-header" style={{ marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '20px', color: 'var(--text-h)' }}>
            Profil
          </h3>
          <button className="modal-close-btn" onClick={onClose}>X</button>
        </div>
        
        <div className="modal-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          
          <h4 style={{ margin: 0, fontSize: '18px', color: 'var(--text-h)', wordBreak: 'break-all', textAlign: 'center' }}>
            {email}
          </h4>
          
          <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '14px', marginTop: '10px' }}>
            TEXT
          </p>
        </div>
      </div>
    </div>,
    document.body 
  );
}