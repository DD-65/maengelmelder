import { Hash } from 'node:crypto';
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
}

export default function App() {
  // Input
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');

  // List of issues
  const [issueList, setIssueList] = useState<Issue[]>([]);


  // Variablen für Filter und Filterwerte + Funktionen um diese zu setten
  const [currentFilter, setCurrentFilter] = useState("");
  const [currentFilterValue, setCurrentFilterValue] = useState("");
  const possibleFilters = [
          // "Kategorie", //zur Zeit noch nicht implementiert
          "Ort", 
          "User"
        ];
  const possibleFilterValues: Record<string, string[]> = {
  //Kategorie: Array.from(new Set(issueList.map(issue => issue.kategorie).filter((x): x is string => x !== null))), //zur Zeit noch nicht implementiert
  Ort: Array.from(new Set(issueList.map(issue => issue.location).filter((x): x is string => x !== null))), //Design-Entscheidung: Filter nur mit Werten befüllen die auch tatsächlich in den Issues vorkommen, könnte man auch anders machen
  User: Array.from(new Set(issueList.map(issue => issue.user_email).filter((x): x is string => x !== null))),
};

// dedizierte Funktionnen um nur gültige Filter und Werte setzbar zu machen
  function chooseFilterFromPossibleFilters(chosenFilter: string) {
    if (possibleFilters.includes(chosenFilter)) {
      setCurrentFilter(chosenFilter);
    } else {
      setCurrentFilter("");
    }
  }

  function chooseFilterValueFromPossibleValues(filter: string, chosenValue: string) {
    if (possibleFilterValues[filter]?.includes(chosenValue)) {
      setCurrentFilterValue(chosenValue);
    } else {
      setCurrentFilterValue("");
    }
  }

  // Views für Registrierung und Login
  const [userId, setUserId] = useState<number | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [authView, setAuthView] = useState<"login" | "register" | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");

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
  };

  // issues aus db laden
  useEffect(() => {
       fetch('/api/mangel')
         .then((res) => res.json())
         .then((data) => setIssueList(data));
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
    fetch('/api/mangel')
      .then((res) => res.json())
      .then((data) => setIssueList(data));

    // Clear Input
    setTitle(''); 
    setDescription(''); 
    setLocation('');
  }

  const upvoteIssue = async (id: number) => {
    // request
    await fetch(`/api/mangel/${id}/vote`, {method: 'PATCH',});

    // reload
    fetch('/api/mangel')
      .then((res) => res.json())
      .then((data) => setIssueList(data));
  };

  // UI
  return (
    <div className="app-shell">
      <h1>RPTU-Mängelmelder</h1>

      {/* Buttons für Login/Logout/Register, Anzeige der email mit der man eingeloggt ist*/}
      {userId ? (
        <div className="auth-bar">
        <span className="auth-status">Eingeloggt als <strong>{userEmail}</strong></span>
        <button onClick={logout}>Logout</button>
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
          <input type="text" placeholder="Beschreibung des Mangels" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={200}/>

          <button type="submit">Hinzufügen</button>
        </form>
      ) : (
      <p className="login-hint">Bitte einloggen, um einen Mangel zu melden.</p>
      )}


      <div className='issue-toolbar'>
      {/* Filter Auswahl, Filter wird in einem Select-Feld gewählt */}
      
        <select value={currentFilter} onChange={(event) => chooseFilterFromPossibleFilters(event.target.value)}>
          <option value="" disabled>Wählen Sie einen Filter</option>
          {possibleFilters.map((filter) => (
            <option key={filter} value={filter}>{filter}</option>
          ))}
          <option value="">  - Kein Filter - </option>
        </select>

      {/* in zweitem Select-Feld kann dann dynamisch einer der verfügbaren Werte gewählt werden. 
      Die verfügbaren Werte werden aus der Issue-Liste unique rekonstruiert. MAN KÖNNTE DIESE NOCH SORTIEREN (nach Alphabet oder Häufigkeit)*/}

      {currentFilter ? (
        <select value={currentFilterValue} onChange={(event) => chooseFilterValueFromPossibleValues(currentFilter, event.target.value)}>
          <option value="" disabled>Wählen Sie einen Wert</option>
          {possibleFilterValues[currentFilter]?.map((value) => (
            <option key={value} value={value}>{value}</option>
          ))}
        </select>
      ): null}
      </div>
        {/* List of issues */}
        <ul className="issue-list">
        {issueList.filter(issue => { //die Issue-List wird gefiltert bevor sie 
          if (!currentFilter || !currentFilterValue) return true;
          //if (currentFilter === "Kategorie") return issue.kategorie === currentFilterValue;
          if (currentFilter === "Ort") return issue.location === currentFilterValue;
          if (currentFilter === "User") return issue.user_email === currentFilterValue;
          return true;
          })
          .map((issue, index) => (
            <li className="card issue-card" key={issue.id || index}>
            
            {/* Nutzername (email) */}
            <p className="meta-line issue-author"><svg className="inline-icon" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 12c2.8 0 5-2.2 5-5s-2.2-5-5-5-5 2.2-5 5 2.2 5 5 5Zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5Z" /></svg>{issue.user_email || "Unbekannter Nutzer"}</p>
            
            {/* ID des Mangels */}
            <div className="issue-index">{index + 1}</div>
            
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
              <button onClick={() => {if (issue.id) upvoteIssue(issue.id);}}> Like </button>
              ) : (
              <button disabled>Like</button>
              )}
            </div>
            </li>
        ))}
      </ul>

    </div>


  );

}
