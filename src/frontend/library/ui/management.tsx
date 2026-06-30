import { useEffect, useState } from "react";
import { toast } from 'react-toastify';
import { ConfirmDialog } from './confirmDialog';
import { UserProfile } from './userProfile';

interface ContentReport {
    id: number;
    mangel_id: number;
    report_reason: string;
    created_at: string;
    title: string;
    description: string;
}

// Importing of Filters
interface ManagementProperties {
    userRole: string | null;
    setViewMode: React.Dispatch<React.SetStateAction<"list" | "map" | "management">>;
}

type ManagementUser = {
    id: number;
    email: string;
    role: string;
    isRestricted: boolean;
};

function fetchUserList(fromID: number = 0, limit: number = 100) {
    return fetch(`/api/management/users/${fromID}/${limit}`)
        .then(response => {
            if (!response.ok) {
                throw new Error("Fehler beim Laden der Nutzerliste");
            }
            return response.json();
        });
}

function promoteUser(user: ManagementUser, refresh: () => void) {
    return () => {
        fetch(`/api/management/promote/${user.id}`, { method: 'POST' })
            .then(response => {
                if (!response.ok) throw new Error();
                toast.success(`Nutzer ${user.email} wurde befördert.`);
                refresh();
            })
            .catch(() => toast.error(`Fehler beim Befördern des Nutzers ${user.email}.`));
    };
}

function demoteUser(user: ManagementUser, refresh: () => void) {
    return () => {
        fetch(`/api/management/demote/${user.id}`, { method: 'POST' })
            .then(response => {
                if (!response.ok) throw new Error();
                toast.success(`Nutzer ${user.email} wurde herabgestuft.`);
                refresh();
            })
            .catch(() => toast.error(`Fehler beim Herabstufen des Nutzers ${user.email}.`));
    };
}

function restrictUser(user: ManagementUser, refresh: () => void) {
    return () => {
        fetch(`/api/management/restrict/${user.id}`, { method: 'POST' })
        .then(response => {
            if (!response.ok) throw new Error();
            toast.success(user.isRestricted ? `Einschränkung für ${user.email} wurde aufgehoben.` : `Nutzer ${user.email} wurde eingeschränkt.`);
            refresh();
        })
        .catch(() => toast.error(`Fehler beim Einschränken des Nutzers ${user.email}.`));
    };
}

function deleteUser(user: ManagementUser, refresh: () => void) {
    return () => {
        fetch(`/api/management/account_delete/${user.id}`, { method: 'DELETE' })
            .then(response => {
                if (!response.ok) throw new Error();
                toast.success(`Nutzer ${user.email} wurde gelöscht.`);
                refresh();
            })
            .catch(() => toast.error(`Fehler beim Löschen des Nutzers ${user.email}.`));
    };
}

function hardDeleteUser(user: ManagementUser, refresh: () => void) {
    return () => {
        fetch(`/api/management/hard_delete/${user.id}`, { method: 'DELETE' })
            .then(response => {
                if (!response.ok) throw new Error();
                toast.success(`Nutzer ${user.email} und alle zugehörigen Daten wurden gelöscht.`);
                refresh();
            })
            .catch(() => toast.error(`Fehler beim Löschen des Nutzers ${user.email} und aller zugehörigen Daten.`));
    };
}

function fetchReports() {
    return fetch(`/api/management/reports`)
        .then(response => {
            if (!response.ok) throw new Error("Fehler beim Laden der Meldungen");
            return response.json();
        });
}

