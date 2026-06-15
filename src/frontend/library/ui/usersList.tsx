import { useEffect, useState } from "react";
import { toast } from 'react-toastify';

interface UsersListProperties {
    setViewMode: (val: 'list' | 'map' | 'management' | 'users') => void;
}

interface UserListItem {
    id: number;
    email: string;
    role: string;
    isFollowed: number; // SQLite returns 0 or 1
}

export function UsersList({ setViewMode }: UsersListProperties) {
    const [users, setUsers] = useState<UserListItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

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
            toast.success(user.isFollowed ? `Entfolgt: ${user.email}` : `Gefolgt: ${user.email}`);
            
            // local update to avoid full reload
            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isFollowed: u.isFollowed ? 0 : 1 } : u));
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Aktion fehlgeschlagen");
        }
    };

    return (
        <div className="management-container">
            <h2 className="management-title">Accountübersicht</h2>
            <p className="management-description">Folgen Sie anderen Accounts, um deren gemeldete Mängel gezielt über das Kontrollzentrum links filtern zu können.</p>
            
            {error && <p className="error-text">{error}</p>}
            {isLoading && <p className="meta-line">Accounts werden geladen...</p>}
            
            {!isLoading && users.length === 0 && (
                <p className="meta-line">Keine anderen registrierten Accounts vorhanden.</p>
            )}

            <div className="management-user-list">
                {users.map(user => (
                    <div key={user.id} className="management-user-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
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
                            <span className="management-user-email" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {user.email}
                            </span>
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
                ))}
            </div>

            <button onClick={() => setViewMode('list')} className="back-button" style={{ marginTop: '20px' }}>
                Zurück zur Übersicht
            </button>
        </div>
    );
}
