import { useState } from 'react';
import { Issue } from '../types/Issue';
import { useUpdateStatus } from '../hooks/useUpdateStatus';
import { Kommentar } from './renderComment';
import { useSortedCommentList } from '../hooks/useSortedCommentList';
import { usePostComment } from '../hooks/usePostComments';

interface IssueCardProperties {
  issue: Issue;
  userRole: string;
  userId: number | null;
  userEmail: string;
  onDelete: (id: number) => void;
  onUpvote: (id: number) => void;
  isArchiveMode: boolean;
  setIssueList: React.Dispatch<React.SetStateAction<Issue[]>>;
}

export function IssueCard({ issue, userRole, userId, userEmail, onDelete, onUpvote, isArchiveMode, setIssueList }: IssueCardProperties) {
  const [expandedImageId, setExpandedImageId] = useState<number | null>(null);
  const [newStatusComment, setNewStatusComment]= useState('');
  const [newStatus, setNewStatus] = useState(issue.status ?? '');
  const [commentsOpen, setCommentsOpen]= useState(false);
  const [newComment, setNewComment] = useState('');
  const{sortedCommentList, setCommentList} = useSortedCommentList(issue);
  const{updateStatus}=useUpdateStatus(isArchiveMode, setIssueList, setCommentList);
  const{postComment}=usePostComment(setCommentList);

  function toggleImage(id: number) {
    setExpandedImageId(prevId => (prevId === id ? null : id));
  }
  const hasVoted = Boolean(issue.has_voted);

    return (
      // makes the whole issue card clickable, but only if there is an image to show
      <li className="card issue-card" key={issue.id} onClick={() => {if (issue.id && issue.image_url) toggleImage(issue.id)}}>
        {/* Nutzername (email) */}
        <p className="meta-line issue-author"><svg className="inline-icon" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 12c2.8 0 5-2.2 5-5s-2.2-5-5-5-5 2.2-5 5 2.2 5 5 5Zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5Z" /></svg>{issue.user_email || "Unbekannter Nutzer"}</p>

        {/* ID des Mangels
        <div className="issue-index">{issue.id}</div> */}

        {/* Titel */}
        <h3 className="issue-title">{issue.title}</h3>

        {/* Status Anzeige */}
        <div className="status-container">
          <span className={`status-badge status-${issue.status?.toLowerCase().replace(/\s/g, "-")}`}>
            {issue.status}
          </span>

          {/* Admin-Steuerung fuer den Status */}
          {userRole === "admin" && (
            <form onSubmit={(e) => { e.preventDefault();
                                      e.stopPropagation();
                                      issue.id && updateStatus(issue.id, newStatus, newStatusComment);
                                      setNewStatusComment('')}}>
              <select
                className="status-select"
                value={newStatus}
                /* Stops card from expanding when dropdown menu is clicked */
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => issue.id && setNewStatus(e.target.value)}//nUpdateStatus(issue.id, e.target.value)
              >
                <option value="Gemeldet">Gemeldet</option>
                <option value="Akzeptiert">Akzeptiert</option>
                <option value="Abgelehnt">Abgelehnt</option>
                <option value="In Bearbeitung">In Bearbeitung</option>
                <option value="Behoben">Behoben</option>
                <option value="Gelöscht">Gelöscht</option>
              </select><br/>
              <input type="text" placeholder="Grund für Statusänderung"  value={newStatusComment}  onClick={(e)=> {e.stopPropagation();}}
                onChange={(event) => {event.stopPropagation(); issue.id && setNewStatusComment(event.target.value)}} autoComplete="off"/>
              <button type="submit" onClick={(e)=> {e.stopPropagation();}}>Status ändern</button>
            </form>
             )}
        </div>
        <span>
            Begründung für Status: {issue.statusComment}
        </span>

        {/* Standort des Mangels */}
        <p className="meta-line"><svg className="inline-icon" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5Z" /></svg>{issue.location || "Kein Ort angegeben"}</p>

        {/* Beschreibung */}
        <p className="issue-description">{issue.description}</p>

        {/* Image */}
        {(issue.thumbnail_url || issue.image_url) && (
          <div style={{ marginTop: '10px' }}>
            {/* Image hint if not expanded */}
            {expandedImageId !== issue.id && (
              <p style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 'bold', marginTop: '8px' }}>Tippen um das Bild zu sehen</p>
            )}
            {/* Loading of Image if expanded */}
            {expandedImageId === issue.id && (
              <img src={issue.thumbnail_url || issue.image_url!} alt={issue.title} style={{width: "100%", height: "350px", objectFit: "contain", backgroundColor: "var(--surface-strong)", display: "block", borderRadius: "8px", marginTop: "10px", border: "1px solid var(--border)", margin: "12 px auto 0"}}/>
            )}
          </div>
        )}

        {/* Container fuer Voting-zeug */}
        <div className="issue-actions">
          <p>Likes: {issue.votes || 0}</p>
          <p>Kategorie: {issue.kategorie || '-'}</p>

          {/* Knopf für Öffnen und Schließen der Kommentarspalte */}
          <span className='kommentarknoepfe'>
            <button className='kommentareoeffnen' onClick={(e)=> {e.stopPropagation(); setCommentsOpen(!commentsOpen)}}>Kommentare</button>
            {/* <button className='neuenkommentaroeffnen' onClick={()=> {setNewCommentOpen(!newCommentOpen)}}>+</button> onUpdateComment: (id: number, comment: string) => void; */}
          </span>

          {/* Admin-button um Mangel zu loeschen, nur sichtbar fuer Admins */}
          {userRole === "admin" && (
            <button onClick={(e) => {e.stopPropagation(); if(issue.id) onDelete(issue.id);}}> {issue.status === "Gelöscht" ? "Meldung endgültig löschen" : "Meldung Löschen"}</button>
            /* Popup zur Bestätigung könnte hier noch ergänzt werden, damit nicht aus Versehen gelöscht wird. */
          )}
          {/* Vote-button ist nur aktiv, wenn man eingeloggt ist, ansonsten disabled */}
          {userId ? (
            <button className={hasVoted ? "voted-button" : undefined} disabled={hasVoted} onClick={(e) => { e.stopPropagation(); if (issue.id) onUpvote(issue.id); }}>{hasVoted ? "Geliked" : "Liken"}</button>
          ) : (
            <button disabled onClick={(e) => e.stopPropagation()}>Like</button>
          )}

        </div>

          {commentsOpen === true &&(
          userId ? (
            <form className='neuerkommentar'
                    onSubmit={(e) => { e.preventDefault();
                                      e.stopPropagation();
                                      if(issue.id){
                                        postComment(issue.id, newComment);
                                      }
                                      setNewComment('')}}>
              <input type="text" placeholder="Hier Kommentar schreiben"  value={newComment} onClick={(e)=> {e.stopPropagation();}}
                onChange={(event) => {event.stopPropagation(); issue.id && setNewComment(event.target.value)}} autoComplete="off"/>
              <button type="submit" onClick={(e)=> {e.stopPropagation();}}>Abschicken</button>
            </form>
          ):(<span>Einloggen um selbst Kommentare zu schreiben</span>))}
        
        {/* Kommentare ganz unten im Issue anzeigen */}
          {commentsOpen === true &&(
            <ul className='commentList'>
              {sortedCommentList.map((comment, index) => ( 
                      <Kommentar
                          setCommentList={setCommentList}
                          issue={issue}
                          commentId={comment.commentId}
                          userEmail={userEmail}
                          userRole={userRole}
                          key={index} //irgendwie sinnlos, in Issue card aber auch so
                          commentStatus={comment.status}
                          commentInhalt={comment.kommentar}
                          commentKommentator={comment.userEmail}
                      />
              ))}
            </ul>)}
      </li>
    );
  }