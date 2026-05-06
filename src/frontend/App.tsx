import { useEffect, useState } from 'react';

const rooms = [
  "01-006", "01-019", "01-106", "01-160",
  "11-201", "11-205", "11-207", "11-220", "11-222", "11-241", "11-243", "11-260", "11-262",
  "13-222", "13-305", "13-370",
  "24-102",
  "32-439",
  "36-265",
  "42-105", "42-110", "42-115",
  "44-380", "44-465", "44-482",
  "46-110", "46-210", "46-215", "46-220", "46-260", "46-267", "46-268", "46-280", "46-387", "46-388",
  "48-208", "48-210", "48-438", "48-582",
  "52-203", "52-204", "52-206", "52-207",
  "56-230", "56-232",
  "57-315", "57-508"
];

const rptuLogoUrls = [
  '/RPTU-Brand/U_Farben/RPTU U.png',
  '/RPTU-Brand/U_Farben/RPTU U2.png',
  '/RPTU-Brand/U_Farben/RPTU U3.png',
  '/RPTU-Brand/U_Farben/RPTU U4.png',
  '/RPTU-Brand/U_Farben/RPTU U5.png',
  '/RPTU-Brand/U_Farben/RPTU U6.png',
  '/RPTU-Brand/U_Farben/RPTU U7.png',
  '/RPTU-Brand/U_Farben/RPTU U8.png',
  '/RPTU-Brand/U_Farben/RPTU U9.png',
  '/RPTU-Brand/U_Farben/RPTU U10.png',
  '/RPTU-Brand/U_Farben/RPTU U11.png',
  '/RPTU-Brand/U_Farben/RPTU U12.png',
];

// Define all issue components
type Issue = {
  id?: number;
  title: string;
  description: string | null;
  location: string | null;
  status?: string;
  created_at?: string;
  votes?: number;
  user_email?: string | null;
  has_voted?: number | boolean;
  kategorie?: string | null;
  image_url?: string | null;
}

