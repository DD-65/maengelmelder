import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Konstanten und random U's importieren
import {rooms}  from './library/constants/rooms';
import {buildingCoordinates} from './library/constants/buildingCoordinates';
import {randomRptuLogo} from './library/utils/rptulogo';

// input importieren
import { useInput } from './library/hooks/useInput';
// suche importieren
import { useSearch } from './library/ui/search';
import { Searchbar } from './library/ui/searchbar';

// issue components importieren
import {Issue} from './library/types/Issue';
import { useIssueList } from './library/hooks/useIssueList';
import { IssueCard } from './library/ui/renderIssueCard';

// swiping & teile von Map
import { useViewMode } from './library/hooks/useViewMode';
import { useSwiping } from './library/hooks/useSwiping';

// Filter importieren
import { useFilter } from './library/hooks/useFilter';
import { useArchiveMode } from './library/hooks/useArchiveMode';
// Sortierung importieren
import { useSorting } from './library/hooks/useSorting';


import { useVerificationMessage } from './library/hooks/useVerificationMessage'; //kürzt unten um 1 Zeile, also insgesamt sinnlos
//    Vielleicht ist es aber später nützlich, sobald wir irgendeinen Teil der Verifikation auslagern


import { Reportunfall } from './library/ui/rptulogoui'; // for Fun eine Zeile durch zwei ersetzt, aber macht den html teil übersichtlicher

