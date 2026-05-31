import { useCallback, useEffect, useState } from 'react';

import { Map } from './library/ui/map';
import type { MapSummaryItem } from './library/ui/map';
// import { MapContainer, TileLayer, Marker } from 'react-leaflet';
// import L from 'leaflet';
// import 'leaflet/dist/leaflet.css';

// Konstanten und random U's importieren
import { randomRptuLogo } from './library/utils/rptulogo';

// input importieren
import { Searchbar } from './library/ui/searchbar';

// issue components importieren (jetzt auch mit pagination™)
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
// Liste der Mängel
  const { issueList, setIssueList } = useIssueList(); 

  const { loadIssues, deleteIssue, pagination, isLoading: issuesLoading, error: issuesError } = useLoadIssues(setIssueList);

  // Ansichtsmodus (Liste oder Karte)
  const { viewMode, setViewMode } = useViewMode();

  // Archiv-Modus
  const { isArchiveMode, setIsArchiveMode } = useArchiveMode();

  // Ansichten für Registrierung und Login
  const { userId, setUserId, userEmail, setUserEmail, userRole, setUserRole, emailVerified, setEmailVerified,
    authView, setAuthView, authEmail, setAuthEmail, authPassword, setAuthPassword,
    registerAsAdmin, setRegisterAsAdmin, adminCode, setAdminCode, authError, setAuthError, authMessage, setAuthMessage,
    voteError, setVoteError, settingsOpen, setSettingsOpen, settingsMessage, setSettingsMessage, settingsError, setSettingsError
  } = useRegistrationLogin();

  // Swiping zum Wechseln der Ansichten
  const { handleTouchStart, handleTouchEnd } = useSwiping(viewMode, setViewMode, isArchiveMode, setIsArchiveMode, !!userId);


  // Suche über das Backend
  const [searchView, setSearchView] = useState<"search" | null>(null);
  const [query, setQuery] = useState("");
  const normalizedSearchQuery = query.trim();
  const issuesToDisplay = issueList;
  const [backendFilterOptions, setBackendFilterOptions] = useState<FilterOptionValues>({});
  const [mapSummary, setMapSummary] = useState<MapSummaryItem[]>([]);

  // Variablen für Filterung und Funktionen zum Setzen der Filter
  const { currentFilter, currentFilterValue, possibleFilters, possibleFilterValues, chooseFilter, chooseFilterValue,
    filterOnlyOwn, setFilterOnlyOwn, setCurrentFilter, setCurrentFilterValue } = useFilter(issuesToDisplay, userEmail, isArchiveMode, backendFilterOptions);

  // Variablen für Sortierung und Funktionen zum Setzen der Sortierung
  const { currentSorting, currentSortingMode, possibleSortings, possibleSortingModes, chooseSorting, chooseSortingMode } = useSorting(issuesToDisplay);
  const finalIssueList = issuesToDisplay;
  
  // Nachrichten für die Benutzer-Verifizierung
  const { verificationMessage, setVerificationMessage, verificationMessageType, setVerificationMessageType } = useVerificationMessage();

  const resetFilterAndSorting = useCallback(() => {
    chooseFilter("");
    chooseSorting("");
    setFilterOnlyOwn(false);
  }, [chooseFilter, chooseSorting, setFilterOnlyOwn]);

  // Filter zurücksetzen beim Wechsel zur Kartenansicht
  useEffect(() => {
    if (viewMode === "map") {
      chooseFilter("");
      setFilterOnlyOwn(false);
    }
  }, [viewMode, chooseFilter, setFilterOnlyOwn]);

  // Statusfilter zurücksetzen, wenn er im aktuellen Archivmodus nicht angeboten wird
  useEffect(() => {
    if (currentFilter === "Status" && currentFilterValue && !possibleFilterValues.Status?.includes(currentFilterValue)) {
      setCurrentFilterValue("");
    }
  }, [currentFilter, currentFilterValue, possibleFilterValues.Status, setCurrentFilterValue]);

  // State für die Bestätigung der endgültigen Löschung
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [issueToDelete, setIssueToDelete] = useState<number | null>(null);

  // State für das Input-Modal
  const [showInputModal, setShowInputModal] = useState(false);

  // State für das gespeicherte Benachrichtigungs-Intervall
  const [notificationInterval, setNotificationInterval] = useState<number>(0);
  const [themePreference, setThemePreference] = useState<ThemePreference>(() => {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    return storedTheme === "light" || storedTheme === "dark" ? storedTheme : "system";
  });

  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
    } catch {
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

      const filterContent = (
      <div className="sidebar-content">
        {/* Filter Auswahl, Filter wird in einem Select-Feld gewaehlt */}
        <h3>Filter & Sortierung</h3>
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

        {currentFilter && (
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
        )}

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

        {currentSorting && (
          <select
            className='issue-sorting-mode-select'
            value={currentSortingMode}
            onChange={(event) => chooseSortingMode(currentSorting, event.target.value)}
          >
            {possibleSortingModes[currentSorting]?.map((mode) => (
              <option key={mode} value={mode}>{mode}</option>
            ))}
          </select>
        )}

        <button type="button" className="issue-filter-reset-button" onClick={resetFilterAndSorting} style={{ width: '100%', margin: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
            <path d="M3 3v5h5"></path>
          </svg>
          Filter zurücksetzen
        </button>
        {userId && (
          <div className="issue-filter-only-own" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
            <input type="checkbox" id="onlyOwnIssues" checked={filterOnlyOwn} onChange={(e) => setFilterOnlyOwn(e.target.checked)} />
            <label htmlFor="onlyOwnIssues" style={{ fontSize: '14px', fontStyle: 'italic' }}>Nur eigene Mängel anzeigen</label>
          </div>
        )}
      </div>
      );

      const accountContent = (
      <div className="sidebar-content">
        <h3>Account</h3>
        {/* Buttons fuer Login/Logout/Register, Anzeige der email mit der man eingeloggt ist*/}
        {userId ? (
          <div className="auth-card" style={{ width: '100%', margin: '0' }}>
            {/* Wenn man eingeloggt ist: logout und einstellungen*/}
            <p className="auth-status" style={{ marginBottom: '10px' }}>
              Eingeloggt als<br />
              <strong>{userEmail}</strong><br />
              <small>({userRole === "admin" ? "Admin" : "Nutzer"})</small>
            </p>
            <button className='logout-button' onClick={logout} style={{ width: '100%' }}>Logout</button>
          </div>
        ) : (
          <div className="auth-forms">
            {/* Wenn man nicht eingeloggt ist: login und register */}
            {!authView ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <p className="login-hint">Bitte einloggen, um einen Mangel zu melden.</p>
                <button onClick={() => setAuthView("login")}>Login</button>
                <button onClick={() => setAuthView("register")}>Registrieren</button>
              </div>
            ) : (
              <>
                <form
                  className="auth-card"
                  onSubmit={authView === "login" ? login : register}
                  style={{ width: '100%', margin: '0' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h2 style={{ fontSize: '18px', margin: '0' }}>{authView === "login" ? "Login" : "Registrieren"}</h2>
                    <button type="button" onClick={() => setAuthView(null)} style={{ background: 'transparent', color: 'var(--text)', padding: '0', boxShadow: 'none' }}>X</button>
                  </div>

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
              </>
            )}
          </div>
        )}
      </div>
      );

      // UI
      return (
      <div className={`app-layout ${isMenuOpen ? 'menu-open' : ''}`}
        /* Event Listener for swiping between Tabs */
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseUp={handleTouchEnd}
      >
        <header className="mobile-header">
          <Reportunfall />
          <button 
            className="hamburger-menu-btn" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Menü öffnen"
          >
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </header>

        {isMenuOpen && (
          <div className="mobile-menu-overlay" onClick={() => setIsMenuOpen(false)}>
            <aside className="mobile-menu-content" onClick={(e) => e.stopPropagation()}>
              <div className="mobile-menu-header">
                <Reportunfall />
                <button className="mobile-menu-close" onClick={() => setIsMenuOpen(false)}>X</button>
              </div>
              <div className="mobile-menu-scroll">
                <div className="mobile-menu-settings">
                   <SettingsButton setSettingsOpen={setSettingsOpen} />
                   <span>Einstellungen</span>
                </div>
                {filterContent}
                {accountContent}
              </div>
            </aside>
          </div>
        )}

        <aside className="sidebar-left">
          <div className="sidebar-header">
            <Reportunfall /> {/* Seitenüberschrift mit random RPTU U */}
          </div>
          {filterContent}
        </aside>

        <main className="main-content">
          <header className="main-header">
            <div className="header-view-switch">
              <ViewModeButtons
                userId={userId}
                viewMode={viewMode}
                setViewMode={setViewMode}
                isArchiveMode={isArchiveMode}
                setIsArchiveMode={setIsArchiveMode}
              />
            </div>
            <div className="header-search">
                          {/* Suchleiste  "kürzer" naja nicht wirklich, aber netter anzuschauen*/}
              <Searchbar
                query={query}
                setQuery={setQuery}
                searchView={searchView}
                setSearchView={setSearchView}
                issuesToDisplay={issuesToDisplay}
              />
            </div>
          </header>

        {verificationMessage && (
          <p className={`verification-notice verification-${verificationMessageType}`}>
            {verificationMessage}
          </p>
        )}

        <div className='issue-display-area'>
          {viewMode === 'list' ? (
            <div>
              {voteError && <p className="error-text vote-error">{voteError}</p>}
              {issuesError && <p className="error-text vote-error">{issuesError}</p>}
              {issuesLoading && <p className="meta-line issue-loading">Mängel werden geladen...</p>}
              <ul className="issue-list">
                {finalIssueList.map((issue, index) => (
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
            <Map
              mapSummary={mapSummary}
              setViewMode={setViewMode}
              setCurrentFilter={setCurrentFilter}
              setCurrentFilterValue={setCurrentFilterValue}
            />
          )}
        </div>

        {userId && (
          <button
            className="floating-add-btn"
            onClick={() => setShowInputModal(true)}
            title="Mangel melden"
          >
            +
          </button>
        )}
      </main>

      <aside className="sidebar-right">
        <div className="sidebar-header" style={{ justifyContent: 'center' }}>
          <SettingsButton     //ausgelagert, braucht setSettingsOpen
            setSettingsOpen={setSettingsOpen}
          />
        </div>
        
        {accountContent}
      </aside>

      {/* Input Pop-up */}
      {showInputModal && (
        <div className="modal-overlay" onClick={() => setShowInputModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setShowInputModal(false)}>X</button>
            <h2 style={{ marginBottom: '20px' }}>Mangel melden</h2>
            {/* Input form nur sichtbar wenn man eingeloggt ist*/}
            <InputForm
              onIssueCreated={() => {
                loadIssuePage(1, false);
                setShowInputModal(false);
              }}
            />
          </div>
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
