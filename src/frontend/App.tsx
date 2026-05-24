import { useEffect, useState } from 'react';

import { Map } from './library/ui/map';
// import { MapContainer, TileLayer, Marker } from 'react-leaflet';
// import L from 'leaflet';
// import 'leaflet/dist/leaflet.css';

// Konstanten und random U's importieren
import {rooms}  from './library/constants/rooms';   // unnötig, weil ausgebaut
import {buildingCoordinates} from './library/constants/buildingCoordinates';
import {randomRptuLogo} from './library/utils/rptulogo';

// input importieren
import { useInput } from './library/hooks/useInput';    //eigentlich auch unnötig, weil ausgebaut
// suche importieren
import { useSearch } from './library/ui/search';
import { Searchbar } from './library/ui/searchbar';

// issue components importieren
import {Issue} from './library/types/Issue';
import { useIssueList } from './library/hooks/useIssueList';
import { IssueCard } from './library/ui/renderIssueCard';
import { useLoadIssues } from './library/hooks/useLoadIssues'; // leider läd es die issues nicht

// swiping & teile von Map
import { useViewMode } from './library/hooks/useViewMode';
import { useSwiping } from './library/hooks/useSwiping';

// Filter importieren
import { useFilter } from './library/hooks/useFilter';
import { useArchiveMode } from './library/hooks/useArchiveMode';
// Sortierung importieren
import { useSorting } from './library/hooks/useSorting';
// regristrierung login importieren
import { useRegistrationLogin} from './library/hooks/useRegistrationLogin';


import { useVerificationMessage } from './library/hooks/useVerificationMessage'; //kürzt unten um 1 Zeile, also insgesamt sinnlos
//    Vielleicht ist es aber später nützlich, sobald wir irgendeinen Teil der Verifikation auslagern


import { Reportunfall } from './library/ui/reportunfall'; // for Fun eine Zeile durch zwei ersetzt, aber macht den html teil übersichtlicher
import { RegistrationLogin } from './library/ui/ERRORregistrationLogin';
import { InputForm } from './library/ui/inputForm';
import { ViewModeButtons } from './library/ui/viewModeButtons';
import { registerClient } from 'fuse/next/server';
import { SettingsButton } from './library/ui/settingsButton';








