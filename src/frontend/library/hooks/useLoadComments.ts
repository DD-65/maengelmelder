import { IssueComment } from "../types/IssueComment";
import { useCallback } from "react";


export function useLoadComments(setCommentList: React.Dispatch<React.SetStateAction<IssueComment[]>>) { 

    // Kommentare aus db laden
     const loadComments = useCallback((mangelId :Number) => {
      console.log("Kommentareladen")
    fetch(`/api/comment/${mangelId}`)
      .then((res) => res.json())
      .then((data) => setCommentList(data));
//     fetch(`/api/comment/${mangelId}`)
//   .then(async (res) => {
//     if (!res.ok) {
//       const errText = await res.text();
//       throw new Error(errText);
//     }
//     return res.json();
//   })
//   .then((data) => setCommentList(data))
//   .catch((err) => console.error("API ERROR:", err));

// fetch(`/api/comment/${mangelId}`)
//   .then(res => res.text())
//   .then(text => {
//     console.log("RAW RESPONSE:", text);
//   });

     }, [setCommentList]);
    



    // // issues in db löschen
    // const deleteIssue = async (id: number, archiv: boolean = false, permanent: boolean = false) => {
    // await fetch(`/api/mangel/${id}${permanent ? '?permanent=true' : ''}`, { method: 'DELETE' });
    // loadIssues(archiv);
    // };

    return{loadComments, /*deleteIssue*/}

} 