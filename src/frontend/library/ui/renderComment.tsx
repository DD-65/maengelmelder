import { useDeleteComment } from "../hooks/useDeleteComment";
import { Issue } from "../types/Issue";
import { IssueComment } from "../types/IssueComment";
import {UserIcon} from '../icons/icons';
import {getUserColor} from "../utils/getUserColor";   
import { formatTimestamp, getRelativeTime } from "../utils/timeUtils";
import { UserProfile } from './userProfile';
import { useState } from "react";


interface KommentarProperties{
    setCommentList: React.Dispatch<React.SetStateAction<IssueComment[]>>
    issue: Issue;
    commentId: number;
    userEmail: string;
    userRole: string;
    commentStatus:string;
    commentInhalt:string;
    commentKommentator: string;
    commentTimestamp: string;
}
// const getUserColor = (email = '') => {
//     const s = email.toLowerCase();
//     let hash = 0;
//     for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
//     const r = (hash * 123) % 256;
//     const g = (hash * 321) % 256;
//     const b = (hash * 213) % 256;
//     return `rgb(${r}, ${g}, ${b})`;
// };

export function Kommentar({setCommentList, issue, commentId, userEmail, userRole, commentStatus, commentInhalt, commentKommentator, commentTimestamp}: KommentarProperties){
    const{deleteComment}=useDeleteComment(setCommentList);
    const [profileOpen, setProfileOpen] = useState<string | null>(null);
    
    return(
        <>
        {(commentKommentator == userEmail) ?
            (
                <li className="singleComment ownComment" onClick={(e)=>{e.stopPropagation();}}>
                    {(commentStatus) && <span className="status">{commentStatus}</span>}
                    <span className="inhalt">{commentInhalt}</span>

                    <span className="kommentator"><div>{userRole === "superadmin" || userRole === "admin" ? 'Admin' : ''}</div> <div style={{color:getUserColor(commentKommentator)}}>{commentKommentator.split('@')[0]}</div><div className="kommentarzeit" title={formatTimestamp(commentTimestamp)}>{getRelativeTime(commentTimestamp)}</div></span>
                    <UserIcon className="kommentator-icon" color={getUserColor(commentKommentator)} />
                    <button className="kommentarloeschen" onClick={(e)=>{e.stopPropagation(); if(issue.id) deleteComment(issue.id, commentId);}}>X</button>
                </li>
            ):
            (
                    <li className="singleComment" onClick={(e) => { e.stopPropagation(); }}>
                        <UserIcon className="kommentator-icon" color={getUserColor(commentKommentator)} />
                        <span className="kommentator">
                            <div style={{ fontFamily: 'monospace', color: 'orange', fontSize: '10px', marginBottom: '-5px', fontWeight: 'bold' }}>
                                {commentStatus ? 'Admin-Nachricht' : ''}
                            </div> 
                            
                            <div 
                                onClick={(e) => { e.stopPropagation(); setProfileOpen(commentKommentator); }}
                                title="Nutzerprofil anzeigen"
                                style={{
                                    textAlign: 'left', 
                                    color: getUserColor(commentKommentator),
                                    cursor: 'pointer',
                                    textDecoration: 'underline',
                                    textDecorationColor: 'transparent',
                                    transition: 'text-decoration-color 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.textDecorationColor = getUserColor(commentKommentator)}
                                onMouseLeave={(e) => e.currentTarget.style.textDecorationColor = 'transparent'}
                            >
                                {commentKommentator.split('@')[0]}
                            </div>
                            
                            <div className="kommentarzeit" title={formatTimestamp(commentTimestamp)}>{getRelativeTime(commentTimestamp)}</div>
                        </span>
                        {(commentStatus) && <span className="status">{commentStatus}</span>}
                        <span className="inhalt">{commentInhalt}</span>
                        {(userRole === "superadmin" || userRole === "admin") && !commentStatus && <button className="kommentarloeschen" onClick={(e) => { e.stopPropagation(); if (issue.id) deleteComment(issue.id, commentId); }}>X</button>}
                    </li>
                )
            }  
            
            <UserProfile 
                email={profileOpen} 
                onClose={() => setProfileOpen(null)} 
                currentUserEmail={userEmail}
                userRole={userRole}
            />
        </>
    );
    

}
