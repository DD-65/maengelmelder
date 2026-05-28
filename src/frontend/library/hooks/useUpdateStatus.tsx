import { useLoadIssues } from "./useLoadIssues";
import { Issue } from "../types/Issue";
import { useLoadComments } from "./useLoadComments";
import { IssueComment } from "../types/IssueComment";

export function useUpdateStatus(isArchiveMode: boolean, setIssueList: React.Dispatch<React.SetStateAction<Issue[]>>, setCommentList: React.Dispatch<React.SetStateAction<IssueComment[]>>){
    const { loadIssues, deleteIssue } = useLoadIssues(setIssueList);
    const {loadComments}=useLoadComments(setCommentList)

    const updateStatus = async (id: number, newStatus: string, newStatusComment: string) => {
      const res = await fetch(`/api/mangel/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, statusComment: newStatusComment }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Fehler beim Aktualisieren des Status");
      }
      loadIssues(isArchiveMode);
      loadComments(id)
    };
  
  return{updateStatus}
}