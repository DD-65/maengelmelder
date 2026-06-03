import { useDeleteComment } from "../hooks/useDeleteComment";
import { Issue } from "../types/Issue";
import { IssueComment } from "../types/IssueComment";
import {UserIcon} from '../icons/icons';
import {getUserColor, getSecondaryUserColor} from "../utils/getUserColor";   
interface KommentarProperties{
    setCommentList: React.Dispatch<React.SetStateAction<IssueComment[]>>
    issue: Issue;
    commentId: number;
    userEmail: string;
    userRole: string;
    commentStatus:string;
    commentInhalt:string;
    commentKommentator: string;
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

export function Kommentar({setCommentList, issue, commentId, userEmail, commentStatus, commentInhalt, commentKommentator}: KommentarProperties){
    const{deleteComment}=useDeleteComment(setCommentList);
    
    return(
        <>
        {(commentKommentator == userEmail) ?
            (
                <li className="singleComment ownComment" onClick={(e)=>{e.stopPropagation();}}>
                    {(commentStatus) && <span className="status">{commentStatus}</span>}
                    <span className="inhalt">{commentInhalt}</span>

                    <span className="kommentator"><div>{commentStatus ? 'Admin' : ''}</div> <div style={{color:getUserColor(commentKommentator)}}>{commentKommentator.split('@')[0]}</div></span>
                    <UserIcon className="kommentator-icon" color={getUserColor(commentKommentator)} />
                    <button className="kommentarloeschen" onClick={(e)=>{e.stopPropagation(); if(issue.id) deleteComment(issue.id, commentId);}}>X</button>
                </li>
            ):
            (
                <li className="singleComment" onClick={(e)=>{e.stopPropagation();}}>
                {/*problem hier, ist dass man bei sehr langen Kommentaren ohne Leerzeichen nach rechts scrollen muss, das swiped zur Karte*/}
                <UserIcon className="kommentator-icon" color={getUserColor(commentKommentator)}/>
                <span className="kommentator"><div style={{fontFamily:'monospace', color:'orange', fontSize:'10px', marginBottom:'-5px', fontWeight:'bold'}}>{commentStatus ? 'Admin-Nachricht' : ''}</div> <div style={{textAlign:'left', color:getUserColor(commentKommentator)}}>{commentKommentator.split('@')[0]}</div></span>
                {(commentStatus) && <span className="status">{commentStatus}</span>}
                <span className="inhalt">{commentInhalt}</span>
                </li>
            )
        }  
        </>
    );
    

}