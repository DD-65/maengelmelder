import { useState } from "react";

export type Issue = {
  id?: number;
  title: string;
  description: string | null;
  location: string | null;
  status?: string;
  created_at?: string;
  votes?: number;
  user_email?: string | null;
  has_voted?: number | boolean;
  kategorie?: string | null;
  image_url?: string | null;
  thumbnail_url?: string | null;
}

// muss leider anders geschrieben werden, weil sonst useState wieder nicht geht
export function useIssueList() {
    const [issueList, setIssueList] = useState<Issue[]>([]);
    return{issueList, setIssueList};
}
