import { useDeleteComment } from "../hooks/useDeleteComment";
import { Issue } from "../types/Issue";
import { IssueComment } from "../types/IssueComment";
import {UserIcon} from '../icons/icons';
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
const getUserColor = (email = '') => {
    const s = email.toLowerCase();
    let hash = 0;
    for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
    const r = (hash * 123) % 256;
    const g = (hash * 321) % 256;
    const b = (hash * 213) % 256;
    return `rgb(${r}, ${g}, ${b})`;
};

export function Kommentar({setCommentList, issue, commentId, userEmail, userRole, commentStatus, commentInhalt, commentKommentator}: KommentarProperties){
    const{deleteComment}=useDeleteComment(setCommentList);
    
    return(
        <li className="singleComment" onClick={(e)=>{e.stopPropagation();}}> 
        {/*problem hier, ist dass man bei sehr langen Kommentaren ohne Leerzeichen nach rechts scrollen muss, das swiped zur Karte*/}
        <UserIcon className="kommentator-icon" color={getUserColor(commentKommentator)}/>
        <span className="kommentator"> {commentKommentator.split('@')[0]}</span>
        <span className="status">
        {commentStatus}    
        </span>
        <span className="inhalt">{commentInhalt}</span>
        
        {(userEmail === commentKommentator || userRole === "admin") ? (
            <button className="kommentarloeschen" onClick={(e)=>{e.stopPropagation(); issue.id && deleteComment(issue.id, commentId);}}>X</button>
        ):(
            <button className="kommentarloeschen-wronguser" onClick={(e)=>{e.stopPropagation();}}>X</button>
        )
    }
    
    </li>
    
);
}