export default function App() {
  // List of issues
  const {issueList, setIssueList} = useIssueList(); //so müsste es richtig sein
  //const [issueList, setIssueList] = useState<Issue[]>([]);
  
  const{loadIssues, deleteIssue}=useLoadIssues(setIssueList);
  
  // Input      wird nicht mehr benötigt, ist das schlimm, mit dem fehlenden loadIssues und setIsArchiveMode ?
  // const{title, setTitle,description, setDescription, location, setLocation, kategorie, setKategorie, image, setImage, addIssue}=useInput(() => {
  //   loadIssues(false);
  //   setIsArchiveMode(false);
  // });
  // const [title, setTitle] = useState('');
  // const [description, setDescription] = useState('');
  // const [location, setLocation] = useState('');
  // const [kategorie, setKategorie] = useState('');
  // const [image, setImage] = useState<File | null>(null);
  // const filteredRooms = rooms.filter(room => room.toLowerCase().includes(location.toLowerCase()));
  
  
  // State of Viewing (List or Map)
  const {viewMode, setViewMode} = useViewMode();
  
  // Archiv-Modus
  const {isArchiveMode, setIsArchiveMode} = useArchiveMode();
  
  // Views fuer Registrierung und Login
  const{userId, setUserId, userEmail, setUserEmail, userRole, setUserRole, emailVerified, setEmailVerified,
    authView, setAuthView, authEmail, setAuthEmail,authPassword, setAuthPassword,
    registerAsAdmin, setRegisterAsAdmin, adminCode, setAdminCode, authError, setAuthError, authMessage, setAuthMessage,
    voteError, setVoteError, settingsOpen, setSettingsOpen, settingsMessage, setSettingsMessage, settingsError, setSettingsError
  }=useRegistrationLogin();
  
  // Swiping using view mode
  const {handleTouchStart, handleTouchEnd}=useSwiping(viewMode, setViewMode, isArchiveMode, setIsArchiveMode, !!userId);
  
  
  //  Suche mit useSearch
  const{ searchView, query, setSearchView, setQuery, issuesToDisplay }=useSearch(issueList);
  
  //--> issuesToDisplay dann als input in useFilter
  //Variablen fuer Filterung und gefilterte Issues + Funktionen um Filter zu setzen
  const{filteredIssues, currentFilter, currentFilterValue, possibleFilters, possibleFilterValues, chooseFilter, chooseFilterValue, 
    filterOnlyOwn, setFilterOnlyOwn, setCurrentFilter, setCurrentFilterValue, issueMatchesCurrentFilter, issueMatchesOnlyOwnFilter}=useFilter(issuesToDisplay, userEmail);
    
    //--> filteredIssues dann als input in useSorting
    // Variablen fuer Sortierung und Sortiermodus + Funktionen um diese zu setten
    const{currentSorting, currentSortingMode, possibleSortings, possibleSortingModes, sortedIssues, chooseSorting, chooseSortingMode} = useSorting(filteredIssues);
    const finalIssueList = sortedIssues; 
    // finalIssueList  dann unten in der UI als Basis für die Anzeige der Issues verwenden, damit wird alles kombiniert: Suche -> Filter -> Sortierung -> map auf IssueCard
    const{verificationMessage, setVerificationMessage, verificationMessageType, setVerificationMessageType}=useVerificationMessage();
    
    const resetFilterAndSorting = () => {
      chooseFilter("");
      chooseSorting("");
      setFilterOnlyOwn(false);
    };
    
    // State für die Bestätigung der endgültigen Löschung
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [issueToDelete, setIssueToDelete] = useState<number | null>(null);
    
    //const{loadIssues}=useLoadIssues();
    // const loadIssues = (archiv: boolean = false) => {
    //   fetch(`/api/mangel${archiv ? '?archiv=true' : ''}`)
    //     .then((res) => res.json())
    //     .then((data) => setIssueList(data));
    // };
    
    useEffect(() => {
      loadIssues(isArchiveMode);
    }, [isArchiveMode, loadIssues]);
    
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
          loadIssues(isArchiveMode);
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
      loadIssues(false);
    };
    
    //Registrierungs-handler
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
      setFilterOnlyOwn(false);
      loadIssues(false);
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
    
    //  => ausgelagert in settingsButton.tsx
    // const settingsButton = (
    //   <button className="settings-button" type="button" aria-label="Einstellungen öffnen" title="Einstellungen" onClick={() => setSettingsOpen(true)}>
    //   <svg className="settings-icon" viewBox="0 0 24 24" aria-hidden="true">
    //   <path d="M19.4 13.5c.1-.5.1-1 .1-1.5s0-1-.1-1.5l2-1.5-2-3.5-2.4 1a8 8 0 0 0-2.6-1.5L14 2h-4l-.4 3a8 8 0 0 0-2.6 1.5l-2.4-1-2 3.5 2 1.5A9.4 9.4 0 0 0 4.5 12c0 .5 0 1 .1 1.5l-2 1.5 2 3.5 2.4-1a8 8 0 0 0 2.6 1.5l.4 3h4l.4-3a8 8 0 0 0 2.6-1.5l2.4 1 2-3.5-2-1.5ZM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z" />
    //   </svg>
    //   </button>
    // );
    
    
    // // Delete issue => in useLoadIssue
    // const deleteIssue = async (id: number) => {
    //   await fetch(`/api/mangel/${id}`, { method: 'DELETE' });
    //   loadIssues();
    // };
    
    
    const upvoteIssue = async (id: number) => {
      setVoteError("");
      
      // request
      const res = await fetch(`/api/mangel/${id}/vote`, { method: 'PATCH' });
      const data = await res.json();
      
      if (!res.ok) {
        setVoteError(data.error || "Fehler beim Bewerten");
        loadIssues(isArchiveMode);
        return;
      }
      
      // reload
      loadIssues(isArchiveMode);
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
      loadIssues(isArchiveMode);
    };
    
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
      
      <Reportunfall/> {/* Seitenüberschrift mit random RPTU U */}
      
      {verificationMessage && (
        <p className={`verification-notice verification-${verificationMessageType}`}>
        {verificationMessage}
        </p>
      )} 
      
      
      <div className='list-container'>
      <div className='header-container'>
      {/* Buttons fuer Login/Logout/Register, Anzeige der email mit der man eingeloggt ist*/}
      {userId ? (
        <div className="auth-bar">
        {/* Wenn man eingeloggt ist: logout und einstellungen*/}
        <span className="auth-status">Eingeloggt als <strong>{userEmail}</strong> ({userRole === "admin" ? "Admin" : "Nutzer"})</span>
        <button className='logout-button' onClick={logout}>Logout</button>
        <SettingsButton     //ausgelagert, braucht setSettingsOpen
        setSettingsOpen={setSettingsOpen}
        />
        </div>
      ) : (
        <div className="auth-bar">
        {/* Wenn man nicht eingeloggt ist: login und register */}
        <button onClick={() => setAuthView(authView === "login" ? null : "login")}>Login</button>
        <button onClick={() => setAuthView(authView === "register" ? null : "register")}>Registrieren</button>
        <SettingsButton     //ausgelagert, braucht setSettingsOpen
        setSettingsOpen={setSettingsOpen}
        />
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
          {userId && (
            <>
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
            </>
          )}
          
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

          // <RegistrationLogin             Funktioniert nicht, beim Drücken vom Login Knopf läuft wird nciht eingeloggt
          //   authView={authView}              Wahrscheinlich wieder das erstellen von States innerhalb einer Hilfsdatei, die so nie etwas verändern.
          //   authEmail={authEmail}            Liegt dann aber an der implementierung von useLoginHandler und useRegistrationHandler
          //   setAuthEmail={setAuthEmail}
          //   authPassword={authPassword}
          //   setAuthPassword={setAuthPassword}
          //   registerAsAdmin={registerAsAdmin}
          //   setRegisterAsAdmin={setRegisterAsAdmin}
          //   adminCode={adminCode}
          //   setAdminCode={setAdminCode}
          //   authError={authError}
          //   authMessage={authMessage}
          // />
          
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
          
          <InputForm
          setIssueList={setIssueList}
          />
          
        ) : (
          <p className="login-hint">Bitte einloggen, um einen Mangel zu melden.</p>
        )}
        
        <div className='issue-toolbar'>
        {/* Filter Auswahl, Filter wird in einem Select-Feld gewaehlt */}
        <select className='issue-filter-select' value={currentFilter} onChange={(event) => chooseFilter(event.target.value)}>
        <option value="" disabled>Filter wählen</option>
        {possibleFilters.map((filter) => (
          <option key={filter} value={filter}>{filter}</option>
        ))}
        <option value=""> - Kein Filter - </option>
        </select>
        
        {/* in zweitem Select-Feld kann dann dynamisch einer der verfuegbaren Werte gewaehlt werden. */}
        {currentFilter ? (
          <select className='issue-filter-value-select' value={currentFilterValue} onChange={(event) => chooseFilterValue(currentFilter, event.target.value)}>
          <option value="" disabled>Wert wählen</option>
          {possibleFilterValues[currentFilter]?.map((value) => (
            <option key={value} value={value}>{value}</option>
          ))}
          </select>
        ) : null}
        <div className='divider'></div>
        {/* Sorting Auswahl, Sorting wird in einem Select-Feld gewaehlt */}
        <select className='issue-sorting-select' value={currentSorting} onChange={(event) => chooseSorting(event.target.value)} >
        <option value="" disabled>Sortierung wählen</option>
        {possibleSortings.map((sorting) => (
          <option key={sorting} value={sorting}>{sorting}</option>
          
        ))}
        <option value=""> - Kein Sortierung - </option>
        </select>
        
        {/* in zweitem Select-Feld kann dann ein entsprechender Sortiermodus gewählt werden */}
        {currentSorting ? (
          <select className='issue-sorting-mode-select' value={currentSortingMode} onChange={(event) => chooseSortingMode(currentSorting, event.target.value)}>
          
          {possibleSortingModes[currentSorting]?.map((mode) => (
            <option key={mode} value={mode}>
            {mode}
            </option>
          ))}
          
          </select>
          
        ) : null}
        {userId && (
          <div className='issue-filter-only-own'>
          <button type="button" className="issue-filter-reset-button" onClick={resetFilterAndSorting}>Filter zurücksetzen</button>
          <input type="checkbox" id="onlyOwnIssues" checked={filterOnlyOwn} onChange={(e) => setFilterOnlyOwn(e.target.checked)} />
          <label htmlFor="onlyOwnIssues" className='issue-filter-only-own-label'><p style={{fontStyle:'italic'}}>Nur eigene Mängel anzeigen</p></label>
          </div>
        )}
        </div>
        </div>
        
        <ViewModeButtons
        userId  ={userId}
        viewMode={viewMode}
        setViewMode={setViewMode}
        isArchiveMode={isArchiveMode}
        setIsArchiveMode={setIsArchiveMode}
        />
        
        <div className='issue-display-area'>
        {/* BEDINGTES RENDERN: Liste ODER Karte */}
        {viewMode === 'list' ? (
          /* Liste wird angezeigt */
          <div>
          {/* List of issues */}
          {voteError && <p className="error-text vote-error">{voteError}</p>}
          <ul className="issue-list">
          {finalIssueList
            .map((issue, index) => (
              <IssueCard
              key={issue.id || index}
              issue={issue}
              userRole={userRole}
              userId={userId}
              onDelete={(id) => {
                if (isArchiveMode && issue.status === "Gelöscht") {
                  setIssueToDelete(id);
                  setIsConfirmOpen(true);
                } else {
                  deleteIssue(id, isArchiveMode);
                }
              }}
              onUpvote={upvoteIssue}
              onUpdateStatus={updateStatus}
              />
            ))}
            </ul>
            </div>
          ) : (
            /* Map */
            <Map
            issuesToDisplay={issuesToDisplay}
            setViewMode={setViewMode}
            setCurrentFilter={setCurrentFilter}
            setCurrentFilterValue={setCurrentFilterValue}
            issueMatchesCurrentFilter={issueMatchesCurrentFilter}
            issueMatchesOnlyOwnFilter={issueMatchesOnlyOwnFilter}
            />
            
          )}
          </div>
          </div>
          
          {/* Bestätigungs-Modal für endgültiges Löschen */}
          {isConfirmOpen && (
            <div className="settings-overlay" role="presentation" onClick={() => setIsConfirmOpen(false)}>
            <section className="settings-pane" role="dialog" aria-modal="true" aria-labelledby="confirm-title" onClick={(e) => e.stopPropagation()} style={{textAlign: 'center'}}>
            <h2 id="confirm-title">Meldung endgültig löschen?</h2>
            <p style={{marginBottom: '20px'}}>Möchten Sie diese Meldung wirklich endgültig aus der Datenbank löschen? Diese Aktion kann nicht rückgängig gemacht werden.</p>
            <div style={{display: 'flex', gap: '10px', justifyContent: 'center'}}>
            <button 
            onClick={() => {
              if (issueToDelete !== null) {
                deleteIssue(issueToDelete, isArchiveMode, true);
              }
              setIsConfirmOpen(false);
              setIssueToDelete(null);
            }}
            style={{backgroundColor: 'var(--danger)', backgroundImage: 'none'}}
            >
            Löschen
            </button>
            <button 
            onClick={() => {
              setIsConfirmOpen(false);
              setIssueToDelete(null);
            }}
            style={{backgroundColor: 'var(--surface-strong)', backgroundImage: 'none', color: 'var(--text)'}}
            >
            Abbrechen
            </button>
            </div>
            </section>
            </div>
          )}
          </div>
          
        );
      }
      