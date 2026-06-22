
import { formatTimestamp, getRelativeTime } from '../utils/timeUtils';
import {CommentIcon, TrashIcon, LikeIcon, ModifyIcon, SendIcon} from '../icons/icons';
import { toast } from 'react-toastify/unstyled';


import { News } from '../types/News';
import { useDeleteNews } from '../hooks/useDeleteNews';

interface NewsfeedCardProperties {
  news: News;
  userRole: string;
  userId: number | null;
  setNewsList: React.Dispatch<React.SetStateAction<News[]>>;
}

export function NewsfeedCard ({ news, userRole, userId, setNewsList }: NewsfeedCardProperties){
  const{deleteNews}=useDeleteNews(setNewsList);
  return(
    
    <li className="newscard" onClick={(e)=>{e.stopPropagation();}}>
    
    <div className='newscard-header'>
      <div className='issue-author'>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <svg className="inline-icon" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 12c2.8 0 5-2.2 5-5s-2.2-5-5-5-5 2.2-5 5 2.2 5 5 5Zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5Z" />
          </svg>
          {news.userEmail || "Unbekannter Nutzer"}
        </span>
      </div>
    
      {/* Timestamp */}
      {news.created_at && (
        <div 
          title={formatTimestamp(news.created_at)} 
          style={{
            fontSize: '10px',
            color: 'var(--muted)',
            fontWeight: '400',
            cursor: 'help',
            zIndex: 10,
            fontStyle:'italic'
          }}
         >
          {getRelativeTime(news.created_at)}
        </div>
      )}
    </div>

    <hr style={{border:'none', borderRadius:'10px', height:'2px', backgroundColor:'#eee', boxShadow:'0 4px 6px -2px rgba(0,0,0,0.5)'}} />
    

    {/* Titel */}
    <h3 className="issue-title">{news.title}</h3>
    
    {/* Entweder Status mit Kommentar oder nur Kommentar */}
    {news.status === null ? (
      <p style={{fontSize: '12px'}}>{news.newskommentar}</p>
    ):(
      <div className='news-statusContainer'>{/* Status Anzeige */}
      <div className="status-container">
      <span className={`status-badge status-${news.status?.toLowerCase().replace(/\s/g, "-")}`}>
      {news.status}
      </span>
      
      </div>
      { news.statusComment &&(
        <span>
        Begründung für Status: {news.statusComment}
        </span>)}
        </div>
      )}
      
      
      {news.ort === null ?(
        <p></p>
      ) : (
        <div>
        {/* Standort des Mangels */}
        <p className="meta-line"><svg className="inline-icon" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5Z" /></svg>{news.ort || "Kein Ort angegeben"}</p>
        
        {/* Beschreibung  weggelassen, weil sonst alles zu voll*/}
        {/* <p className="issue-description">{issue.description}</p> */}
        </div>
      )}
      
      
      
      
      
    <hr style={{border:'none', borderRadius:'10px', height:'2px', backgroundColor:'#eee', boxShadow:'0 4px 6px -2px rgba(0,0,0,0.5)'}} />

      <div className="meta-line " style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', flexWrap: 'wrap', paddingBottom: '10px' }}>
      {/* Admin/Superadmin-button um News zu loeschen, nur sichtbar fuer Admins und Superadmins */}
      {(userRole === "admin" || userRole === "superadmin") && (
        <button style={{height:'25px', width:'50%', padding:'0px', marginRight:'6px'}} onClick={(e) => {e.stopPropagation(); if(news.newsId) deleteNews(news.newsId);}}><TrashIcon className="news-trash-icon" aria-hidden="true"/> {news.status === "Gelöscht" ? "Endgültig löschen" : "Löschen"}</button>
        /* Popup zur Bestätigung könnte hier noch ergänzt werden, damit nicht aus Versehen gelöscht wird. */
      )}
      
      </div>
      
      </li>
    );
  }