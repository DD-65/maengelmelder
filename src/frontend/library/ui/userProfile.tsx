import { createPortal } from 'react-dom';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { getUserColor, getSecondaryUserColor } from '../utils/getUserColor';

interface UserProfileProps {
  email: string | null;
  onClose: () => void;
  currentUserEmail?: string | null;
  currentUserShowOnLeaderboard?: boolean;
  onLogout?: () => void;
  onProfileUpdate?: (newUsername: string | null, newPicUrl: string | null) => void;
  onLeaderboardPreferenceChange?: (showOnLeaderboard: boolean) => boolean | Promise<boolean>;
  onFollowChange?: () => void;
}

type UserProfileData = {
  id: number;
  email: string;
  username: string | null;
  profile_pic_url: string | null;
  role: string;
  email_verified_at: string | null;
  isFollowed: number | boolean;
  showOnLeaderboard?: number | boolean;
  issuesReported?: number | string;
  likesGiven?: number | string;
  commentsWritten?: number | string;
  reactionsGiven?: number | string;
};

type ProfileUpdateResponse = {
  error?: string;
  username: string | null;
  profilePicUrl?: string | null;
};

type ProfileState = {
  email: string | null;
  data: UserProfileData | null;
};

type ProfileView = "profile" | "leaderboard";
type LeaderboardCategory = "reported" | "reportedSolved";

type LeaderboardEntry = {
  place: number;
  userId: number;
  email: string;
  username: string | null;
  score: number;
};

type LeaderboardData = {
  category: LeaderboardCategory;
  top: LeaderboardEntry[];
  currentUserEntry: LeaderboardEntry | null;
  currentUserOptedIn: boolean;
};

const leaderboardLabels: Record<LeaderboardCategory, string> = {
  reported: "Gemeldete Mängel",
  reportedSolved: "Gemeldet & behoben",
};

