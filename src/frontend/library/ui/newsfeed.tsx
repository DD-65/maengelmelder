
import { NewsfeedCard } from './newsfeedCard';
import { useLoadNews } from '../hooks/useLoadNews';
import { useNewsList } from '../hooks/useNewsList';
import { News } from '../types/News';
import { useState, useEffect } from 'react';
import { usePostNews } from '../hooks/usePostNews';
import { toast } from 'react-toastify';
import { ModifyIcon } from '../icons/icons';

interface NewsfeedProperties {
  userRole: string;
  userId: number | null;
}

export function Newsfeed({  userRole, userId}: NewsfeedProperties){
    const[newNews, setNewNews] = useState('')
    const{newsList, setNewsList} = useNewsList();
    const{loadNews} = useLoadNews(setNewsList);
    const{postNews} =usePostNews(setNewsList);

    useEffect(() => { 

      loadNews();

    //   // Kommentare live halten, solange die Kommentarspalte geoeffnet ist
    //   const intervalId = window.setInterval(() => {
    //     if(document.visibilityState === "visible"){
    //       loadNews();
    //     }
    //   }, 300000); //aktuell alle 5 Minuten aktualisieren des Newsfeed(weil 300000 ms I guess)
    //   return () => window.clearInterval(intervalId);
  }, [loadNews]);

    return (
        <div>
            <ul className='newsfeed'>
                {newsList
                .map((news, index) => (
                <NewsfeedCard
                    key={news.newsId || index}
                    news={news}
                    userRole={userRole}
                    userId={userId}
                    setNewsList={setNewsList}
                    />
                ))}
            </ul>
            {userRole === 'admin'&&(
                <form onSubmit={async (e) => { e.preventDefault();
                                                e.stopPropagation();
                                                try {
                                                    await postNews( null, newNews)  
                                                    setNewNews('');
                                                    
                                                    
                                                } catch (error) {
                                                    toast.error(`🫪 ${error instanceof Error ? error.message : "Fehler beim Posten des Newsbeitrags"}`);
                                                }
                                                }
                                                }>
                    <input type="text" placeholder="neuer Newsfeed Beitrag"  value={newNews}  onClick={(e)=> {e.stopPropagation();}}
                    onChange={(event) => {event.stopPropagation(); setNewNews(event.target.value)}} autoComplete="off"/>
                    <button type="submit" onClick={(e)=> {e.stopPropagation();}}><ModifyIcon className="modify-icon" aria-hidden="true"/>Newsfeed Beitrag posten</button>
                </form>
            )}
        </div>
    );
  }