import { News } from "../types/News";

export function usePostNews(setNewsList: React.Dispatch<React.SetStateAction<News[]>>){

    const postNews = async (mangelid: number|null, newComment: string|null) => {
      const res = await fetch(`/api/newsfeed/add/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: newComment, mangelId: mangelid }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "Fehler beim Abschicken der News");
      }

      setNewsList(prev => [data, ...prev]); 
    };
    return{postNews}
}