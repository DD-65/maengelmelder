import { useEffect, useState } from "react";
import { toast } from 'react-toastify';
import { UserProfile } from './userProfile';

interface UsersListProperties {
    setViewMode: (val: 'list' | 'map' | 'management' | 'users') => void;
}

interface UserListItem {
    id: number;
    email: string;
    role: string;
    username: string | null;
    profile_pic_url: string | null;
    isFollowed: number; // SQLite returns 0 or 1
    followsMe: number;  // SQLite returns 0 or 1
}

export function UsersList({ setViewMode }: UsersListProperties) {
    const [users, setUsers] = useState<UserListItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [profileOpen, setProfileOpen] = useState<string | null>(null);

    const fetchUsers = async () => {
        setIsLoading(true);
        setError("");
        try {
            const res = await fetch("/api/users");
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Fehler beim Laden der Nutzer");
            }
            setUsers(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Fehler beim Laden der Nutzer");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        Promise.resolve().then(() => {
            fetchUsers();
        });
    }, []);

    const handleFollowToggle = async (user: UserListItem) => {
        const url = `/api/users/${user.id}/follow`;
        const method = user.isFollowed ? "DELETE" : "POST";
        try {
            const res = await fetch(url, { method });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Fehler beim Aktualisieren des Follow-Status");
            }
            toast.success(user.isFollowed ? `Entfolgt: ${user.username || user.email}` : `Gefolgt: ${user.username || user.email}`);
            
            // local update to avoid full reload
            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isFollowed: u.isFollowed ? 0 : 1 } : u));
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Aktion fehlgeschlagen");
        }
    };

    const followedUsers = users.filter(u => u.isFollowed === 1);
    const otherUsers = users.filter(u => u.isFollowed !== 1);
    const followersCount = users.filter(u => u.followsMe === 1).length;

    const renderUserCard = (user: UserListItem) => (
        <div key={user.id} className="management-user-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                {user.profile_pic_url ? (
                    <img 
                        src={user.profile_pic_url} 
                        alt="Profilbild" 
                        style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '1px solid var(--border)',
                            flexShrink: 0
                        }}
                    />
                ) : (
                    <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--accent-soft)',
                        color: 'var(--accent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        flexShrink: 0
                    }}>
                        {user.email.charAt(0).toUpperCase()}
                    </div>
                )}

                <span 
                    className="management-user-email" 
                    onClick={(e) => { e.stopPropagation(); setProfileOpen(user.email); }}
                    style={{ 
                        flex: 1, 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        textDecorationColor: 'transparent',
                        transition: 'text-decoration-color 0.2s',
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.textDecorationColor = 'var(--text-muted)'}
                    onMouseLeave={(e) => e.currentTarget.style.textDecorationColor = 'transparent'}
                >
                    <span style={{ fontWeight: 'bold' }}>
                        {user.username || user.email.split('@')[0]}
                    </span>
                    {user.username && (
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '-2px' }}>
                            {user.email}
                        </span>
                    )}
                </span>
                {user.followsMe === 1 && (
                    <span style={{
                        fontSize: '9px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: 'var(--accent-soft)',
                        color: 'var(--accent)',
                        fontWeight: 'bold',
                        flexShrink: 0,
                        marginRight: '6px'
                    }}>
                        Folgt dir
                    </span>
                )}
                <span className="management-user-role" style={{ fontSize: '10px', flexShrink: 0 }}>
                    {user.role === "superadmin" ? "Superadmin" : user.role === "admin" ? "Admin" : "Nutzer"}
                </span>
            </div>
            <button
                className={`management-action-btn ${user.isFollowed ? '' : 'accent-btn'}`}
                onClick={() => handleFollowToggle(user)}
                style={{
                    background: user.isFollowed ? 'transparent' : 'var(--accent)',
                    color: user.isFollowed ? 'var(--text)' : 'white',
                    borderColor: user.isFollowed ? 'var(--border)' : 'var(--accent)',
                    fontWeight: 'bold',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    marginLeft: '12px'
                }}
            >
                {user.isFollowed ? "Entfolgen" : "Folgen"}
            </button>
        </div>
    );

    return (
        <div className="management-container">
            <h2 className="management-title">Accountübersicht</h2>
            <p className="management-description">Folgen Sie anderen Accounts, um deren Mängel gezielt zu filtern.</p>
            
            {error && <p className="error-text">{error}</p>}
            {isLoading && <p className="meta-line">Accounts werden geladen...</p>}
            
            {!isLoading && (
                users.length === 0 ? (
                    <p className="meta-line">Keine anderen registrierten Accounts vorhanden.</p>
                ) : (
                    <>
                        <div style={{
                            display: 'flex',
                            gap: '20px',
                            marginBottom: '20px',
                            padding: '12px 16px',
                            background: 'var(--surface-strong)',
                            borderRadius: '10px',
                            border: '1px solid var(--border)',
                            fontSize: '14px',
                            fontWeight: 'bold'
                        }}>
                            <div>Du folgst: <span style={{ color: 'var(--accent)' }}>{followedUsers.length}</span></div>
                            <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '20px' }}>
                                Follower: <span style={{ color: 'var(--accent-2)' }}>{followersCount}</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {followedUsers.length > 0 && (
                                <div>
                                    <h3 style={{ fontSize: '15px', color: 'var(--text-h)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--accent)' }}><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                                        Gefolgt ({followedUsers.length})
                                    </h3>
                                    <div className="management-user-list">
                                        {followedUsers.map(renderUserCard)}
                                    </div>
                                </div>
                            )}

                            <div>
                                <h3 style={{ fontSize: '15px', color: 'var(--text-h)', marginBottom: '10px' }}>
                                    Vorschläge ({otherUsers.length})
                                </h3>
                                {otherUsers.length === 0 ? (
                                    <p className="meta-line" style={{ fontSize: '12px' }}>Du folgst bereits allen registrierten Accounts.</p>
                                ) : (
                                    <div className="management-user-list">
                                        {otherUsers.map(renderUserCard)}
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )
            )}

            <button onClick={() => setViewMode('list')} className="back-button" style={{ marginTop: '20px' }}>
                Zurück zur Übersicht
            </button>
            <UserProfile 
                email={profileOpen} 
                onClose={() => setProfileOpen(null)} 
            />
        </div>
    );
}
