import { useEffect, useState } from "react";
import { useLayersControlElement } from "react-leaflet/LayersControl";


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
export function Management({userRole, setViewMode}:ManagementProperties){
    const [userList, setUserList] = useState<{id: number, email: string, role: string}[]>([]);
    const [fromID, setFromID] = useState(0);
    const limit = 10;
    useEffect(() => {
        fetchUserList(fromID, limit).then(setUserList).catch(() => setUserList([]));
    }, [fromID, limit]);
    
    return(
        <div className="management-container" style={{ width: '100%', height: '600px', position: 'relative', zIndex: 0 }}>
        
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
                        {!(user.role === "admin" || user.role === "superadmin") && userRole === "superadmin" && <button className="management-action-btn">↑Admin</button>}
                        {(user.role === "admin") && userRole === "superadmin" && <button className="management-action-btn">↓User</button>}
                        {userRole === "admin" && user.role === "user" && <button className="management-action-btn">Löschen</button>}
                        {userRole === "superadmin" && user.role !== "superadmin" && <button className="management-action-btn">Löschen</button>}
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
                {userList.length >= limit && (
                    <button className="management-load-more-btn" onClick={() => setFromID(fromID + limit)}>
                        Nächste Seite
                    </button>
                )}
            </div>
            <button onClick={() => setViewMode('list')} className="back-button">Zurück zur Übersicht</button>
        </div>
        );
    }