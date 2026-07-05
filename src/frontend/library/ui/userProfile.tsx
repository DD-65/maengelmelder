import { createPortal } from 'react-dom';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { getUserColor, getSecondaryUserColor } from '../utils/getUserColor';

interface UserProfileProps {
  email: string | null;
  onClose: () => void;
  currentUserEmail?: string | null;
  onLogout?: () => void;
  onProfileUpdate?: (newUsername: string | null, newPicUrl: string | null) => void;
}

export function UserProfile({ email, onClose, currentUserEmail, onLogout, onProfileUpdate }: UserProfileProps) {
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const isOwnProfile = email === currentUserEmail;

  useEffect(() => {
    if (!email) return;
    setIsLoading(true);
    fetch(`/api/users/profile/${email}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        setUserData(data);
        setEditUsername(data?.username || "");
        setIsLoading(false);
      });
  }, [email]);

  if (!email) return null;

  const handleFollowToggle = async () => {
    if (!userData) return;
    const method = userData.isFollowed ? "DELETE" : "POST";
    try {
      const res = await fetch(`/api/users/${userData.id}/follow`, { method });
      if (res.ok) {
        setUserData({ ...userData, isFollowed: userData.isFollowed ? 0 : 1 });
        toast.success(userData.isFollowed ? "Entfolgt!" : "Gefolgt!");
      }
    } catch {
      toast.error("Fehler beim Folgen");
    }
  };

  const saveProfile = async () => {
    const formData = new FormData();
    formData.append("username", editUsername);
    if (fileInputRef.current?.files?.[0]) {
      formData.append("image", fileInputRef.current.files[0]);
    }

    try {
      const res = await fetch("/api/auth/profile", { method: "PATCH", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success("Profil gespeichert!");
      setUserData({ ...userData, username: data.username, profile_pic_url: data.profilePictureUrl || userData.profile_pic_url });
      setEditMode(false);
      setPreviewUrl(null)
      if (onProfileUpdate) onProfileUpdate(data.username, data.profilePictureUrl || userData.profile_pic_url);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return createPortal(
    <div className="modal-overlay" onClick={(e) => { e.stopPropagation(); onClose(); }}>
      <div className="modal-pane swipe-ignore" onClick={(e) => e.stopPropagation()} style={{ padding: '24px', maxWidth: '400px', width: '90%' }}>
        
        <div className="modal-header" style={{ marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '20px', color: 'var(--text-h)' }}>{isOwnProfile ? "Mein Profil" : "Nutzerprofil"}</h3>
          <button className="modal-close-btn" onClick={onClose}>X</button>
        </div>
        
        {isLoading ? (
           <p className="meta-line">Lade Profil...</p>
        ) : !userData ? (
           <p className="error-text">Nutzer nicht gefunden.</p>
        ) : (
          <div className="modal-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            
            <div style={{ position: 'relative' }}>
              
              {(previewUrl || userData.profile_pic_url) ? (
                <img 
                  src={previewUrl || userData.profile_pic_url} 
                  alt="Profile" 
                  style={{ width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }} 
                />
              ) : (
                <div style={{ width: '90px', height: '90px', borderRadius: '50%', backgroundColor: getUserColor(userData.email), color: getSecondaryUserColor(userData.email), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', fontWeight: 'bold', border: '2px solid var(--border)' }}>
                  {userData.email.charAt(0).toUpperCase()}
                </div>
              )}

              {isOwnProfile && editMode && (
                <>
                  <button onClick={() => fileInputRef.current?.click()} style={{ position: 'absolute', bottom: 0, right: 0, padding: '6px', borderRadius: '50%', background: 'var(--accent)', color: 'white', border: 'none', cursor: 'pointer' }}>📸</button>
                  
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    accept="image/*" 
                    style={{ display: 'none' }} 
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setPreviewUrl(URL.createObjectURL(e.target.files[0]));
                      }
                    }}
                  />
                </>
              )}
            </div>
            
            {isOwnProfile && editMode ? (
              <input type="text" value={editUsername} onChange={e => setEditUsername(e.target.value)} placeholder="Dein neuer Benutzername..." style={{ textAlign: 'center', width: '100%' }} />
            ) : (
              <div style={{ textAlign: 'center' }}>
                <h4 style={{ margin: 0, fontSize: '22px', color: 'var(--text-h)', wordBreak: 'break-all' }}>
                  {userData.username || userData.email.split('@')[0]}
                </h4>
                {userData.username && <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>{userData.email}</p>}
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
              <div className={`verification-badge ${userData.email_verified_at ? "is-verified" : "is-unverified"}`}>{userData.email_verified_at ? "Verifiziert" : "Nicht verifiziert"}</div>
              <div style={{ fontSize: '11px', padding: '4px 10px', border: '2px solid var(--border)', borderRadius: '999px', backgroundColor: 'var(--surface)', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                {userData.role === "superadmin" ? <span style={{ color: 'orange' }}>Superadmin</span> : (userData.role === "admin" ? "Admin" : "User")}
              </div>
            </div>

            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
              {isOwnProfile ? (
                editMode ? (
                  <button onClick={saveProfile} style={{ background: 'var(--accent)', color: 'white' }}>Speichern</button>
                ) : (
                  <>
                    <button onClick={() => setEditMode(true)}>Profil bearbeiten</button>
                    {onLogout && <button className='logout-button' onClick={onLogout}>Logout</button>}
                  </>
                )
              ) : (
                <button onClick={handleFollowToggle} style={{ background: userData.isFollowed ? 'transparent' : 'var(--accent)', color: userData.isFollowed ? 'var(--text)' : 'white', border: `1px solid ${userData.isFollowed ? 'var(--border)' : 'var(--accent)'}` }}>
                  {userData.isFollowed ? "Entfolgen" : "Folgen"}
                </button>
              )}
            </div>

          </div>
        )}
      </div>
    </div>,
    document.body
  );
}