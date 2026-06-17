import { useLoadNews } from "./useLoadNews";
import { News } from "../types/News";

export function useDeleteNews(setNewsList: React.Dispatch<React.SetStateAction<News[]>>){
    const{loadNews}=useLoadNews(setNewsList)
    // News in db löschen
    const deleteNews = async (newsid: number) => {
    await fetch(`/api/newsfeed/${newsid}`, { method: 'DELETE' });
    loadNews();
    };

    return{deleteNews}
}