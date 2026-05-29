import { useDeleteComment } from "../hooks/useDeleteComment";
import { Issue } from "../types/Issue";
import { IssueComment } from "../types/IssueComment";
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
export function Kommentar({setCommentList, issue, commentId, userEmail, userRole, commentStatus, commentInhalt, commentKommentator}: KommentarProperties){
    const{deleteComment}=useDeleteComment(setCommentList);
    
    return(
        <li className="singleComment">
            <span className="kommentator">{commentKommentator.split('@')[0]}</span>
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