import { useEffect, useState } from "react";
import { toast } from 'react-toastify';
import { ConfirmDialog } from './confirmDialog';

// Importing of Filters
interface ManagementProperties{
    userRole: string | null;
    setViewMode: React.Dispatch<React.SetStateAction<"list" | "map" | "management">>;
}
function fetchUserList(fromID: number = 0, limit: number = 100) {
    return fetch(`/api/management/users/${fromID}/${limit}`)
    .then(response => {
        if (!response.ok) {
            throw new Error("Fehler beim Laden der Nutzerliste");
        }
        return response.json();
    });
}

function promoteUser(user: {id: number, email: string, role: string}, refresh: () => void) {
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

function demoteUser(user: {id: number, email: string, role: string}, refresh: () => void) {
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

function deleteUser(user: {id: number, email: string, role: string}, refresh: () => void) {
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

function hardDeleteUser(user: {id: number, email: string, role: string}, refresh: () => void) {
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


export function Management({userRole, setViewMode}:ManagementProperties){
    const [userList, setUserList] = useState<{id: number, email: string, role: string}[]>([]);
    const [fromID, setFromID] = useState(0);
    const [pendingDelete, setPendingDelete] = useState<{ action: () => void, label: string } | null>(null);
    const [refreshTick, setRefreshTick] = useState(0);
    const limit = 10;

    function refresh() {
        setRefreshTick(t => t + 1);
    }

    useEffect(() => {
        fetchUserList(fromID, limit).then(setUserList).catch(() => setUserList([]));
    }, [fromID, limit, refreshTick]);

    function confirmDelete(action: () => void, label: string) {
        setPendingDelete({ action, label });
    }

    return(
        <div className="management-container">

        <h2 className="management-title">Nutzer-Management</h2>
        <p className="management-description">Hier können Sie Nutzer verwalten und Rollen zuweisen.</p>

        <table className="management-user-table">
            <thead>
                <tr>
                    <th><span>Benutzername</span></th>
                    <th><span>E-Mail</span></th>
                    <th><span>Rolle</span></th>
                    <th><span>Aktionen</span></th>
                </tr>
            </thead>
            <tbody>
            {userList.map((user) => (
                <tr key={user.id} className="management-user-item">
                    <td className="management-user-email">{user.email.substring(0, user.email.indexOf('@'))}</td>
                    <td className="management-user-title">{user.email}</td>
                    <td className="management-user-role">{user.role}</td>
                    <td className="management-user-actions">
                        {!(user.role === "admin" || user.role === "superadmin") && userRole === "superadmin" && <button className="management-action-btn" onClick={promoteUser(user, refresh)}>↑ Admin</button>}
                        {(user.role === "admin") && userRole === "superadmin" && <button className="management-action-btn" onClick={demoteUser(user, refresh)}>↓ User</button>}
                        {userRole === "admin" && user.role === "user" && <button className="management-action-btn" onClick={() => confirmDelete(deleteUser(user, refresh), `Nutzer ${user.email} löschen?`)}>User löschen</button>}
                        {userRole === "superadmin" && user.role !== "superadmin" && <>
                            <button className="management-action-btn" onClick={() => confirmDelete(deleteUser(user, refresh), `Nutzer ${user.email} löschen?`)}>Löschen</button>
                            <button className="management-action-btn" style={{ backgroundColor: 'var(--danger-2)' }} onClick={() => confirmDelete(hardDeleteUser(user, refresh), `Nutzer ${user.email} und alle zugehörigen Daten unwiderruflich löschen?`)}>User und Daten löschen</button>
                        </>}
                    </td>
                </tr>
            ))}
            </tbody>
        </table>
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
            <button onClick={() => setViewMode('list')} className="back-button">Zurück zur Übersicht</button>

        {pendingDelete && (
            <ConfirmDialog
                title="Sicher?"
                message={pendingDelete.label}
                onConfirm={() => { pendingDelete.action(); setPendingDelete(null); }}
                onCancel={() => setPendingDelete(null)}
            />
        )}
        </div>
        );
    }