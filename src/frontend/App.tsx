import { useEffect, useState } from 'react';

// Define all issue components
type Issue = {
  id?: number;
  title: string;
  description: string | null;
  location: string | null;
  created_at?: string;
  votes?: number;
  user_email?: string | null;
  has_voted?: number | boolean;
}

export default function App() {
  // Input
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');

  // List of issues
  const [issueList, setIssueList] = useState<Issue[]>([]);

  // Views für Registrierung und Login
  const [userId, setUserId] = useState<number | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [authView, setAuthView] = useState<"login" | "register" | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [voteError, setVoteError] = useState("");

  const loadIssues = () => {
    fetch('/api/mangel')
      .then((res) => res.json())
      .then((data) => setIssueList(data));
  };

  // beim laden der Seite checken ob man eingeloggt ist um userID zu setzen
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (res.ok) {
          return res.json();
        } else {
          setUserId(null);
          setUserEmail("");
          return null;
        }
      })
      .then((data) => {
        if (data) {
          setUserId(data.userId);
          setUserEmail(data.email);
          loadIssues();
        }
      })
      .catch(() => {
        setUserId(null);
        setUserEmail("");
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
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setAuthError(data.error || "Registrierung fehlgeschlagen");
      return;
    }

    setAuthEmail("");
    setAuthPassword("");
    setAuthView("login");
  };

  // logout handler
  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUserId(null);
    setUserEmail("");
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
    const newIssue: Issue = {
      title: title,
      description: description,
      location: location
    };

    // issue in db speichern und dann neu laden
    await fetch('/api/mangel', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(newIssue),
     });

    // Reload aus db
    loadIssues();

    // Clear Input
    setTitle(''); 
    setDescription(''); 
    setLocation('');
  }

  const upvoteIssue = async (id: number) => {
    setVoteError("");

    // request
    const res = await fetch(`/api/mangel/${id}/vote`, {method: 'PATCH',});
    const data = await res.json();

    if (!res.ok) {
      setVoteError(data.error || "Fehler beim Bewerten");
      loadIssues();
      return;
    }

    // reload
    loadIssues();
  };

  // UI
  return (
    <div className="app-shell">
      <h1>RPTU-Mängelmelder</h1>

      {/* Buttons für Login/Logout/Register, Anzeige der email mit der man eingeloggt ist*/}
      {userId ? (
        <div className="auth-bar">
        <span className="auth-status">Eingeloggt als <strong>{userEmail}</strong></span>
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
          
          {authError && <p className="error-text">{authError}</p>}
          
          <button type="submit">
          {authView === "login" ? "Einloggen" : "Registrieren"}
          </button>
          </form>
        )}

      {/* Input form nur sichtbar wenn man eingeloggt ist*/}
      {userId ? (
        <form className="issue-form" onSubmit={addIssue}>

          <input type="text" placeholder="Titel" value={title} onChange={(event) => setTitle(event.target.value)}/>
          <input type="text" placeholder="Ort" value={location} onChange={(event) => setLocation(event.target.value)}/>
          <textarea className="beschreibung-input" placeholder="Beschreibung des Mangels" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={200} />

          <button type="submit">Posten</button>
        </form>
      ) : (
      <p className="login-hint">Bitte einloggen, um einen Mangel zu melden.</p>
      )}

      {/* List of issues */}
      {voteError && <p className="error-text vote-error">{voteError}</p>}
      <ul className="issue-list">
        {issueList.map((issue, index) => {
          const hasVoted = Boolean(issue.has_voted);

          return (
            <li className="card issue-card" key={issue.id || index}>
            
            {/* Nutzername (email) */}
            <p className="meta-line issue-author"><svg className="inline-icon" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 12c2.8 0 5-2.2 5-5s-2.2-5-5-5-5 2.2-5 5 2.2 5 5 5Zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5Z" /></svg>{issue.user_email || "Unbekannter Nutzer"}</p>
            
            {/* ID des Mangels */}
            <div className="issue-index">{issue.id}</div>
            
            {/* Titel */}
            <h3 className="issue-title">{issue.title}</h3>
            
            {/* Standort des Mangels */}
            <p className="meta-line"><svg className="inline-icon" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5Z" /></svg>{issue.location || "Kein Ort angegeben"}</p>
            
            {/* Beschreibung */}
            <p className="issue-description">{issue.description}</p>
            
            {/* Container für Voting-zeug */}
            <div className="issue-actions">
              <p>Likes: {issue.votes || 0}</p>
              {/* Vote-button ist nur aktiv, wenn man eingeloggt ist, ansonsten disabled */}
              {userId ? (
              <button className={hasVoted ? "voted-button" : undefined} disabled={hasVoted} onClick={() => {if (issue.id) upvoteIssue(issue.id);}}>{hasVoted ? "Geliked" : "Liken"}</button>
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
