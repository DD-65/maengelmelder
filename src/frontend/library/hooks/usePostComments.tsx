import { IssueComment } from "../types/IssueComment";

export function usePostComment(setCommentList: React.Dispatch<React.SetStateAction<IssueComment[]>>){

    const postComment = async (mangelid: number, newComment: string) => {
      const res = await fetch(`/api/mangel/${mangelid}/comment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: newComment }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Fehler beim Abschicken des Kommentars");
        return;
      }

      const updatedComment = await res.json();
      setCommentList(prev => [...prev, updatedComment]); {/*das war ein Vorschlag von ChatGPT, 
        da ich es nicht geschafft habe die neuen kommentare direkt zu laden,
         ohne eine Endlosschleife zu verursachen und das unten hat gar nichts geladen*/}
      // await loadComments(mangelid); // aktualisieren der Kommentarspalte
    };
    return{postComment}
}