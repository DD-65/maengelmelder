import { Issue } from "../types/Issue";
import { useIssueList } from "./useIssueList";

/* interface UseLoadIssuesProperties{
    issueList: Issue[]
    setIssueList:React.Dispatch<React.SetStateAction<Issue[]>>
} */
export function useLoadIssues(/* setIssueList: UseLoadIssuesProperties */){ 
    const {setIssueList} = useIssueList();

    const loadIssues = (archiv: boolean = false) => {
    fetch(`/api/mangel${archiv ? '?archiv=true' : ''}`)
      .then((res) => res.json())
      .then((data) => setIssueList(data));
    };
    return{loadIssues}
}