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
    const deleteIssue = async (id: number, archiv: boolean = false, permanent: boolean = false) => {
    await fetch(`/api/mangel/${id}${permanent ? '?permanent=true' : ''}`, { method: 'DELETE' });
    loadIssues(archiv);
    };

    return{loadIssues, deleteIssue}

} 
 