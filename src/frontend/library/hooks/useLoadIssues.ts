import { Issue } from "../types/Issue";
import { useCallback } from "react";


/* interface UseLoadIssuesProperties{
    issueList: Issue[]
    setIssueList:React.Dispatch<React.SetStateAction<Issue[]>>
} */
export function useLoadIssues(setIssueList: React.Dispatch<React.SetStateAction<Issue[]>>) { 

    // issues aus db laden
    const loadIssues = useCallback((archiv: boolean = false) => {
    fetch(`/api/mangel${archiv ? '?archiv=true' : ''}`)
      .then((res) => res.json())
      .then((data) => setIssueList(data));
    }, [setIssueList]);
    

    // issues in db löschen
    const deleteIssue = async (id: number) => {
    await fetch(`/api/mangel/${id}`, { method: 'DELETE' });
    loadIssues();
    };

    return{loadIssues, deleteIssue}

} 