export function Management({ userRole, setViewMode }: ManagementProperties) {
    const [userList, setUserList] = useState<ManagementUser[]>([]);
    const [fromID, setFromID] = useState(0);
    const [pendingDelete, setPendingDelete] = useState<{ action: () => void, label: string } | null>(null);
    const [refreshTick, setRefreshTick] = useState(0);
    const limit = 10;
    const [reportList, setReportList] = useState<ContentReport[]>([]);
    const [reportActionPopup, setReportActionPopup] = useState<{ reportId: number, decision: 'angenommen' | 'abgelehnt' } | null>(null);
    const [adminReason, setAdminReason] = useState("");
    const [profileOpen, setProfileOpen] = useState<string | null>(null);

    function refresh() {
        setRefreshTick(t => t + 1);
    }

    useEffect(() => {
        fetchUserList(fromID, limit).then(setUserList).catch(() => setUserList([]));
        fetchReports()
            .then(data => {
                console.log("Reports geladen:", data);
                setReportList(data);
            })
            .catch(error => {
                console.error("Fehler beim Laden der Reports:", error);
                setReportList([]);
            });
    }, [fromID, limit, refreshTick]);

    function confirmDelete(action: () => void, label: string) {
        setPendingDelete({ action, label });
    }

    const submitReportDecision = async () => {
        if (!reportActionPopup) return;
        if (!adminReason.trim()) {
            toast.error("🫪 Eine Begründung ist zwingend erforderlich.");
            return;
        }

        try {
            const res = await fetch(`/api/management/reports/${reportActionPopup.reportId}/decide`, {
                method: 'PATCH',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    decision: reportActionPopup.decision,
                    adminReason: adminReason.trim()
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            toast.success(`Meldung erfolgreich ${reportActionPopup.decision}.`);
            setReportActionPopup(null);
            setAdminReason("");
            refresh(); // Läd die Listen neu
        } catch (error) {
            toast.error(`🫪 ${error instanceof Error ? error.message : "Fehler beim Bearbeiten"}`);
        }
    };

    return (
        <div className="management-container">

            <h2 className="management-title">Nutzer-Management</h2>
            <p className="management-description">Hier können Sie Nutzer verwalten und Rollen zuweisen.</p>

            <div className="management-user-list">
                {userList.map((user) => (
                    <div key={user.id} className="management-user-card">
                        <span 
                            className="management-user-email"
                            onClick={(e) => { e.stopPropagation(); setProfileOpen(user.email); }}
                            style={{ 
                                cursor: 'pointer',
                                textDecoration: 'underline',
                                textDecorationColor: 'transparent',
                                transition: 'text-decoration-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.textDecorationColor = 'var(--text-muted)'}
                            onMouseLeave={(e) => e.currentTarget.style.textDecorationColor = 'transparent'}
                        >
                            {user.email}
                        </span>
                        <span className="management-user-role">{user.role}</span>
                        {user.isRestricted && <span className="management-user-role restricted">eingeschränkt</span>}
                        <div className="management-user-actions">
                            {!(user.role === "admin" || user.role === "superadmin") && userRole === "superadmin" && <button className="management-action-btn" onClick={promoteUser(user, refresh)}>↑ Admin</button>}
                            {user.role === "admin" && userRole === "superadmin" && <button className="management-action-btn" onClick={demoteUser(user, refresh)}>↓ User</button>}
                            {user.role === "user" && (userRole === "admin" || userRole === "superadmin") && <button className="management-action-btn" onClick={restrictUser(user, refresh)}>{user.isRestricted ? "Freigeben" : "Einschränken"}</button>}
                            {userRole === "admin" && user.role === "user" && <button className="management-action-btn" onClick={() => confirmDelete(deleteUser(user, refresh), `Nutzer ${user.email} löschen?`)}>User löschen</button>}
                            {userRole === "superadmin" && user.role !== "superadmin" && <>
                                <button className="management-action-btn" onClick={() => confirmDelete(deleteUser(user, refresh), `Nutzer ${user.email} löschen?`)}>Löschen</button>
                                <button className="management-action-btn danger" onClick={() => confirmDelete(hardDeleteUser(user, refresh), `Nutzer ${user.email} und alle zugehörigen Daten unwiderruflich löschen?`)}>User und Daten löschen</button>
                            </>}
                        </div>
                    </div>
                ))}
            </div>
            <div className="management-pagination">
                {fromID > 0 && (
                    <button className="management-load-less-btn" onClick={() => setFromID(fromID - limit)}>
                        Vorherige Seite
                    </button>
                )}
                {userList.length === limit && (
                    <button className="management-load-more-btn" onClick={() => setFromID(fromID + limit)}>
                        Nächste Seite
                    </button>
                )}
            </div>
            <hr style={{ margin: '30px 0', borderColor: 'var(--border)' }} />

            <h2 className="management-title">Inhalts-Moderation</h2>
            <p className="management-description">Hier können Sie gemeldete Mängel überprüfen und entscheiden.</p>

            <div className="management-user-list">
                {reportList.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>Aktuell liegen keine offenen Meldungen vor.</p>
                ) : (
                    reportList.map((report) => (
                        <div key={report.id} className="management-user-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '10px' }}>
                            <div style={{ width: '100%', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                                <strong style={{ color: 'var(--error)' }}>Gemeldeter Grund:</strong>
                                <p style={{ margin: '5px 0 0 0', fontStyle: 'italic' }}>"{report.report_reason}"</p>
                            </div>
                            <div style={{ width: '100%' }}>
                                <strong>Betroffener Mangel:</strong> {report.title}
                                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '5px 0 0 0' }}>{report.description}</p>
                            </div>
                            <div className="management-user-actions" style={{ marginTop: '10px', width: '100%', justifyContent: 'flex-start' }}>
                                <button className="management-action-btn danger" onClick={() => setReportActionPopup({ reportId: report.id, decision: 'angenommen' })}>
                                    Inhalt entfernen (Annehmen)
                                </button>
                                <button className="management-action-btn" onClick={() => setReportActionPopup({ reportId: report.id, decision: 'abgelehnt' })}>
                                    Meldung abweisen (Ablehnen)
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
            <button onClick={() => setViewMode('list')} className="back-button">Zurück zur Übersicht</button>

            {pendingDelete && (
                <ConfirmDialog
                    title="Sicher?"
                    message={pendingDelete.label}
                    onConfirm={() => { pendingDelete.action(); setPendingDelete(null); }}
                    onCancel={() => setPendingDelete(null)}
                />
            )}
            {reportActionPopup && (
                <div className="modal-overlay" onClick={() => { setReportActionPopup(null); setAdminReason(""); }}>
                    <div className="modal-pane" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h2 className="modal-header-title" style={{ margin: 0 }}>
                                Meldung {reportActionPopup.decision === 'angenommen' ? 'annehmen' : 'abweisen'}
                            </h2>
                            <button className="modal-close-btn" onClick={() => { setReportActionPopup(null); setAdminReason(""); }}>X</button>
                        </div>
                        <div className="modal-content" style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
                            <p style={{ fontSize: '14px', margin: 0 }}>
                                {reportActionPopup.decision === 'angenommen'
                                    ? "Der Mangel wird gelöscht. Bitte begründen Sie dies für den Melder und den Ersteller."
                                    : "Der Mangel bleibt bestehen. Bitte begründen Sie dies für den Melder."}
                            </p>
                            <textarea
                                value={adminReason}
                                onChange={(e) => setAdminReason(e.target.value)}
                                placeholder="Begründung (zwingend erforderlich)"
                                rows={4}
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                            />
                            <button onClick={submitReportDecision} style={{ width: '100%', marginTop: '10px' }}>
                                Entscheidung speichern
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <UserProfile email={profileOpen} onClose={() => setProfileOpen(null)} />
        </div>
    );
}
