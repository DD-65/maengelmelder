import { useLoadComments } from "./useLoadComments";
import { IssueComment } from "../types/IssueComment";

export function usePostComment(setCommentList: React.Dispatch<React.SetStateAction<IssueComment[]>>){
    const{loadComments}=useLoadComments(setCommentList);

    const postComment = async (mangelid: number, newComment: string) => {
      const res = await fetch(`/api/mangel/${mangelid}/comment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: newComment }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Fehler beim Abschicken des Kommentars");
      }
      
      await loadComments(mangelid); // aktualisieren der Kommentarspalte
    };
    return{postComment}
}