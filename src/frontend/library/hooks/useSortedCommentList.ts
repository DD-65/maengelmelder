import { Issue } from "../types/Issue";
import { IssueComment } from "../types/IssueComment";
import { useState, useEffect } from "react";
import { useLoadComments } from "./useLoadComments";

export function useSortedCommentList(issue: Issue){
    const [commentList, setCommentList] = useState<IssueComment[]>([]);
    const {loadComments}=useLoadComments(setCommentList);
    useEffect(() => {issue.id &&
      loadComments(issue.id);
  }, [issue.id, loadComments]);
    const sortedCommentList =  commentList; //falls ich es doch brauche und die Sortierung der DB nicht passt: [].sort;
    return{commentList, setCommentList, sortedCommentList}
}