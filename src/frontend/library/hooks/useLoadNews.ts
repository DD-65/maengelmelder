import { News } from "../types/News";
import { useCallback } from "react";


export function useLoadNews(setNewsList: React.Dispatch<React.SetStateAction<News[]>>) { 
    // News aus db laden
     const loadNews = useCallback( async () => {
      const res = await fetch(`/api/newsfeed/`);
      const data = await res.json();
      setNewsList([...data]);
     }, [setNewsList])

    return{loadNews}

} 