import { createPortal } from 'react-dom';

interface UserProfileProps {
  email: string | null;
  onClose: () => void;
  currentUserEmail?: string | null;
  userRole?: string;
  emailVerified?: boolean;
  onLogout?: () => void;
}


export function UserProfile({ email, onClose, currentUserEmail, userRole, emailVerified, onLogout }: UserProfileProps) {
  
  if (!email) return null;

  const isOwnProfile = email === currentUserEmail;

return createPortal(
    <div className="modal-overlay" onClick={(e) => { e.stopPropagation(); onClose(); }}>
      <div 
        className="modal-pane swipe-ignore" 
        onClick={(e) => e.stopPropagation()} 
        style={{ padding: '24px', maxWidth: '400px', width: '90%' }}
      >
        <div className="modal-header" style={{ marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '20px', color: 'var(--text-h)' }}>
            {isOwnProfile ? "Mein Profil" : "Profil"}
          </h3>
          <button className="modal-close-btn" onClick={onClose}>X</button>
        </div>
        
        <div className="modal-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--surface-strong)', 
            border: '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', 
            fontSize: '32px', fontWeight: 'bold', color: 'var(--text)'
          }}>
            {email.charAt(0).toUpperCase()}
          </div>
          
          {isOwnProfile ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', width: '100%' }}>
              <h4 style={{ margin: 0, fontSize: '18px', color: 'var(--text-h)', wordBreak: 'break-all', textAlign: 'center' }}>
                {email}
              </h4>
              
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
                <div className={`verification-badge ${emailVerified ? "is-verified" : "is-unverified"}`}>
                  {emailVerified ? "Verifiziert" : "Nicht verifiziert"}
                </div>
                <div style={{ 
                  fontSize: '11px', padding: '4px 10px', border: '2px solid var(--border)',
                  borderRadius: '999px', backgroundColor: 'var(--surface)', fontWeight: '800',
                  textTransform: 'uppercase', color: 'var(--text-muted)'
                }}>
                  {userRole === "superadmin" ? <span style={{ color: 'orange' }}>Superadmin</span> : (userRole === "admin" ? "Admin" : "User")}
                </div>
              </div>

              {onLogout && (
                <button className='logout-button' onClick={onLogout} style={{ width: '100%', marginTop: '10px' }}>
                  Logout
                </button>
              )}
            </div>
          ) : (
            <>
              <h4 style={{ margin: 0, fontSize: '18px', color: 'var(--text-h)', wordBreak: 'break-all', textAlign: 'center' }}>
                {email}
              </h4>
              <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '14px', marginTop: '10px' }}>
              </p>
            </>
          )}

        </div>
      </div>
    </div>,
    document.body
  );
}