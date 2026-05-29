import { useLoadComments } from "./useLoadComments";
import { IssueComment } from "../types/IssueComment";

export function useDeleteComment(setCommentList: React.Dispatch<React.SetStateAction<IssueComment[]>>){
    const{loadComments}=useLoadComments(setCommentList)
    // Kommentar in db löschen
    const deleteComment = async (mangelId: number|null, commentid: number) => {
    await fetch(`/api/comment/${commentid}`, { method: 'DELETE' });
    mangelId && loadComments(mangelId);
    };

    return{deleteComment}
}