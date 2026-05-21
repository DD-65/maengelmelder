import { useState } from "react";
import { Issue } from "../types/Issue";
// muss leider anders geschrieben werden, weil sonst useState wieder nicht geht
export function useIssueList() {
    const [issueList, setIssueList] = useState<Issue[]>([]);
    return {issueList, setIssueList};
}