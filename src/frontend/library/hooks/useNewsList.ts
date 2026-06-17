import { News } from "../types/News";
import { useState, useEffect } from "react";
import { useLoadNews } from "./useLoadNews";

export function useNewsList(){
    const [newsList, setNewsList] = useState<News[]>([]);

//     const {loadNews}=useLoadNews(setNewsList);
//     useEffect(() => { 

//       loadNews();

//       // Kommentare live halten, solange die Kommentarspalte geoeffnet ist
//       const intervalId = window.setInterval(() => {
//         if(document.visibilityState === "visible"){
//           loadNews();
//         }
//       }, 300000); //aktuell alle 5 Minuten aktualisieren des Newsfeed(weil 300000 ms I guess)

//       return () => window.clearInterval(intervalId);
//   }, [loadNews]);

    return{newsList, setNewsList}
}