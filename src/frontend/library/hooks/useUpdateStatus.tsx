import { useLoadIssues } from "./useLoadIssues";
import { Issue } from "../types/Issue";

export function useUpdateStatus(isArchiveMode: boolean, setIssueList: React.Dispatch<React.SetStateAction<Issue[]>>){
    const { loadIssues, deleteIssue } = useLoadIssues(setIssueList);

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
    };
  
  return{updateStatus}
}