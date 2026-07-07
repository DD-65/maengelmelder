import { useState } from 'react';
import { Issue } from '../types/Issue';
import { formatTimestamp, getRelativeTime } from '../utils/timeUtils';
import { useUpdateStatus } from '../hooks/useUpdateStatus';
import { Kommentar } from './renderComment';
import { useSortedCommentList } from '../hooks/useSortedCommentList';
import { usePostComment } from '../hooks/usePostComments';
import { CommentIcon, TrashIcon, LikeIcon, ModifyIcon, SendIcon } from '../icons/icons';
import { toast } from 'react-toastify/unstyled';
import { usePostNews } from '../hooks/usePostNews';
import { useNewsList } from '../hooks/useNewsList';
import { News } from '../types/News';
import { IssueReactions } from './IssueReactions';
import { UserProfile } from './userProfile';

interface IssueCardProperties {
  issue: Issue;
  userRole: string;
  userId: number | null;
  userEmail: string;
  isRestricted: boolean;
  onDelete: (id: number) => void | Promise<void>;
  onReport: (id: number) => void;
  onToggleVote: (id: number) => void;
  onTogglePrivacy: (id: number, currentPrivacy: boolean) => void;
  isArchiveMode: boolean;
  setIssueList: React.Dispatch<React.SetStateAction<Issue[]>>;
  setNewsList: React.Dispatch<React.SetStateAction<News[]>>;
}

