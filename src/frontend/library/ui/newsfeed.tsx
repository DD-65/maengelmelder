
import { NewsfeedCard } from './newsfeedCard';
import { useLoadNews } from '../hooks/useLoadNews';
import { News } from '../types/News';
import { useState, useEffect } from 'react';
import { usePostNews } from '../hooks/usePostNews';
import { toast } from 'react-toastify';
import { ModifyIcon } from '../icons/icons';

interface NewsfeedProperties {
  userRole: string;
  userId: number | null;
  newsList: News[];
  setNewsList: React.Dispatch<React.SetStateAction<News[]>>;
}

export function Newsfeed({  userRole, userId, newsList, setNewsList}: NewsfeedProperties){
    const[newNews, setNewNews] = useState('');
    const[newsTitle, setNewsTitle] = useState('');
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

    const sidebarHeaderStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '16px',
        color: 'var(--text-h)',
        paddingLeft: '10px',
        
    };
    const sidebarCardStyle: React.CSSProperties = {
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '14px',
        paddingLeft: '4px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        margin: '0%',
      };
    return (
        <div className='sidebar-content'>
                    
        <div style={sidebarCardStyle}>
        <h3 style={sidebarHeaderStyle}>Neuigkeiten</h3>
        {/* <div className='newsfeedContainer' onClick={(e)=>{e.stopPropagation();}}> */}

            {(userRole === 'admin' || userRole === 'superadmin') &&(
                <form className='newsfeedposting' onSubmit={async (e) => { e.preventDefault();
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
                    onChange={(event) => {event.stopPropagation(); setNewNews(event.target.value)}} autoComplete="off" required />
                    
                    <button type="submit" onClick={(e)=> {e.stopPropagation();}}><ModifyIcon className="modify-icon" aria-hidden="true"/>News posten</button>
                </form>
            )}
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
        </div>
        </div>
    );
  }