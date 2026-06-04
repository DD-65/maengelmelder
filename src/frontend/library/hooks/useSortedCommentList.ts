import { Issue } from "../types/Issue";
import { IssueComment } from "../types/IssueComment";
import { useState, useEffect } from "react";
import { useLoadComments } from "./useLoadComments";

export function useSortedCommentList(issue: Issue, commentsOpen: boolean){
    const [commentList, setCommentList] = useState<IssueComment[]>([]);
    const {loadComments}=useLoadComments(setCommentList);
    useEffect(() => {
      if(!issue.id || !commentsOpen) return;

      loadComments(issue.id);

      // Kommentare live halten, solange die Kommentarspalte geoeffnet ist
      const intervalId = window.setInterval(() => {
        if(document.visibilityState === "visible" && issue.id){
          loadComments(issue.id);
        }
      }, 3000);

      return () => window.clearInterval(intervalId);
  }, [issue.id, commentsOpen, loadComments]);
    const sortedCommentList =  commentList; //falls ich es doch brauche und die Sortierung der DB nicht passt: [].sort;
    return{commentList, setCommentList, sortedCommentList}
}
