import { useCallback, useEffect, useState } from 'react';

import { Map } from './library/ui/map';
import type { MapSummaryItem } from './library/ui/map';
// import { MapContainer, TileLayer, Marker } from 'react-leaflet';
// import L from 'leaflet';
// import 'leaflet/dist/leaflet.css';

// Konstanten und random U's importieren
import { rooms } from './library/constants/rooms';   // unnötig, weil ausgebaut
import { buildingCoordinates } from './library/constants/buildingCoordinates';
import { randomRptuLogo } from './library/utils/rptulogo';

// input importieren
import { useInput } from './library/hooks/useInput';    //eigentlich auch unnötig, weil ausgebaut
import { Searchbar } from './library/ui/searchbar';

// issue components importieren (jetzt auch mit pagination™)
import { Issue } from './library/types/Issue';
import { useIssueList } from './library/hooks/useIssueList';
import { IssueCard } from './library/ui/renderIssueCard';
import { useLoadIssues } from './library/hooks/useLoadIssues'; 
import type { LoadIssuesOptions } from './library/hooks/useLoadIssues';

// swiping & teile von Map
import { useViewMode } from './library/hooks/useViewMode';
import { useSwiping } from './library/hooks/useSwiping';

// Filter importieren
import { useFilter } from './library/hooks/useFilter';
import type { FilterOptionValues } from './library/hooks/useFilter';
import { useArchiveMode } from './library/hooks/useArchiveMode';
// Sortierung importieren
import { useSorting } from './library/hooks/useSorting';
// regristrierung login importieren
import { useRegistrationLogin } from './library/hooks/useRegistrationLogin';


import { useVerificationMessage } from './library/hooks/useVerificationMessage'; //kürzt unten um 1 Zeile, also insgesamt sinnlos
//    Vielleicht ist es aber später nützlich, sobald wir irgendeinen Teil der Verifikation auslagern


import { Reportunfall } from './library/ui/reportunfall'; // for Fun eine Zeile durch zwei ersetzt, aber macht den html teil übersichtlicher
import { RegistrationLogin } from './library/ui/ERRORregistrationLogin';
import { InputForm } from './library/ui/inputForm';
import { ViewModeButtons } from './library/ui/viewModeButtons';
//import { registerClient } from 'fuse/next/server'; brauchen wir den import? hat nur nen fehler geschmissen
import { SettingsButton } from './library/ui/settingsButton';
import { IssuePagination } from './library/ui/issuePagination';

type ThemePreference = "system" | "light" | "dark";

const THEME_STORAGE_KEY = "maengelmelder-theme-preference";
const ISSUE_PAGE_SIZE = 20;

function buildIssueQueryParams(options: LoadIssuesOptions) {
  const params = new URLSearchParams();

  if (options.archiv) params.set("archiv", "true");
  if (options.search) params.set("search", options.search);
  if (options.kategorie) params.set("kategorie", options.kategorie);
  if (options.status) params.set("status", options.status);
  if (options.location) params.set("location", options.location);
  if (options.onlyOwn) params.set("onlyOwn", "true");
  if (options.sort) params.set("sort", options.sort);
  if (options.direction) params.set("direction", options.direction);

  return params;
}