export default function App() {
  // Input
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [kategorie, setKategorie] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const filteredRooms = rooms.filter(room => room.toLowerCase().includes(location.toLowerCase()));

  // List of issues
  const [issueList, setIssueList] = useState<Issue[]>([]);

  // State of Image Expansion
  const [expandedImageId, setExpandedImageId] = useState<number | null>(null);

  // Toggle Image Expansion
  const toggleImage = (id: number) => {
    setExpandedImageId(prevId => (prevId === id ? null : id));
  };

  //Bool für Filter "nur eigene Mängel anzeigen"
  const [filterOnlyOwnIssues, setFilterOnlyOwnIssues] = useState(false);


  // Variablen fuer Filter und Filterwerte + Funktionen um diese zu setten
  const [currentFilter, setCurrentFilter] = useState("");
  const [currentFilterValue, setCurrentFilterValue] = useState("");
  const possibleFilters = [
    "Kategorie",
    "Ort",
    //"User", war nicht gefordert, dann eben nicht.
    "Status",

  ];
  const possibleFilterValues: Record<string, string[]> = {
    Kategorie: Array.from(new Set(issueList.map(issue => issue.kategorie).filter((x): x is string => Boolean(x)))),
    Ort: Array.from(new Set(issueList.map(issue => issue.location).filter((x): x is string => Boolean(x)))), // Design-Entscheidung: Filter nur mit Werten befuellen die auch tatsaechlich in den Issues vorkommen
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
  const [currentSorting, setCurrentSorting] = useState("");
  const [currentSortingMode, setCurrentSortingMode] = useState("");
  const possibleSortings = [
    "Votes",
    "Erstellungsdatum",
    "Status"
  ];
  const possibleSortingModes: Record<string, string[]> = {
    Votes: ["Aufsteigend", "Absteigend"],
    Erstellungsdatum: ["Neueste zuerst", "Älteste zuerst"],
    Status: ["Aufsteigend", "Absteigend"]
  };

    // dedizierte Funktionen um nur gueltige Filter und Werte setzbar zu machen
  function chooseSortingFromPossibleSortings(chosenFilter: string) {
    if (possibleSortings.includes(chosenFilter)) {
      setCurrentSorting(chosenFilter);
    } else {
      setCurrentSorting("");
    }
    setCurrentSortingMode("");
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
  const [authView, setAuthView] = useState<"login" | "register" | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [registerAsAdmin, setRegisterAsAdmin] = useState(false);
  const [adminCode, setAdminCode] = useState("");
  const [authError, setAuthError] = useState("");
  const [voteError, setVoteError] = useState("");

  const loadIssues = () => {
    fetch('/api/mangel')
      .then((res) => res.json())
      .then((data) => setIssueList(data));
  };

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
          return null;
        }
      })
      .then((data) => {
        if (data) {
          setUserId(data.userId);
          setUserEmail(data.email);
          setUserRole(data.role || "user");
          loadIssues();
        }
      })
      .catch(() => {
        setUserId(null);
        setUserEmail("");
        setUserRole("");
      });
  }, []);

  // login handler
  const login = async (event: React.FormEvent) => {
    event.preventDefault();
    setAuthError("");

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
    setAuthEmail("");
    setAuthPassword("");
    setAuthView(null);
    loadIssues();
  };

  // Registrierungs-handler
  const register = async (event: React.FormEvent) => {
    event.preventDefault();
    setAuthError("");

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
    setAuthView("login");
  };

  // logout handler
  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUserId(null);
    setUserEmail("");
    setUserRole("");
    loadIssues();
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
  const [randomRptuLogo] = useState(() => { // random rptu logo für den Titel, wird einmalig beim Laden der Seite geladen
    const isLightMode = window.matchMedia('(prefers-color-scheme: light)').matches; // light oder dark mode
    const allowedLogos = rptuLogoUrls.filter((url) =>
      isLightMode // matchen ob es sich um ein weißes oder schwarzes Logo handelt und entsprechend mit dem dark / light mode filtern
        ? !url.includes('RPTU U12.png')
        : !url.includes('RPTU U11.png'),
    );

    return allowedLogos[Math.floor(Math.random() * allowedLogos.length)]; // zufälliges U wählen
  });

  // UI
  return (
    <div className="app-shell" style={
        {
          '--random-rptu-logo': `url("${randomRptuLogo}")`, // logo in CSS einfügen
        } as React.CSSProperties
      }>
      <h1><span className='RPTU-Font'>R</span>e<span className='RPTU-Font'>P</span>or<span className='RPTU-Font'>T</span> <span className='RPTU-U'></span> nfall</h1>
      



      {/* Buttons fuer Login/Logout/Register, Anzeige der email mit der man eingeloggt ist*/}
      {userId ? (
        <div className="auth-bar">
          <span className="auth-status">Eingeloggt als <strong>{userEmail}</strong> ({userRole === "admin" ? "Admin" : "Nutzer"})</span>
          <button className='logout-button' onClick={logout}>Logout</button>
        </div>
      ) : (
        <div className="auth-bar">
          <button onClick={() => setAuthView(authView === "login" ? null : "login")}>Login</button>
          <button onClick={() => setAuthView(authView === "register" ? null : "register")}>Registrieren</button>
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

          <button type="submit">
            {authView === "login" ? "Einloggen" : "Registrieren"}
          </button>
        </form>
      )}

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
              <option key={mode} value={mode} selected={mode === possibleSortingModes[currentSorting][0]}>
                {mode}
              </option>
            ))}

          </select>
        ) : null}
        <div className='issue-filter-only-own'>
        <input type="checkbox" id="onlyOwnIssues" checked={filterOnlyOwnIssues} onChange={(e) => setFilterOnlyOwnIssues(e.target.checked)} />
        <label htmlFor="onlyOwnIssues" className='issue-filter-only-own-label'><p style={{fontStyle:'italic'}}>Nur eigene Mängel anzeigen</p></label>
        </div>
      </div>

      {/* List of issues */}
      {voteError && <p className="error-text vote-error">{voteError}</p>}
      <ul className="issue-list">
        {issueList.filter(issue => {
          if (!currentFilter || !currentFilterValue) return true;
          if (currentFilter === "Kategorie") return issue.kategorie === currentFilterValue;
          if (currentFilter === "Ort") return issue.location === currentFilterValue;
          if (currentFilter === "User") return issue.user_email === currentFilterValue;
          if (currentFilter === "Status") return issue.status === currentFilterValue;
          return true;
        }).filter(issue => {
          if (filterOnlyOwnIssues){return issue.user_email === userEmail}
          return true;
        })
          .sort(currentComparator)
          .map((issue, index) => {
            const hasVoted = Boolean(issue.has_voted);

            return (
              <li className="card issue-card" key={issue.id || index}>
                {/* Nutzername (email) */}
                <p className="meta-line issue-author"><svg className="inline-icon" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 12c2.8 0 5-2.2 5-5s-2.2-5-5-5-5 2.2-5 5 2.2 5 5 5Zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5Z" /></svg>{issue.user_email || "Unbekannter Nutzer"}</p>

                {/* ID des Mangels */}
                <div className="issue-index">{issue.id}</div>

                {/* Titel */}
                <h3 className="issue-title">{issue.title}</h3>

                {/* Status Anzeige */}
                <div className="status-container">
                  <span className={`status-badge status-${issue.status?.toLowerCase().replace(/\s/g, "-")}`}>
                    {issue.status}
                  </span>

                  {/* Admin-Steuerung fuer den Status */}
                  {userRole === "admin" && (
                    <select
                      className="status-select"
                      value={issue.status}
                      onChange={(e) => issue.id && updateStatus(issue.id, e.target.value)}
                    >
                      <option value="Gemeldet">Gemeldet</option>
                      <option value="Akzeptiert">Akzeptiert</option>
                      <option value="Abgelehnt">Abgelehnt</option>
                      <option value="In Bearbeitung">In Bearbeitung</option>
                      <option value="Behoben">Behoben</option>
                    </select>
                  )}
                </div>

                {/* Standort des Mangels */}
                <p className="meta-line"><svg className="inline-icon" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5Z" /></svg>{issue.location || "Kein Ort angegeben"}</p>

                {/* Beschreibung */}
                <p className="issue-description">{issue.description}</p>

                {/* Image */}
                {issue.image_url && (
                  <div>
                    <button onClick={() => {if (issue.id) toggleImage(issue.id)}}>{issue.id && expandedImageId === issue.id ? 'Ausblenden' : 'Ansehen'}</button>
                    {issue.id && expandedImageId === issue.id && (<img src={issue.image_url} alt={issue.title} style={{maxWidth: "100%", height: "auto", display: "block", borderRadius: "8px", marginTop: "10px", border: "1px solid var(--border)", margin: "12 px auto 0"}} className={`issue-image ${expandedImageId === issue.id ? "expanded" : ""}`} />)}
                  </div>
                )}

                {/* Container fuer Voting-zeug */}
                <div className="issue-actions">
                  <p>Likes: {issue.votes || 0}</p>
                  <p>Kategorie: {issue.kategorie || '-'}</p>

                  {/* Admin-button um Mangel zu loeschen, nur sichtbar fuer Admins */}
                  {userRole === "admin" && (
                    <button onClick={() => issue.id && deleteIssue(issue.id)}> Meldung Löschen</button>
                    /* Popup zur Bestätigung könnte hier noch ergänzt werden, damit nicht aus Versehen gelöscht wird. */
                  

                  )}
                  {/* Vote-button ist nur aktiv, wenn man eingeloggt ist, ansonsten disabled */}
                  {userId ? (
                    <button className={hasVoted ? "voted-button" : undefined} disabled={hasVoted} onClick={() => { if (issue.id) upvoteIssue(issue.id); }}>{hasVoted ? "Geliked" : "Liken"}</button>
                  ) : (
                    <button disabled>Like</button>
                  )}
                </div>
              </li>
            );
          })}
      </ul>
    </div>
  );
}