export default function App() {
  // Input
  const{title, setTitle,description, setDescription, location, setLocation, kategorie, setKategorie, image, setImage}=useInput();
  // const [title, setTitle] = useState('');
  // const [description, setDescription] = useState('');
  // const [location, setLocation] = useState('');
  // const [kategorie, setKategorie] = useState('');
  // const [image, setImage] = useState<File | null>(null);
  const filteredRooms = rooms.filter(room => room.toLowerCase().includes(location.toLowerCase()));

  // List of issues
  const {issueList, setIssueList} = useIssueList(); //so müsste es richtig sein
  //const [issueList, setIssueList] = useState<Issue[]>([]);

  // State of Image Expansion
  // const [expandedImageId, setExpandedImageId] = useState<number | null>(null);

  // Toggle Image Expansion
  //const toggleImage = (id: number) => {                       --> liegt in renderIssueCard.tsx
  //  setExpandedImageId(prevId => (prevId === id ? null : id));
  //};

  // State of Viewing (List or Map)
  const {viewMode, setViewMode} = useViewMode();
  
  // Archiv-Modus
  const {isArchiveMode, setIsArchiveMode} = useArchiveMode();

  // Swiping using view mode
  const {handleTouchStart, handleTouchEnd}=useSwiping(setViewMode);
  
  //Bool für Filter "nur eigene Mängel anzeigen"
  const [filterOnlyOwnIssues, setFilterOnlyOwnIssues] = useState(false);


  // // Variablen fuer Filter und Filterwerte + Funktionen um diese zu setten
  const{currentFilter, setCurrentFilter, currentFilterValue, setCurrentFilterValue, possibleFilters}=useFilter();
  // const [currentFilter, setCurrentFilter] = useState("");
  // const [currentFilterValue, setCurrentFilterValue] = useState("");
  // const possibleFilters = [
  //   "Kategorie",
  //   "Ort",
  //   //"User", war nicht gefordert, dann eben nicht.
  //   "Status",

  // ];
  const possibleFilterValues: Record<string, string[]> = {
    Kategorie: Array.from(new Set(issueList.map(issue => issue.kategorie).filter((x): x is string => Boolean(x)))),
    Ort: Array.from(new Set(issueList.flatMap(issue => {
      if (!issue.location) return [];
      const building = issue.location.split(/[-\s/\\._]+/)[0];
      return [building, issue.location]; // Returns both "46" and "46-210"
    }))).sort(),
    User: Array.from(new Set(issueList.map(issue => issue.user_email).filter((x): x is string => Boolean(x)))),
    Status: Array.from(new Set(issueList.map(issue => issue.status).filter((x): x is string => Boolean(x)))),
  };

  // dedizierte Funktionen um nur gueltige Filter und Werte setzbar zu machen
  function chooseFilterFromPossibleFilters(chosenFilter: string) {
    if (possibleFilters.includes(chosenFilter)) {
      setCurrentFilter(chosenFilter);
    } else {
      setCurrentFilter("");
    }
    setCurrentFilterValue("");
  }

  function chooseFilterValueFromPossibleValues(filter: string, chosenValue: string) {
    if (possibleFilterValues[filter]?.includes(chosenValue)) {
      setCurrentFilterValue(chosenValue);
    } else {
      setCurrentFilterValue("");
    }
  }

// Variablen und Funktionen für Sortierung
const{currentSorting, setCurrentSorting, currentSortingMode, setCurrentSortingMode, possibleSortings, possibleSortingModes}=useSorting();
  // const [currentSorting, setCurrentSorting] = useState("");
  // const [currentSortingMode, setCurrentSortingMode] = useState("");
  // const possibleSortings = [
  //   "Votes",
  //   "Erstellungsdatum",
  //   "Status"
  // ];
  // const possibleSortingModes: Record<string, string[]> = {
  //   Votes: ["Aufsteigend", "Absteigend"],
  //   Erstellungsdatum: ["Neueste zuerst", "Älteste zuerst"],
  //   Status: ["Aufsteigend", "Absteigend"]
  // };

    // dedizierte Funktionen um nur gueltige Filter und Werte setzbar zu machen
  function chooseSortingFromPossibleSortings(chosenSorting: string) {
    if (possibleSortings.includes(chosenSorting)) {
      setCurrentSorting(chosenSorting);
      setCurrentSortingMode(possibleSortingModes[chosenSorting][0]);
    } else {
      setCurrentSorting("");
      setCurrentSortingMode("");
    }
  }

  function chooseSortingModeFromPossibleSortingModes(filter: string, chosenValue: string) {
    if (possibleSortingModes[filter]?.includes(chosenValue)) {
      setCurrentSortingMode(chosenValue);
    } else {
      setCurrentSortingMode("");
    }
  }

  function currentComparator(a: Issue, b: Issue): number {
    if (!currentSorting || !currentSortingMode) return 0;

    if (currentSorting === "Votes") {
      const votesA = a.votes || 0;
      const votesB = b.votes || 0;
      if(currentSortingMode === "Aufsteigend") {
        if (votesA - votesB < 0) return -1;
        if (votesA - votesB > 0) return 1;
        return 0; 
      }
      else {
        if (votesB - votesA < 0) return -1;
        if (votesB - votesA > 0) return 1;
        return 0; 
      }
    }
    
    if (currentSorting === "Erstellungsdatum") {
      const dateA = new Date(a.created_at || "");
      const dateB = new Date(b.created_at || "");
      if(currentSortingMode === "Neueste zuerst") {
        if (dateA > dateB) return -1;
        if (dateA < dateB) return 1;
        return 0; 
      }
      else {
        if (dateA < dateB) return -1;
        if (dateA > dateB) return 1;
        return 0; 
      }
    }
    
    if (currentSorting === "Status") {
      const statusOrder = ["Gemeldet", "Akzeptiert", "In Bearbeitung", "Behoben", "Abgelehnt"];
      const indexA = statusOrder.indexOf(a.status || "");
      const indexB = statusOrder.indexOf(b.status || "");
      
      if(currentSortingMode === "Aufsteigend") {
        if (indexA - indexB < 0) return -1;
        if (indexA - indexB > 0) return 1;
        return 0; 
      }
      else {
        if (indexB - indexA < 0) return -1;
        if (indexB - indexA > 0) return 1;
        return 0; 
      }
    }
    return 0;
  }


  // Views fuer Registrierung und Login
  const [userId, setUserId] = useState<number | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [authView, setAuthView] = useState<"login" | "register" | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [registerAsAdmin, setRegisterAsAdmin] = useState(false);
  const [adminCode, setAdminCode] = useState("");
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [voteError, setVoteError] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState("");
  const [settingsError, setSettingsError] = useState("");
  // const [verificationMessage, setVerificationMessage] = useState("");
  // const [verificationMessageType, setVerificationMessageType] = useState<"success" | "error" | "info">("info");
  const{verificationMessage, setVerificationMessage, verificationMessageType, setVerificationMessageType}=useVerificationMessage();
  //  Suche mit useSearch
  const{ searchView, query, setSearchView, setQuery, issuesToDisplay }=useSearch(issueList);
  

  function issueMatchesCurrentFilter(issue: Issue) {
    if (!currentFilter || !currentFilterValue) return true;
    if (currentFilter === "Kategorie") return issue.kategorie === currentFilterValue;
    if (currentFilter === "Ort") return issue.location?.startsWith(currentFilterValue);
    if (currentFilter === "User") return issue.user_email === currentFilterValue;
    if (currentFilter === "Status") return issue.status === currentFilterValue;
    return true;
  }

  function issueMatchesOnlyOwnFilter(issue: Issue) {
    if (filterOnlyOwnIssues) return issue.user_email === userEmail;
    return true;
  }


  const loadIssues = (archiv: boolean = false) => {
    fetch(`/api/mangel${archiv ? '?archiv=true' : ''}`)
      .then((res) => res.json())
      .then((data) => setIssueList(data));
  };

  useEffect(() => {
    loadIssues(isArchiveMode);
  }, [isArchiveMode]);

  // beim Laden der Seite checken ob man eingeloggt ist um userID zu setzen
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (res.ok) {
          return res.json();
        } else {
          setUserId(null);
          setUserEmail("");
          setUserRole("");
          setEmailVerified(false);
          return null;
        }
      })
      .then((data) => {
        if (data) {
          setUserId(data.userId);
          setUserEmail(data.email);
          setUserRole(data.role || "user");
          setEmailVerified(Boolean(data.emailVerified));
          loadIssues();
        }
      })
      .catch(() => {
        setUserId(null);
        setUserEmail("");
        setUserRole("");
        setEmailVerified(false);
      });
  }, []);

  // Verifizierungslink aus der E-Mail verarbeiten
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (window.location.pathname !== "/verify-email" || !token) return;

    window.history.replaceState({}, "", "/");

    fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json();

        if (!res.ok) {
          setVerificationMessage(data.error || "E-Mail-Verifizierung fehlgeschlagen");
          setVerificationMessageType("error");
          return;
        }

        setVerificationMessage(data.message || "E-Mail-Adresse erfolgreich verifiziert");
        setVerificationMessageType("success");
        setEmailVerified(true);

        fetch('/api/auth/me')
          .then((meRes) => meRes.ok ? meRes.json() : null)
          .then((meData) => {
            if (!meData) return;
            setUserId(meData.userId);
            setUserEmail(meData.email);
            setUserRole(meData.role || "user");
            setEmailVerified(Boolean(meData.emailVerified));
          });
      })
      .catch(() => {
        setVerificationMessage("E-Mail-Verifizierung fehlgeschlagen");
        setVerificationMessageType("error");
      });
  }, []);

  // login handler
  const login = async (event: React.FormEvent) => {
    event.preventDefault();
    setAuthError("");
    setAuthMessage("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: authEmail,
        password: authPassword,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setAuthError(data.error || "Login fehlgeschlagen");
      return;
    }

    setUserId(data.userId);
    setUserEmail(data.email);
    setUserRole(data.role || "user");
    setEmailVerified(Boolean(data.emailVerified));
    setAuthEmail("");
    setAuthPassword("");
    setAuthView(null);
    loadIssues();
  };

  // Registrierungs-handler
  const register = async (event: React.FormEvent) => {
    event.preventDefault();
    setAuthError("");
    setAuthMessage("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: authEmail,
        password: authPassword,
        adminSecret: registerAsAdmin ? adminCode : undefined,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setAuthError(data.error || "Registrierung fehlgeschlagen");
      return;
    }

    setAuthEmail("");
    setAuthPassword("");
    setAdminCode("");
    setRegisterAsAdmin(false);
    setAuthMessage(data.message || "Registrierung erfolgreich. Bitte bestätige deine E-Mail-Adresse.");
    setAuthView("login");
  };

  // logout handler
  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUserId(null);
    setUserEmail("");
    setUserRole("");
    setEmailVerified(false);
    setFilterOnlyOwnIssues(false);
    loadIssues();
  };

  const resendVerificationEmail = async () => {
    setSettingsError("");
    setSettingsMessage("");

    const res = await fetch("/api/auth/resend-verification-email", {
      method: "POST",
    });

    const data = await res.json();

    if (!res.ok) {
      setSettingsError(data.error || "Verifizierungs-E-Mail konnte nicht gesendet werden");
      return;
    }

    setEmailVerified(Boolean(data.emailVerified));
    setSettingsMessage(data.message || "Verifizierungs-E-Mail wurde gesendet");
  };

  // issues aus db laden
  useEffect(() => {
    loadIssues();
  }, []);

  // Add issue to list
  const addIssue = async (event: React.SubmitEvent) => {
    // Stops refreshing
    event.preventDefault();

    // Dont add empty issue to Array
    if (title === '') return;

    // Combine into new Issue
    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("location", location);
    formData.append("kategorie", kategorie);
    if (image) {
      formData.append("image", image);
    }

    // issue in db speichern und dann neu laden
    await fetch('/api/mangel', {
      method: 'POST',
      body: formData,
    });

    // Reload aus db
    loadIssues();

    // Clear Input
    setTitle('');
    setDescription('');
    setLocation('');
    setKategorie('');
    setImage(null);
  }

  // Delete issue
  const deleteIssue = async (id: number) => {
    await fetch(`/api/mangel/${id}`, { method: 'DELETE' });
    loadIssues();
  };

  const upvoteIssue = async (id: number) => {
    setVoteError("");

    // request
    const res = await fetch(`/api/mangel/${id}/vote`, { method: 'PATCH' });
    const data = await res.json();

    if (!res.ok) {
      setVoteError(data.error || "Fehler beim Bewerten");
      loadIssues();
      return;
    }

    // reload
    loadIssues();
  };

  /**
   * Sendet eine Anfrage an das Backend, um den Status eines Mangels zu aktualisieren.
   * Wird nur von Administratoren aufgerufen.
   */
  const updateStatus = async (id: number, newStatus: string) => {
    const res = await fetch(`/api/mangel/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });

    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Fehler beim Aktualisieren des Status");
    }
    loadIssues();
  };
  
  // function renderIssueCard(issue: Issue, index: number) {
  //     const hasVoted = Boolean(issue.has_voted);
  
  //     return (
  //       // makes the whole issue card clickable, but only if there is an image to show
  //       <li className="card issue-card" key={issue.id || index} onClick={() => {if (issue.id && issue.image_url) (issue.id)}}>
  //         {/* Nutzername (email) */}
  //         <p className="meta-line issue-author"><svg className="inline-icon" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 12c2.8 0 5-2.2 5-5s-2.2-5-5-5-5 2.2-5 5 2.2 5 5 5Zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5Z" /></svg>{issue.user_email || "Unbekannter Nutzer"}</p>
  
  //         {/* ID des Mangels */}
  //         <div className="issue-index">{issue.id}</div>
  
  //         {/* Titel */}
  //         <h3 className="issue-title">{issue.title}</h3>
  
  //         {/* Status Anzeige */}
  //         <div className="status-container">
  //           <span className={`status-badge status-${issue.status?.toLowerCase().replace(/\s/g, "-")}`}>
  //             {issue.status}
  //           </span>
  
  //           {/* Admin-Steuerung fuer den Status */}
  //           {userRole === "admin" && (
  //             <select
  //               className="status-select"
  //               value={issue.status}
  //               /* Stops card from expanding when dropdown menu is clicked */
  //               onClick={(e) => e.stopPropagation()}
  //               onChange={(e) => issue.id && updateStatus(issue.id, e.target.value)}
  //             >
  //               <option value="Gemeldet">Gemeldet</option>
  //               <option value="Akzeptiert">Akzeptiert</option>
  //               <option value="Abgelehnt">Abgelehnt</option>
  //               <option value="In Bearbeitung">In Bearbeitung</option>
  //               <option value="Behoben">Behoben</option>
  //             </select>
  //           )}
  //         </div>
  
  //         {/* Standort des Mangels */}
  //         <p className="meta-line"><svg className="inline-icon" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5Z" /></svg>{issue.location || "Kein Ort angegeben"}</p>
  
  //         {/* Beschreibung */}
  //         <p className="issue-description">{issue.description}</p>
  
  //         {/* Image */}
  //         {(issue.thumbnail_url || issue.image_url) && (
  //           <div style={{ marginTop: '10px' }}>
  //             {/* Image hint if not expanded */}
  //             {expandedImageId !== issue.id && (
  //               <p style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 'bold', marginTop: '8px' }}>Tippen um das Bild zu sehen</p>
  //             )}
  //             {/* Loading of Image if expanded */}
  //             {expandedImageId === issue.id && (
  //               <img src={issue.thumbnail_url || issue.image_url!} alt={issue.title} style={{width: "100%", height: "350px", objectFit: "contain", backgroundColor: "var(--surface-strong)", display: "block", borderRadius: "8px", marginTop: "10px", border: "1px solid var(--border)", margin: "12 px auto 0"}}/>
  //             )}
  //           </div>
  //         )}
  
  //         {/* Container fuer Voting-zeug */}
  //         <div className="issue-actions">
  //           <p>Likes: {issue.votes || 0}</p>
  //           <p>Kategorie: {issue.kategorie || '-'}</p>
  
  //           {/* Admin-button um Mangel zu loeschen, nur sichtbar fuer Admins */}
  //           {userRole === "admin" && (
  //             <button onClick={(e) => {e.stopPropagation(); if(issue.id) deleteIssue(issue.id);}}> Meldung Löschen</button>
  //             /* Popup zur Bestätigung könnte hier noch ergänzt werden, damit nicht aus Versehen gelöscht wird. */
  //           )}
  //           {/* Vote-button ist nur aktiv, wenn man eingeloggt ist, ansonsten disabled */}
  //           {userId ? (
  //             <button className={hasVoted ? "voted-button" : undefined} disabled={hasVoted} onClick={(e) => { e.stopPropagation(); if (issue.id) upvoteIssue(issue.id); }}>{hasVoted ? "Geliked" : "Liken"}</button>
  //           ) : (
  //             <button disabled onClick={(e) => e.stopPropagation()}>Like</button>
  //           )}
  //         </div>
  //       </li>
  //     );
  //   }
  
  // UI
  return (
    <div className="app-shell" style={
        {
          '--random-rptu-logo': `url("${randomRptuLogo}")`, // logo in CSS einfügen
        } as React.CSSProperties
      }
      /* Event Listener for swiping between Tabs */
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      >

      <Reportunfall/> {/* // ersetzt die Überschrift, ist vll. einfacher zu lesen und kürzer, wenn wir die kommentare mal löschen */}
      {/* <h1><span className='RPTU-Font'>R</span>e<span className='RPTU-Font'>P</span>or<span className='RPTU-Font'>T</span> <span className='RPTU-U'></span> nfall</h1> */}
      {verificationMessage && (
        <p className={`verification-notice verification-${verificationMessageType}`}>
          {verificationMessage}
        </p>
      )} 
      


      <div className='header-container'>
      {/* Buttons fuer Login/Logout/Register, Anzeige der email mit der man eingeloggt ist*/}
      {userId ? (
        <div className="auth-bar">
          {/* Wenn man eingeloggt ist: logout und einstellungen*/}
          <span className="auth-status">Eingeloggt als <strong>{userEmail}</strong> ({userRole === "admin" ? "Admin" : "Nutzer"})</span>
          <button className='logout-button' onClick={logout}>Logout</button>
          <button className="settings-button" type="button" aria-label="Einstellungen öffnen" title="Einstellungen" onClick={() => setSettingsOpen(true)}>
            <svg className="settings-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M19.4 13.5c.1-.5.1-1 .1-1.5s0-1-.1-1.5l2-1.5-2-3.5-2.4 1a8 8 0 0 0-2.6-1.5L14 2h-4l-.4 3a8 8 0 0 0-2.6 1.5l-2.4-1-2 3.5 2 1.5A9.4 9.4 0 0 0 4.5 12c0 .5 0 1 .1 1.5l-2 1.5 2 3.5 2.4-1a8 8 0 0 0 2.6 1.5l.4 3h4l.4-3a8 8 0 0 0 2.6-1.5l2.4 1 2-3.5-2-1.5ZM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z" />
            </svg>
          </button>
        </div>
      ) : (
        <div className="auth-bar">
        {/* Wenn man nicht eingeloggt ist: login und register */}
          <button onClick={() => setAuthView(authView === "login" ? null : "login")}>Login</button>
          <button onClick={() => setAuthView(authView === "register" ? null : "register")}>Registrieren</button>
        </div>
      )}

      {/* Einstellungs zeug (hier neue einstellungen darunter einfügen 
          Das sieht sehr ausschneidbar aus*/}
      {settingsOpen && (
        <div className="settings-overlay" role="presentation" onClick={() => setSettingsOpen(false)}>
          <section className="settings-pane" role="dialog" aria-modal="true" aria-labelledby="settings-title" onClick={(e) => e.stopPropagation()}>
            <div className="settings-pane-header">
              <h2 id="settings-title">Einstellungen</h2>
              <button className="settings-close-button" type="button" aria-label="Einstellungen schließen" onClick={() => setSettingsOpen(false)}>
                X
              </button>
            </div>

            <div className="settings-options">
              <div className="settings-option">
                <span>
                  <strong>E-Mail-Adresse</strong>
                  <small>{userEmail}</small>
                </span>
                <span className={`verification-badge ${emailVerified ? "is-verified" : "is-unverified"}`}>
                  {emailVerified ? "Verifiziert" : "Nicht verifiziert"}
                </span>
              </div>

              {!emailVerified && (
                <button type="button" onClick={resendVerificationEmail}>
                  Verifizierungs-E-Mail erneut senden
                </button>
              )}

              {settingsMessage && <p className="success-text">{settingsMessage}</p>}
              {settingsError && <p className="error-text">{settingsError}</p>}

              <label className="settings-option">
                <span>
                  <strong>Kompakte Ansicht</strong>
                  <small>Platzhalter</small>
                </span>
                <input type="checkbox" />
              </label>

              <label className="settings-field">
                <span>Sprache</span>
                <select defaultValue="de">
                  <option value="de">Deutsch</option>
                  <option value="en">Englisch</option>
                </select>
              </label>
            </div>
          </section>
        </div>
      )}

      {/* Login/Register Form, wird nur angezeigt wenn authView gesetzt ist dh man nicht eingeloggt ist und auf einen der Buttons geklickt hat*/}
      {authView && (
        <form
          className="auth-card"
          onSubmit={authView === "login" ? login : register}
        >
          <h2>{authView === "login" ? "Login" : "Registrieren"}</h2>

          <input
            type="email"
            placeholder="Email"
            value={authEmail}
            onChange={(event) => setAuthEmail(event.target.value)}
          />

          <input
            type="password"
            placeholder="Passwort"
            value={authPassword}
            onChange={(event) => setAuthPassword(event.target.value)}
          />

          {authView === "register" && (
            <div className="admin-checkbox">
              <input
                type="checkbox"
                id="registerAsAdmin"
                checked={registerAsAdmin}
                onChange={(e) => setRegisterAsAdmin(e.target.checked)}
              />
              <label htmlFor="registerAsAdmin">als Admin registrieren</label>
            </div>
          )}

          {authView === "register" && registerAsAdmin && (
            <input
              type="password"
              placeholder="Admin-Code"
              value={adminCode}
              onChange={(event) => setAdminCode(event.target.value)}
            />
          )}

          {authError && <p className="error-text">{authError}</p>}
          {authMessage && <p className="success-text">{authMessage}</p>}

          <button type="submit">
            {authView === "login" ? "Einloggen" : "Registrieren"}
          </button>
        </form>
      )}


      {/* Suchleiste  "kürzer" naja nicht wirklich, aber netter anzuschauen*/}   
      <Searchbar
        query ={query}
        setQuery={setQuery}
        searchView={searchView}
        setSearchView={setSearchView}
        issuesToDisplay={issuesToDisplay}
      />
      

      {/* Input form nur sichtbar wenn man eingeloggt ist*/}
      {userId ? (
        <form className="issue-form" onSubmit={addIssue}>
          <input type="text" placeholder="Titel" value={title} onChange={(event) => setTitle(event.target.value)} />

          <div className="location-wrapper">
            <input type="text" placeholder="Ort" value={location} onChange={(event) => setLocation(event.target.value)} autoComplete="off" />

            {location.length > 0 && filteredRooms.length > 0 && (
              <div className="room-suggestions">
                {filteredRooms
                  .filter(room => room !== location)
                  .slice(0, 6)
                  .map((room) => (
                    <div
                      key={room}
                      className="room-item"
                      onClick={() => setLocation(room)}
                    >
                      {room}
                    </div>
                  ))}
              </div>
            )}
          </div>

          <select value={kategorie} onChange={(event) => setKategorie(event.target.value)}>
            <option value="">Kategorie wählen</option>
            <option value="Steckdose">Steckdose</option>
            <option value="Schlagloch">Schlagloch</option>
            <option value="WLAN">WLAN</option>
            <option value="Mobiliar">Mobiliar</option>
            <option value="Andere">Andere</option>  {/* Als Option, wie gewollt */}
          </select>
          <input type="file" accept="image/*" onChange={(event) => setImage(event.target.files ? event.target.files[0] : null)} />
          <textarea className="beschreibung-input" placeholder="Beschreibung des Mangels" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={200} />

          <button type="submit">Posten</button>
        </form>
      ) : (
        <p className="login-hint">Bitte einloggen, um einen Mangel zu melden.</p>
      )}

      <div className='issue-toolbar'>
        {/* Filter Auswahl, Filter wird in einem Select-Feld gewaehlt */}
        <select className='issue-filter-select' value={currentFilter} onChange={(event) => chooseFilterFromPossibleFilters(event.target.value)}>
          <option value="" disabled>Filter wählen</option>
          {possibleFilters.map((filter) => (
            <option key={filter} value={filter}>{filter}</option>
          ))}
          <option value=""> - Kein Filter - </option>
        </select>

        {/* in zweitem Select-Feld kann dann dynamisch einer der verfuegbaren Werte gewaehlt werden. */}
        {currentFilter ? (
          <select className='issue-filter-value-select' value={currentFilterValue} onChange={(event) => chooseFilterValueFromPossibleValues(currentFilter, event.target.value)}>
            <option value="" disabled>Wert wählen</option>
            {possibleFilterValues[currentFilter]?.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        ) : null}
        <div className='divider'></div>
        {/* Sorting Auswahl, Sorting wird in einem Select-Feld gewaehlt */}
        <select className='issue-sorting-select' value={currentSorting} onChange={(event) => chooseSortingFromPossibleSortings(event.target.value)} >
          <option value="" disabled>Sortierung wählen</option>
          {possibleSortings.map((sorting) => (
            <option key={sorting} value={sorting}>{sorting}</option>

          ))}
          <option value=""> - Kein Sortierung - </option>
        </select>

        {/* in zweitem Select-Feld kann dann ein entsprechender Sortiermodus gewählt werden */}
        {currentSorting ? (
          <select className='issue-sorting-mode-select' value={currentSortingMode} onChange={(event) => chooseSortingModeFromPossibleSortingModes(currentSorting, event.target.value)}>

            {possibleSortingModes[currentSorting]?.map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}

          </select>
        ) : null}
        {userId && (
          <div className='issue-filter-only-own'>
            <input type="checkbox" id="onlyOwnIssues" checked={filterOnlyOwnIssues} onChange={(e) => setFilterOnlyOwnIssues(e.target.checked)} />
            <label htmlFor="onlyOwnIssues" className='issue-filter-only-own-label'><p style={{fontStyle:'italic'}}>Nur eigene Mängel anzeigen</p></label>
          </div>
        )}
      </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', margin: '20px 0' }}>
        <button 
          onClick={() => { setViewMode('list'); setIsArchiveMode(false); }} 
          className={viewMode === 'list' && !isArchiveMode ? 'active' : ''}
        >
          Liste
        </button>
        <button 
          onClick={() => { setViewMode('map'); setIsArchiveMode(false); }} 
          className={viewMode === 'map' && !isArchiveMode ? 'active' : ''}
        >
          Karte
        </button>
        {userId && (
          <button 
            onClick={() => { setViewMode('list'); setIsArchiveMode(true); }}
            className={isArchiveMode ? 'active' : ''}
            style={{ backgroundColor: isArchiveMode ? 'var(--accent-2)' : '' }}
          >
            Archiv
          </button>
        )}
      </div>

      <div className='list-container'>
        {/* BEDINGTES RENDERN: Liste ODER Karte */}
        {viewMode === 'list' ? (
          /* Liste wird angezeigt */
          <div>
            {/* List of issues */}
            {voteError && <p className="error-text vote-error">{voteError}</p>}
            <ul className="issue-list">
              {issuesToDisplay
                .filter(issueMatchesCurrentFilter)
                .filter(issueMatchesOnlyOwnFilter)
                .sort(currentComparator)
                .map((issue, index) => (
                  <IssueCard
                    key={issue.id || index}
                    issue={issue}
                    userRole={userRole}
                    userId={userId}
                    onDelete={deleteIssue}
                    onUpvote={upvoteIssue}
                    onUpdateStatus={updateStatus}
                  />
                ))}
            </ul>
          </div>
        ) : (
          /* Map */
          <div style={{ width: '100%', height: '600px', position: 'relative', zIndex: 0 }}>
            <MapContainer center={[49.4244, 7.7531]} zoom={17} style={{ height: '100%', width: '100%' }}>
              <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>

              {/* Pin Rendering */}
              {(() => {
                // Same filters as list
                const filteredIssues = issuesToDisplay
                  .filter(issueMatchesCurrentFilter)
                  .filter(issueMatchesOnlyOwnFilter);

                // Issues per Building
                const buildingIssueCount: Record<string, number> = {};
                
                filteredIssues.forEach(issue => {
                  if (issue.location) {
                    // Split the string to only show the building via regex
                    const building = issue.location.split(/[-\s/\\._]+/)[0];
                    if (building) {
                      buildingIssueCount[building] = (buildingIssueCount[building] || 0) + 1;
                    }
                  }
                });

                // Place pin for each building with at least one issue
                return Object.entries(buildingIssueCount).map(([building, count]) => {
                  const coords = buildingCoordinates[building];
                  
                  // No pin for buildings without coordinates
                  if (!coords) return null;

                  // HTML Pin with count
                  const countIcon = L.divIcon({
                    html: `<div style="background-color: var(--danger); color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">${count}</div>`,
                    className: '',
                    iconSize: [32, 32],
                    iconAnchor: [16, 16]
                  });

                  return (<Marker key={building} position={coords} icon={countIcon} eventHandlers={{click: () => {setCurrentFilter("Ort"); setCurrentFilterValue(building); setViewMode("list")}}}/>);
                });
              })()}
            </MapContainer>
          </div>
        )}
      </div>
    </div>
  
  );
}