export function IssueCard({ issue, userRole, userId, userEmail, isRestricted, onDelete, onReport, onToggleVote, onTogglePrivacy, isArchiveMode, setIssueList, setNewsList }: IssueCardProperties) {
  const [newStatusComment, setNewStatusComment] = useState('');
  const [newStatus, setNewStatus] = useState(issue.status ?? '');
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const { sortedCommentList, setCommentList } = useSortedCommentList(issue, commentsOpen);
  const { updateStatus } = useUpdateStatus(isArchiveMode, setIssueList, setCommentList);
  const { postComment } = usePostComment(setCommentList);
  const commentCount = commentsOpen || sortedCommentList.length > 0 ? sortedCommentList.length : issue.commentCount || 0;
  const commentButtonText = commentCount === 0 ? "Kommentare" : `${commentCount} ${commentCount === 1 ? "Kommentar" : "Kommentare"}`;
  const [profileOpen, setProfileOpen] = useState<string | null>(null);

  const { postNews } = usePostNews(setNewsList);
  const [postAsNews, setPostAsNews] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAdminFormOpen, setIsAdminFormOpen] = useState(false);
  const [isStatusReasonOpen, setIsStatusReasonOpen] = useState(false);

  const handleFollowToggle = async () => {
    if (!issue.user_id) return;
    const isCurrentlyFollowed = Boolean(issue.is_author_followed);
    const url = `/api/users/${issue.user_id}/follow`;
    const method = isCurrentlyFollowed ? "DELETE" : "POST";
    try {
      const res = await fetch(url, { method });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Fehler beim Aktualisieren des Follow-Status");
      }
      toast.success(isCurrentlyFollowed ? `Entfolgt: ${issue.user_email}` : `Gefolgt: ${issue.user_email}`);

      setIssueList(prev => prev.map(item =>
        item.user_id === issue.user_id
          ? { ...item, is_author_followed: !isCurrentlyFollowed }
          : item
      ));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Aktion fehlgeschlagen");
    }
  };

  const hasVoted = Boolean(issue.has_voted);
  const isPrivate = Boolean(issue.is_private);
  const hasExpandableContent = (issue.description && issue.description.length > 30) || Boolean(issue.thumbnail_url || issue.image_url);

  return (
    <li className="card issue-card" key={issue.id} style={{ overflow: isAdminFormOpen ? 'visible' : 'hidden' }}>

      {/* Obere Zeile  mit Status, Titel und Erstellungszeitpunkt */}
      <div
        className="issue-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          paddingBottom: '12px',
          borderBottom: '1px solid var(--border)',
          marginBottom: '12px',
          position: 'relative'
        }}
      >
        {/* Clickable Status Badge links */}
        <div
          style={{
            position: 'relative',
            zIndex: 30,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '4px',
            maxWidth: '180px',
            textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              className={`status-badge status-${issue.status?.toLowerCase().replace(/\s/g, "-")}`}
              style={{
                cursor: (userRole === "admin" || userRole === "superadmin") ? 'pointer' : 'default',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title={issue.statusComment ? `Grund: ${issue.statusComment}` : "Kein Grund angegeben"}
              onClick={(e) => {
                if (userRole === "admin" || userRole === "superadmin") {
                  e.stopPropagation();
                  setNewStatus(issue.status ?? '');
                  setNewStatusComment('');
                  setIsAdminFormOpen(!isAdminFormOpen);
                }
              }}
            >
              {issue.status}
              {(userRole === "admin" || userRole === "superadmin") && (
                <ModifyIcon style={{ width: '12px', height: '12px', verticalAlign: 'middle', opacity: 0.8 }} />
              )}
            </span>

            {/* Info Button für Begründung */}
            {issue.statusComment && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsStatusReasonOpen(!isStatusReasonOpen);
                }}
                title={isStatusReasonOpen ? "Begründung ausblenden" : "Begründung anzeigen"}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  padding: 0,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 0,
                  boxShadow: 'none',
                  flexShrink: 0
                }}
              ><svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  style={{ display: 'block' }}
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" x2="12" y1="16" y2="12" />
                  <line x1="12" x2="12" y1="8" y2="8" />
                </svg></button>
            )}
          </div>
          {isStatusReasonOpen && issue.statusComment && (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', overflowWrap: 'anywhere', lineHeight: '1.2', marginTop: '2px' }}>
              {issue.statusComment}
            </span>
          )}

          {/* Admin-Formular direkt unter dem Badge */}
          {isAdminFormOpen && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (issue.id) {
                  try {
                    await updateStatus(issue.id, newStatus, newStatusComment);
                    toast.success("Status aktualisiert");
                    setNewStatusComment('');
                    setIsAdminFormOpen(false);
                    if (newStatus === 'Behoben' && postAsNews) {
                      await postNews(issue.id, null);
                    }
                  } catch (error) {
                    toast.error(`🫪 ${error instanceof Error ? error.message : "Fehler beim Aktualisieren des Status"}`);
                  }
                }
              }}
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '10px',
                boxShadow: 'var(--shadow-lg)',
                marginTop: '4px',
                width: '170px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                zIndex: 35
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-h)' }}>
                Status ändern
              </div>
              
              {/* Dropdown */}
              <select
                id="inline-status-select"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  fontSize: '12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  background: 'var(--surface-strong)',
                  color: 'var(--text)',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="Gemeldet">Gemeldet</option>
                <option value="Akzeptiert">Akzeptiert</option>
                <option value="Abgelehnt">Abgelehnt</option>
                <option value="In Bearbeitung">In Bearbeitung</option>
                <option value="Behoben">Behoben</option>
                <option value="Gelöscht">Gelöscht</option>
              </select>
              
              <input
                id="inline-status-comment"
                type="text"
                placeholder="Grund für Statusänderung"
                value={newStatusComment}
                required
                onChange={(e) => setNewStatusComment(e.target.value)}
                autoComplete="off"
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  fontSize: '12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  background: 'var(--surface-strong)',
                  color: 'var(--text)',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
              />

              {newStatus === 'Behoben' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="checkbox"
                    id="postAsNewsInline"
                    checked={postAsNews}
                    onChange={(e) => setPostAsNews(e.target.checked)}
                    style={{ cursor: 'pointer', margin: 0 }}
                  />
                  <label htmlFor="postAsNewsInline" style={{ fontSize: '11px', color: 'var(--text)', cursor: 'pointer', userSelect: 'none' }}>In News posten</label>
                </div>
              )}

              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => setIsAdminFormOpen(false)}
                  style={{
                    padding: '3px 8px',
                    fontSize: '11px',
                    borderRadius: '4px',
                    background: 'var(--surface-strong)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                    cursor: 'pointer'
                  }}
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '3px 8px',
                    fontSize: '11px',
                    borderRadius: '4px',
                    background: 'var(--accent)',
                    border: 'none',
                    color: 'white',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Speichern
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Titel in der Mitte */}
        <h3 className="issue-title" style={{ margin: 0, flex: 1, textAlign: 'center' }}>
          {issue.title}
        </h3>

        {/* timestamp rechts */}
        {issue.created_at ? (
          <div
            title={formatTimestamp(issue.created_at)}
            style={{
              fontSize: '12px',
              color: 'var(--muted)',
              fontWeight: '600',
              cursor: 'help'
            }}
          >
            {getRelativeTime(issue.created_at)}
          </div>
        ) : (
          <div style={{ width: '60px' }} />
        )}
      </div>

      {/* Transparenter Hintergrund zum Schließen */}
      {isAdminFormOpen && (
        <div
          onClick={() => setIsAdminFormOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 25,
            background: 'transparent',
            cursor: 'default'
          }}
        />
      )}

      {/* Privacy Symbol */}
      {isPrivate && (
        <div
          title="Privater Mangel"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '6px',
            borderRadius: '4px',
            background: 'var(--surface-strong)',
            color: 'var(--text)',
            marginBottom: '8px',
            cursor: 'help',
            width: 'max-content'
          }}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 10H2l2-6h16l2 6z"></path>
            <circle cx="6" cy="16" r="4"></circle>
            <circle cx="18" cy="16" r="4"></circle>
            <path d="M10 16h4"></path>
          </svg>
        </div>
      )}

      {/* Nutzername (email) */}
      <div className="meta-line issue-author" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <span 
            onClick={(e) => { 
              e.stopPropagation(); 
              if (issue.user_email) setProfileOpen(issue.user_email); 
            }}
            title="Nutzerprofil anzeigen"
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px', 
              cursor: 'pointer',
              textDecoration: 'underline',
              textDecorationColor: 'transparent',
              transition: 'text-decoration-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.textDecorationColor = 'var(--text-muted)'}
            onMouseLeave={(e) => e.currentTarget.style.textDecorationColor = 'transparent'}
          >
            {issue.user_profile_pic_url ? (
              <img 
                src={issue.user_profile_pic_url} 
                alt="Avatar" 
                style={{ width: '18px', height: '18px', borderRadius: '50%', objectFit: 'cover' }} 
              />
            ) : (
              <svg className="inline-icon" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 12c2.8 0 5-2.2 5-5s-2.2-5-5-5-5 2.2-5 5 2.2 5 5 5Zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5Z" />
              </svg>
            )}
            
            {issue.user_username || (issue.user_email ? issue.user_email.split('@')[0] : "Unbekannter Nutzer")}
          </span>
        {userId && issue.user_id && issue.user_id !== userId && (
          <button
            className={`follow-btn-transparent ${issue.is_author_followed ? 'followed' : 'not-followed'}`}
            onClick={(e) => {
              e.stopPropagation();
              handleFollowToggle();
            }}
            title={issue.is_author_followed ? "Entfolgen" : "Folgen"}
            style={{
              marginLeft: '6px'
            }}
          >{issue.is_author_followed ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="16" x2="22" y1="11" y2="11" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" x2="19" y1="8" y2="14" />
                <line x1="16" x2="22" y1="11" y2="11" />
              </svg>
            )}</button>
        )}
      </div>

      {/* Kategorie des Mangels */}
      <p className="meta-line" style={{ marginBottom: '4px' }}>
        <svg className="inline-icon" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M20 5h-7.586l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2z" />
        </svg>
        {issue.kategorie || "Keine Kategorie angegeben"}
      </p>

      {/* Standort des Mangels */}
      <p className="meta-line"><svg className="inline-icon" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5Z" /></svg>{issue.location || "Kein Ort angegeben"}</p>

      {/* Beschreibung */}
      {issue.description && issue.description.trim() && (
        <p className="issue-description" style={{ margin: '10px 0 6px 0' }}>
          {issue.description.length > 30 && !isExpanded
            ? `${issue.description.slice(0, 30)}...`
            : issue.description}
        </p>
      )}

      {/* einklappen/ausklappen anzeigen wenn Inhalt zum Ausklappen vorhanden ist */}
      {hasExpandableContent && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          margin: '0 0 10px 0',
          fontSize: '12px'
        }}>
          {/* Symbol wenn Bild vorhanden ist und Karte nicht ausgeklappt */}
          {!isExpanded && (issue.thumbnail_url || issue.image_url) && (
            <span
              title="Bild vorhanden"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '4px',
                borderRadius: '4px',
                background: 'var(--surface-strong)',
                border: '1px solid var(--border)',
                color: 'var(--text-muted)'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </span>
          )}

          {/* Ein-/Ausklappen Trigger Link */}
          <span
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            style={{
              color: 'var(--accent)',
              cursor: 'pointer',
              fontWeight: '700',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              userSelect: 'none',
              padding: '2px 0'
            }}
          >
            {isExpanded ? (
              <>
                Einklappen
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="18 15 12 9 6 15" />
                </svg>
              </>
            ) : (
              <>
                Ausklappen
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </>
            )}
          </span>
        </div>
      )}

      {/* Image */}
      {(issue.thumbnail_url || issue.image_url) && isExpanded && (
        <div style={{ marginTop: '10px' }}>
          <img src={issue.thumbnail_url || issue.image_url!} alt={issue.title} style={{ width: "100%", height: "350px", objectFit: "contain", backgroundColor: "var(--surface-strong)", display: "block", borderRadius: "8px", marginTop: "10px", border: "1px solid var(--border)", margin: "12px auto 0" }} />
        </div>
      )}

      {/* Container fuer Voting-zeug */}
      <div className="issue-actions">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Knopf für Öffnen und Schließen der Kommentarspalte */}
          <button
            className={`kommentareoeffnen ${commentsOpen ? 'comments-active' : ''}`}
            title={commentButtonText}
            aria-label={commentButtonText}
            onClick={(e) => { e.stopPropagation(); setCommentsOpen(!commentsOpen) }}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <CommentIcon className="comment-icon" aria-hidden="true" />
            <span>{commentCount}</span>
          </button>

          {/* Button for toggling privacy */}
          {userEmail === issue.user_email && (
            <button
              title={isPrivate ? "Öffentlich machen" : "Privat machen"}
              aria-label={isPrivate ? "Öffentlich machen" : "Privat machen"}
              onClick={(e) => { e.stopPropagation(); if (issue.id) onTogglePrivacy(issue.id, isPrivate); }}
            >
              <svg className="privacy-icon" style={{ verticalAlign: 'middle' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {isPrivate
                  ? <><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></> /* Unlocked icon */
                  : <><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></> /* Locked icon */
                }
              </svg>
            </button>
          )}

          {/* Button zum Melden */}
          {userId && (
            <button
              title="Mangel melden"
              aria-label="Mangel melden"
              onClick={(e) => { e.stopPropagation(); if (issue.id) onReport(issue.id); }}
            >
              <svg className="report-icon" style={{ verticalAlign: 'middle' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
                <line x1="4" y1="22" x2="4" y2="15"></line>
              </svg>
            </button>
          )}

          {/* Admin/Superadmin-button um Mangel zu loeschen, nur sichtbar fuer Admins und Superadmins */}
          {(userRole === "admin" || userRole === "superadmin") && (
            <button
              title={issue.status === "Gelöscht" ? "Endgültig löschen" : "Löschen"}
              aria-label={issue.status === "Gelöscht" ? "Endgültig löschen" : "Löschen"}
              onClick={(e) => { e.stopPropagation(); if (issue.id) onDelete(issue.id); }}
            >
              <TrashIcon className="trash-icon" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Voting & Reactions Group */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <IssueReactions issue={issue} userId={userId} setIssueList={setIssueList} />
          {/* Vote-button ist nur aktiv, wenn man eingeloggt ist, ansonsten disabled */}
          {userId ? (
            <button
              className={`kommentareoeffnen vote-btn ${hasVoted ? "voted-button" : ""}`}
              title={hasVoted ? "Stimme zurückziehen" : "Stimme abgeben"}
              aria-label={hasVoted ? "Stimme zurückziehen" : "Stimme abgeben"}
              onClick={(e) => { e.stopPropagation(); if (issue.id) onToggleVote(issue.id); }}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <LikeIcon className={hasVoted ? 'liked-icon-active' : 'like-icon'} aria-hidden="true" />
              <span>{issue.votes || 0}</span>
            </button>
          ) : (
            <button
              disabled
              className="kommentareoeffnen vote-btn"
              title="Einloggen um abzustimmen"
              aria-label="Einloggen um abzustimmen"
              onClick={(e) => e.stopPropagation()}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <LikeIcon className="like-icon" aria-hidden="true" />
              <span>{issue.votes || 0}</span>
            </button>
          )}
        </div>
      </div>

      {commentsOpen === true && (
        <div className="comment-section swipe-ignore" onClick={(e) => e.stopPropagation()}>
          {userId ? (
            <form className='neuerkommentar'
              onSubmit={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (isRestricted) {
                  toast.error("🫪 Dein Konto ist eingeschränkt. Du kannst keine Kommentare schreiben.");
                  return;
                }
                if (issue.id) {
                  try {
                    await postComment(issue.id, newComment);
                    toast.success("Kommentar gepostet");
                    setNewComment('');
                  } catch (error) {
                    toast.error(`🫪 ${error instanceof Error ? error.message : "Fehler beim Abschicken des Kommentars"}`);
                  }
                }
              }}>
              <input type="text" placeholder="Hier Kommentar schreiben" required value={newComment} onClick={(e) => { e.stopPropagation(); }}
                disabled={isRestricted}
                onChange={(event) => { event.stopPropagation(); if (issue.id) { setNewComment(event.target.value) } }} autoComplete="off" />
              <button type="submit" onClick={(e) => { e.stopPropagation(); }}>Abschicken<SendIcon className="send-icon" aria-hidden="true" /></button>
            </form>
          ) : (
            <span>Einloggen um selbst Kommentare zu schreiben</span>
          )}

          {/* Kommentare ganz unten im Issue anzeigen */}
          <ul className='commentList'>
            {sortedCommentList.map((comment) => (
              <Kommentar
                setCommentList={setCommentList}
                issue={issue}
                commentId={comment.commentId}
                userEmail={userEmail}
                userRole={userRole}
                key={comment.commentId}
                commentStatus={comment.status}
                commentInhalt={comment.kommentar}
                commentKommentator={comment.userEmail}
                commentTimestamp={comment.timestamp}
                userUsername={comment.userUsername}
                userProfilePicUrl={comment.userProfilePicUrl}
              />
            ))}
          </ul>
        </div>
      )}
        <UserProfile 
          email={profileOpen} 
          onClose={() => setProfileOpen(null)} 
          currentUserEmail={userEmail}
        />
    </li>
  );
}