function formatCount(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function getDisplayName(entry: Pick<LeaderboardEntry, "email" | "username">) {
  return entry.username || entry.email.split('@')[0];
}

function isOwnEntry(entry: LeaderboardEntry, currentUserEmail?: string | null) {
  return Boolean(currentUserEmail && entry.email === currentUserEmail);
}

export function UserProfile({
  email,
  onClose,
  currentUserEmail,
  currentUserShowOnLeaderboard = true,
  onLogout,
  onProfileUpdate,
  onLeaderboardPreferenceChange,
  onFollowChange,
}: UserProfileProps) {
  const [profileState, setProfileState] = useState<ProfileState>({ email: null, data: null });
  const [profileView, setProfileView] = useState<ProfileView>("profile");
  const [leaderboardCategory, setLeaderboardCategory] = useState<LeaderboardCategory>("reported");
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const isOwnProfile = email === currentUserEmail;
  const userData = profileState.data;
  const isLoading = Boolean(email && profileState.email !== email);

  const loadLeaderboard = useCallback(async (category: LeaderboardCategory = leaderboardCategory) => {
    setIsLeaderboardLoading(true);

    try {
      const res = await fetch(`/api/leaderboard?category=${category}`);
      const data = await res.json() as LeaderboardData;

      if (!res.ok) {
        throw new Error("Bestenliste konnte nicht geladen werden");
      }

      setLeaderboardData(data);
    } catch {
      setLeaderboardData(null);
      toast.error("🫪 Bestenliste konnte nicht geladen werden");
    } finally {
      setIsLeaderboardLoading(false);
    }
  }, [leaderboardCategory]);

  useEffect(() => {
    if (!email) return;
    let ignoreResult = false;

    fetch(`/api/users/profile/${encodeURIComponent(email)}`)
      .then(res => res.ok ? res.json() as Promise<UserProfileData> : null)
      .then(data => {
        if (ignoreResult) return;
        setProfileState({ email, data });
        setEditUsername(data?.username || "");
      })
      .catch(() => {
        if (ignoreResult) return;
        setProfileState({ email, data: null });
      });

    return () => {
      ignoreResult = true;
    };
  }, [email]);

  if (!email) return null;

  const handleFollowToggle = async () => {
    if (!userData) return;
    const method = userData.isFollowed ? "DELETE" : "POST";
    try {
      const res = await fetch(`/api/users/${userData.id}/follow`, { method });
      if (res.ok) {
        setProfileState((current) => current.data ? {
          ...current,
          data: { ...current.data, isFollowed: current.data.isFollowed ? 0 : 1 },
        } : current);
        toast.success(userData.isFollowed ? "Entfolgt!" : "Gefolgt!");
        onFollowChange?.();
      }
    } catch {
      toast.error("Fehler beim Folgen");
    }
  };

  const saveProfile = async () => {
    if (!userData) return;

    const formData = new FormData();
    formData.append("username", editUsername);
    if (fileInputRef.current?.files?.[0]) {
      formData.append("image", fileInputRef.current.files[0]);
    }

    try {
      const res = await fetch("/api/auth/profile", { method: "PATCH", body: formData });
      const data = await res.json() as ProfileUpdateResponse;
      if (!res.ok) throw new Error(data.error || "Fehler beim Speichern des Profils");

      toast.success("Profil gespeichert!");

      setProfileState((current) => current.data ? {
        ...current,
        data: {
          ...current.data,
          username: data.username,
          profile_pic_url: data.profilePicUrl || current.data.profile_pic_url,
        },
      } : current);
      setEditMode(false);
      setPreviewUrl(null);
      if (onProfileUpdate) onProfileUpdate(data.username, data.profilePicUrl || userData.profile_pic_url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Fehler beim Speichern des Profils");
    }
  };

  const openLeaderboard = () => {
    setProfileView("leaderboard");
    void loadLeaderboard();
  };

  const chooseLeaderboardCategory = (category: LeaderboardCategory) => {
    setLeaderboardCategory(category);
    void loadLeaderboard(category);
  };

  const toggleLeaderboardPreference = async (nextValue: boolean) => {
    const saved = await onLeaderboardPreferenceChange?.(nextValue);
    if (saved === false) return;

    setProfileState((current) => current.data && isOwnProfile ? {
      ...current,
      data: { ...current.data, showOnLeaderboard: nextValue },
    } : current);
    if (profileView === "leaderboard") {
      void loadLeaderboard();
    }
  };

  const renderLeaderboardEntry = (entry: LeaderboardEntry) => (
    <li
      key={entry.userId}
      className={`leaderboard-entry ${isOwnEntry(entry, currentUserEmail) ? "is-current-user" : ""}`}
    >
      <span className="leaderboard-place">{entry.place}.</span>
      <span className="leaderboard-name">{getDisplayName(entry)}</span>
      <span className="leaderboard-score">{entry.score}</span>
    </li>
  );

  const currentUserBelowTop =
    leaderboardData?.currentUserEntry &&
    !leaderboardData.top.some((entry) => entry.userId === leaderboardData.currentUserEntry?.userId);

  return createPortal(
    <div className="modal-overlay" onClick={(e) => { e.stopPropagation(); onClose(); }}>
      <div className="modal-pane profile-modal-pane swipe-ignore" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header profile-modal-header">
          {profileView === "leaderboard" ? (
            <button className="profile-back-button" type="button" aria-label="Zurück zum Profil" onClick={() => setProfileView("profile")}>
              ←
            </button>
          ) : (
            <span className="profile-header-spacer" aria-hidden="true" />
          )}
          <h3>{profileView === "leaderboard" ? "Bestenliste" : (isOwnProfile ? "Mein Profil" : "Nutzerprofil")}</h3>
          <button className="modal-close-btn" onClick={onClose}>X</button>
        </div>

        {isLoading ? (
          <p className="meta-line">Lade Profil...</p>
        ) : !userData ? (
          <p className="error-text">Nutzer nicht gefunden.</p>
        ) : profileView === "leaderboard" ? (
          <div className="modal-content profile-modal-content leaderboard-view">
            <div className="leaderboard-tabs" role="tablist" aria-label="Bestenlisten-Kategorie">
              {(Object.keys(leaderboardLabels) as LeaderboardCategory[]).map((category) => (
                <button
                  key={category}
                  type="button"
                  className={`leaderboard-tab ${leaderboardCategory === category ? "is-active" : ""}`}
                  onClick={() => chooseLeaderboardCategory(category)}
                >
                  {leaderboardLabels[category]}
                </button>
              ))}
            </div>

            {onLeaderboardPreferenceChange && (
              <div className="leaderboard-switch-row">
                <span>Auf Bestenlisten erscheinen</span>
                <input
                  className="native-toggle"
                  type="checkbox"
                  checked={currentUserShowOnLeaderboard}
                  onChange={(event) => { void toggleLeaderboardPreference(event.target.checked); }}
                />
              </div>
            )}

            {isLeaderboardLoading ? (
              <p className="meta-line">Bestenliste wird geladen...</p>
            ) : !leaderboardData ? (
              <p className="error-text">Bestenliste konnte nicht geladen werden.</p>
            ) : (
              <>
                <ol className="leaderboard-list">
                  {leaderboardData.top.map(renderLeaderboardEntry)}
                </ol>

                {currentUserBelowTop && leaderboardData.currentUserEntry && (
                  <>
                    <div className="leaderboard-dots" aria-hidden="true">...</div>
                    <ol className="leaderboard-list">
                      {renderLeaderboardEntry(leaderboardData.currentUserEntry)}
                    </ol>
                  </>
                )}

                {!leaderboardData.currentUserOptedIn && (
                  <p className="leaderboard-note">Du erscheinst aktuell nicht auf Bestenlisten.</p>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="modal-content profile-modal-content">
            <div style={{ position: 'relative' }}>
              {(previewUrl || userData.profile_pic_url) ? (
                <img
                  src={previewUrl || userData.profile_pic_url}
                  alt="Profile"
                  style={{ width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }}
                />
              ) : (
                <div style={{ width: '90px', height: '90px', borderRadius: '50%', backgroundColor: getUserColor(userData.email), color: getSecondaryUserColor(userData.email), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', fontWeight: 'bold', border: '2px solid var(--border)' }}>
                  {userData.email.charAt(0).toUpperCase()}
                </div>
              )}

              {isOwnProfile && editMode && (
                <>
                  <button onClick={() => fileInputRef.current?.click()} style={{ position: 'absolute', bottom: 0, right: 0, padding: '6px', borderRadius: '50%', background: 'var(--accent)', color: 'white', border: 'none', cursor: 'pointer' }}>📸</button>

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setPreviewUrl(URL.createObjectURL(e.target.files[0]));
                      }
                    }}
                  />
                </>
              )}
            </div>

            {isOwnProfile && editMode ? (
              <input type="text" value={editUsername} onChange={e => setEditUsername(e.target.value)} placeholder="Dein neuer Benutzername..." style={{ textAlign: 'center', width: '100%' }} />
            ) : (
              <div style={{ textAlign: 'center' }}>
                <h4 style={{ margin: 0, fontSize: '22px', color: 'var(--text-h)', wordBreak: 'break-all' }}>
                  {userData.username || userData.email.split('@')[0]}
                </h4>
                {userData.username && <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>{userData.email}</p>}
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
              <div className={`verification-badge ${userData.email_verified_at ? "is-verified" : "is-unverified"}`}>{userData.email_verified_at ? "Verifiziert" : "Nicht verifiziert"}</div>
              <div style={{ fontSize: '11px', padding: '4px 10px', border: '2px solid var(--border)', borderRadius: '999px', backgroundColor: 'var(--surface)', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                {userData.role === "superadmin" ? <span style={{ color: 'orange' }}>Superadmin</span> : (userData.role === "admin" ? "Admin" : "User")}
              </div>
            </div>

            <div className="account-stats-row">
              <button className="leaderboard-icon-button" type="button" aria-label="Bestenliste öffnen" onClick={openLeaderboard}>
                <span className="podium-icon" aria-hidden="true">
                  <span className="podium-step podium-second">2</span>
                  <span className="podium-step podium-first">1</span>
                  <span className="podium-step podium-third">3</span>
                </span>
              </button>
              <ul className="account-stats">
                <li>{formatCount(Number(userData.issuesReported) || 0, "Mangel", "Mängel")} gemeldet</li>
                <li>{formatCount(Number(userData.likesGiven) || 0, "Like", "Likes")} vergeben</li>
                <li>{formatCount(Number(userData.commentsWritten) || 0, "Kommentar", "Kommentare")} verfasst</li>
                <li>{Number(userData.reactionsGiven) || 0} mal reagiert</li>
              </ul>
            </div>

            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
              {isOwnProfile ? (
                editMode ? (
                  <button onClick={saveProfile} style={{ background: 'var(--accent)', color: 'white' }}>Speichern</button>
                ) : (
                  <>
                    <button onClick={() => setEditMode(true)}>Profil bearbeiten</button>
                    {onLogout && <button className='logout-button' onClick={onLogout}>Logout</button>}
                  </>
                )
              ) : (
                <button onClick={handleFollowToggle} style={{ background: userData.isFollowed ? 'transparent' : 'var(--accent)', color: userData.isFollowed ? 'var(--text)' : 'white', border: `1px solid ${userData.isFollowed ? 'var(--border)' : 'var(--accent)'}` }}>
                  {userData.isFollowed ? "Entfolgen" : "Folgen"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