export default function App() {
  // List of issues
  const { issueList, setIssueList } = useIssueList(); //so müsste es richtig sein
  //const [issueList, setIssueList] = useState<Issue[]>([]);

  const { loadIssues, deleteIssue, pagination, isLoading: issuesLoading, error: issuesError } = useLoadIssues(setIssueList);

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
  const { viewMode, setViewMode } = useViewMode();

  // Archiv-Modus
  const { isArchiveMode, setIsArchiveMode } = useArchiveMode();

  // Views fuer Registrierung und Login
  const { userId, setUserId, userEmail, setUserEmail, userRole, setUserRole, emailVerified, setEmailVerified,
    authView, setAuthView, authEmail, setAuthEmail, authPassword, setAuthPassword,
    registerAsAdmin, setRegisterAsAdmin, adminCode, setAdminCode, authError, setAuthError, authMessage, setAuthMessage,
    voteError, setVoteError, settingsOpen, setSettingsOpen, settingsMessage, setSettingsMessage, settingsError, setSettingsError
  } = useRegistrationLogin();

  // Swiping using view mode
  const { handleTouchStart, handleTouchEnd } = useSwiping(viewMode, setViewMode, isArchiveMode, setIsArchiveMode, !!userId);


  // Suche läuft jetzt über das Backend, State bleibt hier für die Suchleiste
  const [searchView, setSearchView] = useState<"search" | null>(null);
  const [query, setQuery] = useState("");
  const normalizedSearchQuery = query.trim();
  const issuesToDisplay = issueList;
  const [backendFilterOptions, setBackendFilterOptions] = useState<FilterOptionValues>({});
  const [mapSummary, setMapSummary] = useState<MapSummaryItem[]>([]);

  //--> issuesToDisplay dann als input in useFilter
  //Variablen fuer Filterung und gefilterte Issues + Funktionen um Filter zu setzen
  const { currentFilter, currentFilterValue, possibleFilters, possibleFilterValues, chooseFilter, chooseFilterValue,
    filterOnlyOwn, setFilterOnlyOwn, setCurrentFilter, setCurrentFilterValue } = useFilter(issuesToDisplay, userEmail, isArchiveMode, backendFilterOptions);

  // Variablen fuer Sortierung und Sortiermodus + Funktionen um diese zu setten
  const { currentSorting, currentSortingMode, possibleSortings, possibleSortingModes, chooseSorting, chooseSortingMode } = useSorting(issuesToDisplay);
  const finalIssueList = issuesToDisplay;
  // finalIssueList kommt schon fertig gefiltert und sortiert aus dem Backend
  const { verificationMessage, setVerificationMessage, verificationMessageType, setVerificationMessageType } = useVerificationMessage();

  const resetFilterAndSorting = () => {
    chooseFilter("");
    chooseSorting("");
    setFilterOnlyOwn(false);
  };

  // reseting filter when switching to map view
  useEffect(() => {
    if (viewMode === "map") {
      chooseFilter("");
      setFilterOnlyOwn(false);
    }
  }, [viewMode]);

  // Statusfilter zurücksetzen, wenn er im aktuellen Archivmodus nicht angeboten wird
  useEffect(() => {
    if (currentFilter === "Status" && currentFilterValue && !possibleFilterValues.Status?.includes(currentFilterValue)) {
      setCurrentFilterValue("");
    }
  }, [currentFilter, currentFilterValue, possibleFilterValues.Status, setCurrentFilterValue]);

  // State für die Bestätigung der endgültigen Löschung
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [issueToDelete, setIssueToDelete] = useState<number | null>(null);

  // State für das gespeicherte Benachrichtigungs-Intervall
  const [notificationInterval, setNotificationInterval] = useState<number>(0);
  const [themePreference, setThemePreference] = useState<ThemePreference>(() => {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    return storedTheme === "light" || storedTheme === "dark" ? storedTheme : "system";
  });

  // übersetzt die deutschen UI-Filter in Backend-Query-Parameter
  const getBackendFilterOptions = useCallback((onlyOwnOverride: boolean = filterOnlyOwn): LoadIssuesOptions => {
    const filterOptions: LoadIssuesOptions = {};

    if (currentFilterValue) {
      if (currentFilter === "Kategorie") {
        filterOptions.kategorie = currentFilterValue;
      }

      if (currentFilter === "Ort") {
        filterOptions.location = currentFilterValue;
      }

      if (currentFilter === "Status") {
        filterOptions.status = currentFilterValue;
      }
    }

    if (onlyOwnOverride) {
      filterOptions.onlyOwn = true;
    }

    return filterOptions;
  }, [currentFilter, currentFilterValue, filterOnlyOwn]);

  // übersetzt die deutschen UI-Sortierungen in Backend-Query-Parameter
  const getBackendSortOptions = useCallback((): LoadIssuesOptions => {
    if (currentSorting === "Votes") {
      return {
        sort: "votes",
        direction: currentSortingMode === "Aufsteigend" ? "asc" : "desc",
      };
    }

    if (currentSorting === "Erstellungsdatum") {
      return {
        sort: "createdAt",
        direction: currentSortingMode === "Älteste zuerst" ? "asc" : "desc",
      };
    }

    if (currentSorting === "Status") {
      return {
        sort: "status",
        direction: currentSortingMode === "Aufsteigend" ? "asc" : "desc",
      };
    }

    return {};
  }, [currentSorting, currentSortingMode]);

  // lädt eine bestimmte Seite mit den aktuellen Archiv-Einstellungen
  const loadIssuePage = useCallback((page: number = pagination?.page ?? 1, archiv: boolean = isArchiveMode) => {
    loadIssues({
      archiv,
      page,
      pageSize: pagination?.pageSize ?? ISSUE_PAGE_SIZE,
      search: normalizedSearchQuery || undefined,
      ...getBackendFilterOptions(),
      ...getBackendSortOptions(),
    });
  }, [getBackendFilterOptions, getBackendSortOptions, isArchiveMode, loadIssues, normalizedSearchQuery, pagination?.page, pagination?.pageSize]);

  // Optionen für Reloads nach Aktionen wie Löschen, Voting oder Statuswechsel
  const getCurrentIssueLoadOptions = useCallback((page: number = pagination?.page ?? 1, archiv: boolean = isArchiveMode) => ({
    archiv,
    page,
    pageSize: pagination?.pageSize ?? ISSUE_PAGE_SIZE,
    search: normalizedSearchQuery || undefined,
    ...getBackendFilterOptions(),
    ...getBackendSortOptions(),
  }), [getBackendFilterOptions, getBackendSortOptions, isArchiveMode, normalizedSearchQuery, pagination?.page, pagination?.pageSize]);

  // Filterwerte vom Backend holen, damit Dropdowns nicht von der aktuellen Seite abhängen
  const fetchIssueFilterOptions = useCallback(async () => {
    const params = buildIssueQueryParams({
      archiv: isArchiveMode,
      search: normalizedSearchQuery || undefined,
      onlyOwn: filterOnlyOwn || undefined,
    });

    const queryString = params.toString();
    const res = await fetch(`/api/mangel/filter-options${queryString ? `?${queryString}` : ""}`);
    const data = await res.json();

    if (!res.ok) return null;

    return {
      Kategorie: data.kategorien,
      Ort: data.locations,
      Status: data.status,
    } as FilterOptionValues;
  }, [filterOnlyOwn, isArchiveMode, normalizedSearchQuery]);

  // Kartenzusammenfassung vom Backend holen, damit Marker alle Treffer zählen
  const fetchIssueMapSummary = useCallback(async () => {
    const params = buildIssueQueryParams(getCurrentIssueLoadOptions());
    params.delete("page");
    params.delete("pageSize");

    const queryString = params.toString();
    const res = await fetch(`/api/mangel/map-summary${queryString ? `?${queryString}` : ""}`);
    const data = await res.json();

    if (!res.ok) return null;

    return data as MapSummaryItem[];
  }, [getCurrentIssueLoadOptions]);

  // nach manuellem Seitenwechsel wieder nach oben zur Liste springen
  const changeIssuePage = (page: number) => {
    loadIssuePage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Für Status-Mails
  const updateNotificationInterval = async (interval: number) => {
    setSettingsError("");
    setSettingsMessage("");

    try {
      const res = await fetch("/api/auth/settings/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSettingsError(data.error || "Fehler beim Speichern der Benachrichtigungseinstellungen");
        return;
      }

      setSettingsMessage("Benachrichtigungs-Intervall aktualisiert!");
    } catch (err) {
      setSettingsError("Netzwerkfehler beim Speichern der Einstellungen");
    }
  };

  //const{loadIssues}=useLoadIssues();
  // const loadIssues = (archiv: boolean = false) => {
  //   fetch(`/api/mangel${archiv ? '?archiv=true' : ''}`)
  //     .then((res) => res.json())
  //     .then((data) => setIssueList(data));
  // };

  useEffect(() => {
    loadIssues({
      archiv: isArchiveMode,
      page: 1,
      pageSize: ISSUE_PAGE_SIZE,
      search: normalizedSearchQuery || undefined,
      ...getBackendFilterOptions(),
      ...getBackendSortOptions(),
    });
  }, [getBackendFilterOptions, getBackendSortOptions, isArchiveMode, loadIssues, normalizedSearchQuery]);

  useEffect(() => {
    let ignoreResult = false;

    async function loadFilterOptions() {
      const options = await fetchIssueFilterOptions();
      if (!ignoreResult && options) setBackendFilterOptions(options);
    }

    loadFilterOptions();

    return () => {
      ignoreResult = true;
    };
  }, [fetchIssueFilterOptions]);

  useEffect(() => {
    let ignoreResult = false;

    async function loadMapSummary() {
      const summary = await fetchIssueMapSummary();
      if (!ignoreResult && summary) setMapSummary(summary);
    }

    loadMapSummary();

    return () => {
      ignoreResult = true;
    };
  }, [fetchIssueMapSummary]);

  const refreshMapData = useCallback(async () => {
    const summary = await fetchIssueMapSummary();
    if (summary) setMapSummary(summary);
  }, [fetchIssueMapSummary]);

  useEffect(() => {
    const root = document.documentElement;

    if (themePreference === "system") {
      root.removeAttribute("data-theme");
      window.localStorage.removeItem(THEME_STORAGE_KEY);
      return;
    }

    root.dataset.theme = themePreference;
    window.localStorage.setItem(THEME_STORAGE_KEY, themePreference);
  }, [themePreference]);

  // beim Laden der Seite checken ob man eingeloggt ist um userID zu setzen
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
          setNotificationInterval(0);
          return null;
        }
      })
      .then((data) => {
        if (data) {
          setUserId(data.userId);
          setUserEmail(data.email);
          setUserRole(data.role || "user");
          setEmailVerified(Boolean(data.emailVerified));
          setNotificationInterval(data.notificationInterval ?? 0);
          loadIssues({
            archiv: isArchiveMode,
            page: 1,
            pageSize: ISSUE_PAGE_SIZE,
            search: normalizedSearchQuery || undefined,
            ...getBackendFilterOptions(),
            ...getBackendSortOptions(),
          });
        }
      })
      .catch(() => {
        setUserId(null);
        setUserEmail("");
        setUserRole("");
        setEmailVerified(false);
        setNotificationInterval(0);
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
      loadIssuePage(1, false);
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
      loadIssues({
        archiv: false,
        page: 1,
        pageSize: ISSUE_PAGE_SIZE,
        search: normalizedSearchQuery || undefined,
        ...getBackendFilterOptions(false),
        ...getBackendSortOptions(),
      });
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
        loadIssuePage();
        return;
      }
      
      // reload
      loadIssuePage();
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
      loadIssuePage();
      refreshMapData();
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

      <Reportunfall /> {/* Seitenüberschrift mit random RPTU U */}

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
                  <label className="settings-field">
                    <span>Darstellung</span>
                    <select
                      value={themePreference}
                      onChange={(e) => setThemePreference(e.target.value as ThemePreference)}
                    >
                      <option value="system">Browser-Setting</option>
                      <option value="light">Hell</option>
                      <option value="dark">Dunkel</option>
                    </select>
                  </label>

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

                      <label className="settings-field">
                        <span>Benachrichtigungen</span>
                        <select
                          value={notificationInterval}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setNotificationInterval(val); 
                            updateNotificationInterval(val); 
                          }}
                        >
                          <option value="0">Sofort</option>
                          <option value="1">Täglich</option>
                          <option value="7">Wöchentlich</option>
                          <option value="30">Monatlich</option>
                        </select>
                      </label>

                      {!emailVerified && (
                        <button type="button" onClick={resendVerificationEmail}>
                          Verifizierungs-E-Mail erneut senden
                        </button>
                      )}

                      {settingsMessage && <p className="success-text">{settingsMessage}</p>}
                      {settingsError && <p className="error-text">{settingsError}</p>}
                    </>
                  )}
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
            query={query}
            setQuery={setQuery}
            searchView={searchView}
            setSearchView={setSearchView}
            issuesToDisplay={issuesToDisplay}
          />


          {/* Input form nur sichtbar wenn man eingeloggt ist*/}
          {userId ? (

            <InputForm
              onIssueCreated={() => {
                loadIssuePage(1, false);
                refreshMapData(); 
              }}
            />

          ) : (
            <p className="login-hint">Bitte einloggen, um einen Mangel zu melden.</p>
          )}

          <div className='issue-toolbar'>
            {/* Filter Auswahl, Filter wird in einem Select-Feld gewaehlt */}
            <select
              className='issue-filter-select'
              value={currentFilter}
              onChange={(event) => chooseFilter(event.target.value)}
            >
              <option value="" disabled>Filter wählen</option>
              {possibleFilters.map((filter) => (
                <option key={filter} value={filter}>{filter}</option>
              ))}
              <option value=""> - Kein Filter - </option>
            </select>

            {/* in zweitem Select-Feld kann dann dynamisch einer der verfuegbaren Werte gewaehlt werden. */}
            {currentFilter ? (
              <select
                className='issue-filter-value-select'
                value={currentFilterValue}
                onChange={(event) => chooseFilterValue(currentFilter, event.target.value)}
              >
                <option value="" disabled>Wert wählen</option>
                {possibleFilterValues[currentFilter]?.map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            ) : null}
            <div className='divider'></div>
            {/* Sorting Auswahl, Sorting wird in einem Select-Feld gewaehlt */}
            <select
              className='issue-sorting-select'
              value={currentSorting}
              onChange={(event) => chooseSorting(event.target.value)}
            >
              <option value="" disabled>Sortierung wählen</option>
              {possibleSortings.map((sorting) => (
                <option key={sorting} value={sorting}>{sorting}</option>

              ))}
              <option value=""> - Keine Sortierung - </option>
            </select>

            {/* in zweitem Select-Feld kann dann ein entsprechender Sortiermodus gewählt werden */}
            {currentSorting ? (
              <select
                className='issue-sorting-mode-select'
                value={currentSortingMode}
                onChange={(event) => chooseSortingMode(currentSorting, event.target.value)}
              >

                {possibleSortingModes[currentSorting]?.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}

              </select>

            ) : null}
            <div className='issue-filter-only-own'>
              <button type="button" className="issue-filter-reset-button" onClick={resetFilterAndSorting}>Filter zurücksetzen</button>
              {userId && (
                <>
                <input type="checkbox" id="onlyOwnIssues" checked={filterOnlyOwn} onChange={(e) => setFilterOnlyOwn(e.target.checked)} />
                <label htmlFor="onlyOwnIssues" className='issue-filter-only-own-label'><p style={{ fontStyle: 'italic' }}>Nur eigene Mängel anzeigen</p></label>
                </>
              )}
            </div>
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
              {issuesError && <p className="error-text vote-error">{issuesError}</p>}
              {issuesLoading && <p className="meta-line issue-loading">Mängel werden geladen...</p>}
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
                          deleteIssue(id, isArchiveMode, false, getCurrentIssueLoadOptions());
                          refreshMapData();
                        }
                      }}
                      onUpvote={upvoteIssue}
                      onUpdateStatus={updateStatus}
                    />
                  ))}
              </ul>
              {pagination && (
                <IssuePagination
                  page={pagination.page}
                  total={pagination.total}
                  totalPages={pagination.totalPages}
                  isLoading={issuesLoading}
                  onPageChange={changeIssuePage}
                />
              )}
            </div>
          ) : (
            /* Map */
            <Map
              mapSummary={mapSummary}
              setViewMode={setViewMode}
              setCurrentFilter={setCurrentFilter}
              setCurrentFilterValue={setCurrentFilterValue}
            />

          )}
        </div>
      </div>

      {/* Bestätigungs-Modal für endgültiges Löschen */}
      {isConfirmOpen && (
        <div className="settings-overlay" role="presentation" onClick={() => setIsConfirmOpen(false)}>
          <section className="settings-pane" role="dialog" aria-modal="true" aria-labelledby="confirm-title" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center' }}>
            <h2 id="confirm-title">Meldung endgültig löschen?</h2>
            <p style={{ marginBottom: '20px' }}>Möchten Sie diese Meldung wirklich endgültig aus der Datenbank löschen? Diese Aktion kann nicht rückgängig gemacht werden.</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={async () => { 
                  if (issueToDelete !== null) {
                    await deleteIssue(issueToDelete, isArchiveMode, true, getCurrentIssueLoadOptions()); 
                    refreshMapData(); 
                  }
                  setIsConfirmOpen(false);
                  setIssueToDelete(null);
                }}
                style={{ backgroundColor: 'var(--danger)', backgroundImage: 'none' }}
              >
                Löschen
              </button>
              <button
                onClick={() => {
                  setIsConfirmOpen(false);
                  setIssueToDelete(null);
                }}
                style={{ backgroundColor: 'var(--surface-strong)', backgroundImage: 'none', color: 'var(--text)' }}
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
