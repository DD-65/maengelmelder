import { IssueComment } from "../types/IssueComment";
import { useCallback } from "react";


export function useLoadComments(setCommentList: React.Dispatch<React.SetStateAction<IssueComment[]>>) { 

    // Kommentare aus db laden
     const loadComments = useCallback( async (mangelId: Number) => {
      const res = await fetch(`/api/comment/${mangelId}`);
      const data = await res.json();
      setCommentList(data);
     }, [setCommentList])
    

    // Kommentar in db löschen
    const deleteComment = async (mangelid: number, archiv: boolean = false, permanent: boolean = false) => {
    await fetch(`/api/mangel/${mangelid}${permanent ? '?permanent=true' : ''}`, { method: 'DELETE' });
    //loadComments(mangelid);
    };

    return{loadComments, deleteComment}

} 