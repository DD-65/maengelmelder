import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
//Endlich fertig
import type { MapSummaryItem } from './library/ui/map';
// import { MapContainer, TileLayer, Marker } from 'react-leaflet';
// import L from 'leaflet';
// import 'leaflet/dist/leaflet.css';

// Konstanten und random U's importieren
// import { randomRptuLogo } from './library/utils/rptulogo';

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
// Management View
import { ConfirmDialog } from './library/ui/confirmDialog';
import { useManagementMode } from './library/hooks/useManagementMode';

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
import { Newsfeed } from './library/ui/newsfeed';

import { Reportunfall } from './library/ui/reportunfall'; // for Fun eine Zeile durch zwei ersetzt, aber macht den html teil übersichtlicher
import { ViewModeButtons } from './library/ui/viewModeButtons';
import { UsersList } from './library/ui/usersList';
//import { registerClient } from 'fuse/next/server'; brauchen wir den import? hat nur nen fehler geschmissen
import { SettingsButton } from './library/ui/settingsButton';
import { IssuePagination } from './library/ui/issuePagination';
import { getSecondaryUserColor, getUserColor } from './library/utils/getUserColor';

import { toast } from 'react-toastify';

import { useNewsList } from './library/hooks/useNewsList';

import { UserProfile } from './library/ui/userProfile';

const Map = lazy(() => import('./library/ui/map').then((module) => ({ default: module.Map })));
const Management = lazy(() => import('./library/ui/management').then((module) => ({ default: module.Management })));
const InputForm = lazy(() => import('./library/ui/inputForm').then((module) => ({ default: module.InputForm })));

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
  if (options.followedOnly) params.set("followedOnly", "true");
  if (options.followedUser) params.set("followedUser", options.followedUser);
  if (options.sort) params.set("sort", options.sort);
  if (options.direction) params.set("direction", options.direction);

  return params;
}

export default function App() {
  //für die News
  const{newsList, setNewsList}=useNewsList();
  // Liste der Mängel
  const { issueList, setIssueList } = useIssueList(); 

  const { loadIssues, deleteIssue, pagination, isLoading: issuesLoading, error: issuesError } = useLoadIssues(setIssueList);

  // Ansichtsmodus (Liste oder Karte)
  const { viewMode, setViewMode } = useViewMode();

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [canScrollTop, setCanScrollTop] = useState(false);
  const [canScrollBottom, setCanScrollBottom] = useState(false);

  const checkScroll = useCallback(() => {
    if (scrollAreaRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current;
      setCanScrollTop(scrollTop > 0);
      setCanScrollBottom(scrollTop + clientHeight < scrollHeight - 1);
    }
  }, []);

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [checkScroll, issueList, viewMode]);

  // Archiv-Modus
  const { isArchiveMode, setIsArchiveMode } = useArchiveMode();
  // Management-Modus
  const { isManagementMode, setIsManagementMode } = useManagementMode();

  // Ansichten für Registrierung und Login
  const { userId, setUserId, userEmail, setUserEmail, userRole, setUserRole, isRestricted, setIsRestricted, emailVerified, setEmailVerified,
    authView, setAuthView, authEmail, setAuthEmail, authPassword, setAuthPassword, authPasswordConfirm, setAuthPasswordConfirm, resetToken, setResetToken,
    // registerAsAdmin, setRegisterAsAdmin, adminCode, setAdminCode, 
    authError, setAuthError, authMessage, setAuthMessage,
    voteError, setVoteError, settingsOpen, setSettingsOpen, settingsMessage, setSettingsMessage, settingsError, setSettingsError
  } = useRegistrationLogin();

  // Swiping zum Wechseln der Ansichten
  const { handleTouchStart, handleTouchEnd } = useSwiping(viewMode, setViewMode, isArchiveMode, setIsArchiveMode, isManagementMode, setIsManagementMode, !!userId);

  // User Profile
  const [profileOpen, setProfileOpen] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userProfilePic, setUserProfilePic] = useState<string | null>(null);


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

  const [filterFollowedOnly, setFilterFollowedOnly] = useState(false);

  const resetFilterAndSorting = useCallback(() => {
    chooseFilter("");
    chooseSorting("");
    setFilterOnlyOwn(false);
    setFilterFollowedOnly(false);
  }, [chooseFilter, chooseSorting, setFilterOnlyOwn, setFilterFollowedOnly]);

  // Filter zurücksetzen beim Wechsel zur Kartenansicht
  useEffect(() => {
    if (viewMode === "map") {
      chooseFilter("");
      setFilterOnlyOwn(false);
      setFilterFollowedOnly(false);
    }
  }, [viewMode, chooseFilter, setFilterOnlyOwn, setFilterFollowedOnly]);

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
  
  // State für die Moderation
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [issueToReport, setIssueToReport] = useState<number | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [restrictedReportLimitReached, setRestrictedReportLimitReached] = useState(false);

  // State für das gespeicherte Benachrichtigungs-Intervall
  const [notificationInterval, setNotificationInterval] = useState<number>(0);
  const [showOnLeaderboard, setShowOnLeaderboard] = useState(true);
  const [themePreference, setThemePreference] = useState<ThemePreference>(() => {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    return storedTheme === "light" || storedTheme === "dark" ? storedTheme : "system";
  });

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // übersetzt die deutschen UI-Filter in Backend-Query-Parameter
  const getBackendFilterOptions = useCallback((onlyOwnOverride: boolean = filterOnlyOwn, followedOnlyOverride: boolean = filterFollowedOnly): LoadIssuesOptions => {
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

      if (currentFilter === "Gefolgte User") {
        filterOptions.followedUser = currentFilterValue;
      }
    }

    if (onlyOwnOverride) {
      filterOptions.onlyOwn = true;
    }

    if (followedOnlyOverride) {
      filterOptions.followedOnly = true;
    }

    return filterOptions;
  }, [currentFilter, currentFilterValue, filterOnlyOwn, filterFollowedOnly]);

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
      "Gefolgte User": data.followedUsers,
    } as FilterOptionValues;
  }, [filterOnlyOwn, isArchiveMode, normalizedSearchQuery]);

  // Filterwerte neu laden, z.B. nachdem einem Account gefolgt/entfolgt wurde
  const refreshFilterOptions = useCallback(async () => {
    const options = await fetchIssueFilterOptions();
    if (options) setBackendFilterOptions(options);
  }, [fetchIssueFilterOptions]);

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
        toast.error(`🫪 ${data.error || "Fehler beim Speichern der Benachrichtigungseinstellungen"}`);
        return;
      }

      setSettingsMessage("Benachrichtigungs-Intervall aktualisiert!");
      // Toast Notification
      toast.success("Benachrichtigungs-Intervall aktualisiert!");
    } catch {
      setSettingsError("Fehler beim Speichern der Einstellungen");
      // Toast Notification
      toast.error("🫪 Fehler beim Speichern der Einstellungen");
    }
  };

  const updateLeaderboardPreference = async (nextValue: boolean) => {
    const previousValue = showOnLeaderboard;
    setShowOnLeaderboard(nextValue);
    setSettingsError("");
    setSettingsMessage("");

    try {
      const res = await fetch("/api/auth/settings/leaderboard", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showOnLeaderboard: nextValue }),
      });

      const data = await res.json();

      if (!res.ok) {
        setShowOnLeaderboard(previousValue);
        setSettingsError(data.error || "Fehler beim Speichern der Bestenlisten-Einstellung");
        toast.error(`🫪 ${data.error || "Fehler beim Speichern der Bestenlisten-Einstellung"}`);
        return false;
      }

      setSettingsMessage("Bestenlisten-Einstellung aktualisiert!");
      return true;
    } catch {
      setShowOnLeaderboard(previousValue);
      setSettingsError("Fehler beim Speichern der Bestenlisten-Einstellung");
      toast.error("🫪 Fehler beim Speichern der Bestenlisten-Einstellung");
      return false;
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
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (res.ok) {
          return res.json();
        } else {
          setUserId(null);
          setUserEmail("");
          setUserRole("");
          setIsRestricted(false);
          setEmailVerified(false);
          setNotificationInterval(0);
          setShowOnLeaderboard(true);
          return null;
        }
      })
      .then((data) => {
        if (data) {
          setUserId(data.userId);
          setUserEmail(data.email);
          setUserName(data.username || null);
          setUserProfilePic(data.profile_pic_url || null);
          setUserRole(data.role || "user");
          setIsRestricted(Boolean(data.isRestricted));
          setEmailVerified(Boolean(data.emailVerified));
          setNotificationInterval(data.notificationInterval ?? 0);
          setShowOnLeaderboard(Boolean(data.showOnLeaderboard ?? true));
          loadIssues({
            archiv: isArchiveMode,
            page: 1,
            pageSize: ISSUE_PAGE_SIZE,
            search: normalizedSearchQuery || undefined,
            ...getBackendFilterOptions(),
            ...getBackendSortOptions(),
          });
          refreshMapData();
        }
      })
      .catch(() => {
        setUserId(null);
        setUserEmail("");
        setUserRole("");
        setIsRestricted(false);
        setEmailVerified(false);
        setNotificationInterval(0);
        setShowOnLeaderboard(true);
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
          toast.error(`🫪 ${data.error || "E-Mail-Verifizierung fehlgeschlagen"}`);
          return;
        }

        setVerificationMessage(data.message || "E-Mail-Adresse erfolgreich verifiziert");
        setVerificationMessageType("success");
        setEmailVerified(true);
        toast.success("E-Mail-Adresse erfolgreich verifiziert");

        fetch('/api/auth/me')
          .then((meRes) => meRes.ok ? meRes.json() : null)
          .then((meData) => {
            if (!meData) return;
            setUserId(meData.userId);
            setUserEmail(meData.email);
            setUserName(meData.username || null);
            setUserProfilePic(meData.profile_pic_url || null);
            setUserRole(meData.role || "user");
            setIsRestricted(Boolean(meData.isRestricted));
            setEmailVerified(Boolean(meData.emailVerified));
            setShowOnLeaderboard(Boolean(meData.showOnLeaderboard ?? true));
          });
      })
      .catch(() => {
        setVerificationMessage("E-Mail-Verifizierung fehlgeschlagen");
        setVerificationMessageType("error");
        toast.error("🫪 E-Mail-Verifizierung fehlgeschlagen");
      });
    }, []);

  // Passwort vergessen aus der E-Mail verarbeiten
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (window.location.pathname !== "/reset-password" || !token) return;

    window.history.replaceState({}, "", "/");
    setResetToken(token);
    setAuthView("resetPassword");
    }, []);

    
    // login handler
    const login = async (event: React.FormEvent) => {
      event.preventDefault();
      setAuthError("");
      setAuthMessage("");

      try {
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
          toast.error(`🫪 ${data.error || "Login fehlgeschlagen"}`);
          return;
        }
        
        setUserId(data.userId);
        setUserEmail(data.email);
        setUserName(data.username || null);
        setUserProfilePic(data.profile_pic_url || null);
        setUserRole(data.role || "user");
        setIsRestricted(Boolean(data.isRestricted));
        setRestrictedReportLimitReached(false);
        setEmailVerified(Boolean(data.emailVerified));
        setShowOnLeaderboard(Boolean(data.showOnLeaderboard ?? true));
        setAuthEmail("");
        setAuthPassword("");
        setAuthView(null);
        toast.success("Login erfolgreich");
        loadIssuePage(1, false);
      } catch {
        setAuthError("Netzwerkfehler beim Login");
        toast.error("🫪 Netzwerkfehler beim Login");
      }
    };
    
    //Registrierungs-handler
    const register = async (event: React.FormEvent) => {
      event.preventDefault();
      setAuthError("");
      setAuthMessage("");

      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: authEmail,
            password: authPassword,
            // adminSecret: registerAsAdmin ? adminCode : undefined, --> wird zukünftig direkt von superadmin gesetzt
          }),
        });
        
        const data = await res.json();
        
        if (!res.ok) {
          setAuthError(data.error || "Registrierung fehlgeschlagen");
          toast.error(`🫪 ${data.error || "Registrierung fehlgeschlagen"}`);
          return;
        }
        
        setAuthEmail("");
        setAuthPassword("");
        // setAdminCode("");
        // setRegisterAsAdmin(false);
        setAuthMessage(data.message || "Registrierung erfolgreich. Bitte bestätige deine E-Mail-Adresse.");
        toast.success(data.message || "Registrierung erfolgreich. Bitte bestätige deine E-Mail-Adresse.");
        setAuthView("login");
      } catch {
        setAuthError("Netzwerkfehler bei der Registrierung");
        toast.error("🫪 Netzwerkfehler bei der Registrierung");
      }
    };

    // Passwort vergessen handler
    const forgotPassword = async (event: React.FormEvent) => {
      event.preventDefault();
      setAuthError("");
      setAuthMessage("");

      try {
        const res = await fetch("/api/auth/request-password-reset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: authEmail,
          }),
        });
        
        const data = await res.json();
        
        if (!res.ok) {
          setAuthError(data.error || "Email zur Passwortzurücksetzung konnte nicht gesendet werden");
          toast.error(`🫪 ${data.error || "Email zur Passwortzurücksetzung konnte nicht gesendet werden"}`);
          return;
        }
        setAuthMessage(data.message || "Email zur Passwortzurücksetzung wurde gesendet");
        toast.success(data.message || "Email zur Passwortzurücksetzung wurde gesendet");
      } catch {
        setAuthError("Netzwerkfehler beim Senden der Passwortzurücksetzungs-E-Mail");
        toast.error("🫪 Netzwerkfehler beim Senden der Passwortzurücksetzungs-E-Mail");
      }
    };

        // Passwort zurücksetzen handler
    const resetPassword = async (event: React.FormEvent) => {
      event.preventDefault();
      setAuthError("");
      setAuthMessage("");

      try {
        const res = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            newPassword1: authPassword,
            newPassword2: authPasswordConfirm,
            mailToken: resetToken
          }),
        });
        
        const data = await res.json();
        
        if (!res.ok) {
          setAuthError(data.error || "Passwort konnte nicht zurückgesetzt werden");
          toast.error(`🫪 ${data.error || "Passwort konnte nicht zurückgesetzt werden"}`);
          return;
        }
        setAuthMessage(data.message || "Passwort erfolgreich zurückgesetzt. Bitte logge dich ein.");
        toast.success(data.message || "Passwort erfolgreich zurückgesetzt. Bitte logge dich ein.");
        setAuthPassword("");
        setAuthPasswordConfirm("");
        setResetToken("");
        setAuthView("login");
      } catch {
        setAuthError("Netzwerkfehler beim Zurücksetzen des Passworts");
        toast.error("🫪 Netzwerkfehler beim Zurücksetzen des Passworts");
      }
    };


    // logout handler
    const logout = async () => {
      try {
        const res = await fetch("/api/auth/logout", { method: "POST" });
        const data = await res.json().catch(() => null);

        if (!res.ok) {
          toast.error(`🫪 ${data?.error || "Logout fehlgeschlagen"}`);
          return;
        }

        setUserId(null);
        setUserEmail("");
        setUserRole("");
        setUserName(null);
        setUserProfilePic(null);
        setIsRestricted(false);
        setRestrictedReportLimitReached(false);
        setEmailVerified(false);
        setShowOnLeaderboard(true);
        setFilterOnlyOwn(false);
        setIssueList([]);
        toast.success("Erfolgreich ausgeloggt");
        loadIssues({
          archiv: false,
          page: 1,
          pageSize: ISSUE_PAGE_SIZE,
          search: normalizedSearchQuery || undefined,
          ...getBackendFilterOptions(false),
          ...getBackendSortOptions(),
        });

        refreshMapData();
      } catch {
        toast.error("🫪 Netzwerkfehler beim Logout");
      }
    };
    
    const resendVerificationEmail = async () => {
      setSettingsError("");
      setSettingsMessage("");

      try {
        const res = await fetch("/api/auth/resend-verification-email", {
          method: "POST",
        });
        
        const data = await res.json();
        
        if (!res.ok) {
          setSettingsError(data.error || "Verifizierungs-E-Mail konnte nicht gesendet werden");
          toast.error(`🫪 ${data.error || "Verifizierungs-E-Mail konnte nicht gesendet werden"}`);
          return;
        }
        
        setEmailVerified(Boolean(data.emailVerified));
        setSettingsMessage(data.message || "Verifizierungs-E-Mail wurde gesendet");
        toast.success(data.message || "Verifizierungs-E-Mail wurde gesendet");
      } catch {
        setSettingsError("Netzwerkfehler beim Senden der Verifizierungs-E-Mail");
        toast.error("🫪 Netzwerkfehler beim Senden der Verifizierungs-E-Mail");
      }
    };  
    
    const toggleUpvote = async (id: number) => {
      setVoteError("");

      try {
        // request
        const res = await fetch(`/api/mangel/${id}/vote`, { method: 'PATCH' });
        const data = await res.json();
        
        if (!res.ok) {
          setVoteError(data.error || "Fehler beim Bewerten");
          toast.error(`🫪 ${data.error || "Fehler beim Bewerten"}`);
          loadIssuePage();
          return;
        }
        
        // reload
        toast.success(data.message || "Bewertung aktualisiert");
        loadIssuePage();
      } catch {
        setVoteError("Netzwerkfehler beim Bewerten");
        toast.error("🫪 Netzwerkfehler beim Bewerten");
      }
    };

    const togglePrivacy = async (id: number, currentPrivacy: boolean) => {
      try {
        const res = await fetch(`/api/mangel/${id}/privacy`, { 
          method: 'PATCH',
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isPrivate: !currentPrivacy })
        });
        const data = await res.json();
        
        if (!res.ok) {
          toast.error(`🫪 ${data.error || "Fehler beim Ändern der Sichtbarkeit"}`);
          return;
        }
        
        toast.success(data.message);
        loadIssuePage();
        refreshMapData(); 
      } catch {
        toast.error("🫪 Netzwerkfehler beim Ändern der Sichtbarkeit");
      }
    };

    const submitReport = async () => {
    if (!issueToReport || !reportReason.trim()) {
      toast.error("🫪 Bitte gib eine Begründung ein.");
      return;
    }

    try {
      const res = await fetch(`/api/mangel/${issueToReport}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportReason })
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          setRestrictedReportLimitReached(true);
          setIsReportModalOpen(false);
          setIssueToReport(null);
          setReportReason("");
        }
        toast.error(`🫪 ${data.error || "Fehler beim Senden der Meldung"}`);
        return;
      }

      if (isRestricted) {
        setRestrictedReportLimitReached(true);
      }
      toast.success(data.message || "Mangel erfolgreich gemeldet");
      setIsReportModalOpen(false);
      setIssueToReport(null);
      setReportReason("");
    } catch {
      toast.error("🫪 Netzwerkfehler beim Senden der Meldung");
    }
  };
    

      // Gemeinsame Styles für die Container-Cards in der Sidebar
      const sidebarCardStyle: React.CSSProperties = {
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '14px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      };

      // Styles für die Card-Überschriften
      const sidebarHeaderStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        margin: '0',
        fontSize: '16px',
        color: 'var(--text-h)'
      };

      const filterContent = (
      <div className="sidebar-content" style={{ gap: '16px' }}>
        
        {/* --- FILTER SEKTION --- */}
        {/* Container-Card für alle Filter-Optionen */}
        <div style={sidebarCardStyle}>
          <h3 style={sidebarHeaderStyle}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
            </svg>
            Filter
          </h3>

          {/* Auswahl des Filter-Typs (Kategorie, Ort, etc.) */}
          <select
            className='issue-filter-select'
            value={currentFilter}
            onChange={(event) => chooseFilter(event.target.value)}
            style={{ width: '100%' }}
          >
            <option value="" disabled>Filter wählen</option>
            {possibleFilters.map((filter) => (
              <option key={filter} value={filter}>{filter}</option>
            ))}
            <option value=""> - Kein Filter - </option>
          </select>

          {/* Auswahl des konkreten Filter-Werts (erscheint nur, wenn ein Typ gewählt wurde) */}
          {currentFilter && (
            <select
              className='issue-filter-value-select'
              value={currentFilterValue}
              onChange={(event) => chooseFilterValue(currentFilter, event.target.value)}
              style={{ width: '100%' }}
            >
              <option value="" disabled>Wert wählen</option>
              {possibleFilterValues[currentFilter]?.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          )}
        </div>

        {/* --- SORTIERUNG SEKTION --- */}
        {/* Container-Card für alle Sortier-Optionen */}
        <div style={sidebarCardStyle}>
          <h3 style={sidebarHeaderStyle}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6"></line>
              <line x1="8" y1="12" x2="21" y2="12"></line>
              <line x1="8" y1="18" x2="21" y2="18"></line>
              <line x1="3" y1="6" x2="3.01" y2="6"></line>
              <line x1="3" y1="12" x2="3.01" y2="12"></line>
              <line x1="3" y1="18" x2="3.01" y2="18"></line>
            </svg>
            Sortierung
          </h3>

          {/* Auswahl des Feldes, nach dem sortiert werden soll */}
          <select
            className='issue-sorting-select'
            value={currentSorting}
            onChange={(event) => chooseSorting(event.target.value)}
            style={{ width: '100%' }}
          >
            <option value="" disabled>Sortierung wählen</option>
            {possibleSortings.map((sorting) => (
              <option key={sorting} value={sorting}>{sorting}</option>
            ))}
            <option value=""> - Keine Sortierung - </option>
          </select>

          {/* Auswahl der Richtung (Aufsteigend/Absteigend) */}
          {currentSorting && (
            <select
              className='issue-sorting-mode-select'
              value={currentSortingMode}
              onChange={(event) => chooseSortingMode(currentSorting, event.target.value)}
              style={{ width: '100%' }}
            >
              {possibleSortingModes[currentSorting]?.map((mode) => (
                <option key={mode} value={mode}>{mode}</option>
              ))}
            </select>
          )}
        </div>

        {/* Button zum kompletten Zurücksetzen aller Einstellungen */}
        <button type="button" className="issue-filter-reset-button" onClick={resetFilterAndSorting} style={{ width: '100%', margin: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
            <path d="M3 3v5h5"></path>
          </svg>
          Filter zurücksetzen
        </button>

        {/* Checkbox für "Nur eigene Mängel" (nur sichtbar für eingeloggte User) */}
        {userId && (
          <div>
          {/* <div className="issue-filter-only-own" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
            <input type="checkbox" id="onlyOwnIssues" checked={filterOnlyOwn} onChange={(e) => setFilterOnlyOwn(e.target.checked)} />
            <label htmlFor="onlyOwnIssues" style={{ fontSize: '14px', fontStyle: 'italic' }}>Nur eigene Mängel anzeigen</label>
          </div> */}
          <span style={{fontSize: '14px', fontStyle: 'italic'}}>          
            <label className="issue-filter-switch" style={{ fontSize: '10px', marginRight:'5px', top: '-3px' }} >
            <input type="checkbox" id="onlyOwnIssues" checked={filterOnlyOwn} onChange={(e) => setFilterOnlyOwn(e.target.checked)}/>
            <span className="issue-filter-slider"></span>
            </label>
          Nur eigene Mängel
          </span>
          </div>
        )}

        {/* Checkbox für "Nur von gefolgten Accounts" (nur sichtbar für eingeloggte User) */}
        {userId && (
          <div>
          {/* <div className="issue-filter-followed-only" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
            <input type="checkbox" id="followedOnlyIssues" checked={filterFollowedOnly} onChange={(e) => setFilterFollowedOnly(e.target.checked)} />
            <label htmlFor="followedOnlyIssues" style={{ fontSize: '14px', fontStyle: 'italic' }}>nur von gefolgten Accounts</label>
          </div> */}


          <span style={{fontSize: '14px', fontStyle: 'italic'}}>          
            <label className="issue-filter-switch" style={{ fontSize: '10px', marginRight:'5px', top: '-3px' }} >
            <input type="checkbox" id="followedOnlyIssues" checked={filterFollowedOnly} onChange={(e) => setFilterFollowedOnly(e.target.checked)}/>
            <span className="issue-filter-slider"></span>
            </label>
          Nur von gefolgten Accounts
          </span>
          </div>

        )}
      </div>
      );

      const accountContent = !userId ? (
      <div className="sidebar-content">
        <div style={sidebarCardStyle}>
          <h3 style={sidebarHeaderStyle}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            Account
          </h3>
          
          {!authView ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <p className="login-hint" style={{ margin: '0 0 5px', fontSize: '14px' }}>Bitte einloggen, um einen Mangel zu melden.</p>
              <button onClick={() => setAuthView("login")}>Login</button>
              <button onClick={() => setAuthView("register")}>Registrieren</button>
              {/* <button onClick={() => setAuthView("resetPassword")}>Passwort zurücksetzen</button> */}
            </div>
          ) : (
            <form
              onSubmit={authView === "login" ? login : authView === "register" ? register : authView === "forgotPassword" ? forgotPassword : resetPassword}
              style={{ width: '100%', margin: '0', display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <h2 style={{ fontSize: '18px', margin: '0', color: 'var(--text-h)' }}>{authView === "login" ? "Login" : authView === "register" ? "Registrieren" : authView === "forgotPassword" ? "Passwort vergessen?" : "Passwort zurücksetzen"}</h2>
                <button type="button" onClick={() => setAuthView(null)} style={{ background: 'transparent', color: 'var(--text)', padding: '0', boxShadow: 'none', border: 'none', minWidth: 'auto' }}>X</button>
              </div>

              {authView !== "resetPassword" && (
                <input
                  type="email"
                  placeholder="Email"
                  value={authEmail}
                  onChange={(event) => setAuthEmail(event.target.value)}
                />
              )}

              {(authView !== "forgotPassword" && authView !== "resetPassword") && (
                <input
                  type="password"
                  placeholder="Passwort"
                  value={authPassword}
                  onChange={(event) => setAuthPassword(event.target.value)}
                />
              )}

              {authView === "resetPassword" && (
                  <input
                  type="password"
                  placeholder="Neues Passwort"
                  value={authPassword}
                  onChange={(event) => setAuthPassword(event.target.value)}
                  />
              )}

              {authView === "resetPassword" && (
                  <input
                  type="password"
                  placeholder="Passwort bestätigen"
                  value={authPasswordConfirm}
                  onChange={(event) => setAuthPasswordConfirm(event.target.value)}
                  />
              )}

              {authError && <p className="error-text" style={{ margin: '0' }}>{authError}</p>}
              {authMessage && <p className="success-text" style={{ margin: '0' }}>{authMessage}</p>}

              <button type="submit" style={{ marginTop: '8px' }}>
                {authView === "login" ? "Einloggen" : authView === "register" ? "Registrieren" : "Passwort zurücksetzen"}
              </button>
              {authView === "login" && (
                <button type="button" onClick={() => setAuthView("forgotPassword")} style={{ marginTop: '4px', background: 'transparent', color: 'var(--accent)', boxShadow: 'none', border: 'none' }}>
                  Passwort vergessen?
                </button>
              )}
            </form>
          )}
        </div>
      </div>
      ) : null;

      // UI
      return (
      <div className={`app-layout ${isMenuOpen ? 'menu-open' : ''}`}
        /* Event Listener for swiping between Tabs */
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseUp={handleTouchEnd}
      >
        <a href="#main-content" className="skip-link">Zum Hauptinhalt springen</a>

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
            <aside className="mobile-menu-content swipe-ignore" onClick={(e) => e.stopPropagation()}>
              <div className="mobile-menu-header">
                <Reportunfall />
                <button className="mobile-menu-close" onClick={() => setIsMenuOpen(false)}>X</button>
              </div>
              <div className="mobile-menu-scroll">
                <div className="mobile-menu-settings">
                   <SettingsButton setSettingsOpen={setSettingsOpen} />
                   <span>Einstellungen</span>
                  {userId && (
                     <button 
                       className='logout-button' 
                       onClick={logout} 
                       title="Logout"
                       style={{ marginLeft: 'auto', width: '32px', height: '32px', padding: '0', display: 'grid', placeItems: 'center', borderRadius: '8px' }}
                     >
                       <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                         <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                         <polyline points="16 17 21 12 16 7"></polyline>
                         <line x1="21" y1="12" x2="9" y2="12"></line>
                       </svg>
                     </button>
                   )}
                </div>
                <div className="menu-divider" />
                {filterContent}
                <div className="menu-divider" />
                {accountContent}
                <div className="menu-divider" />
                <Newsfeed
                  userRole={userRole}
                  userId={userId}
                  newsList={newsList}
                  setNewsList={setNewsList}
                />
              </div>
            </aside>
          </div>
        )}

        <aside className="sidebar-left">
          <div className="sidebar-header">
            <Reportunfall /> {/* Seitenüberschrift mit random RPTU U */}
          </div>
          <div className="sidebar-scroll-container">
            {filterContent}
          </div>
        </aside>

        <main id="main-content" className="main-content" tabIndex={-1}>
          <header className="main-header">
            <div className="header-view-switch">
              <ViewModeButtons
                userId={userId}
                userRole={userRole}
                viewMode={viewMode}
                setViewMode={setViewMode}
                isArchiveMode={isArchiveMode}
                setIsArchiveMode={setIsArchiveMode}
                isManagementMode={isManagementMode}
                setIsManagementMode={setIsManagementMode}
              />
            </div>
            {viewMode === 'list' && (
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
            )}
          </header>

        {verificationMessage && (
          <p className={`verification-notice verification-${verificationMessageType}`}>
            {verificationMessage}
          </p>
        )}

        <div
          className={`issue-display-area ${viewMode === 'list' ? 'with-scroll-fade' : 'has-no-searchbar'} ${canScrollTop ? 'can-scroll-top' : ''} ${canScrollBottom ? 'can-scroll-bottom' : ''}`}
          ref={scrollAreaRef}
          onScroll={checkScroll}
        >
          {viewMode === 'list' ? (
            <div>
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
                      userEmail={userEmail}
                      isRestricted={isRestricted}
                      onReport={(id) => {
                        if (isRestricted && restrictedReportLimitReached) {
                          toast.error("🫪 Dein Konto ist eingeschränkt. Du kannst nur einmal am Tag einen Inhalt melden.");
                          return;
                        }
                        setIssueToReport(id);
                        setIsReportModalOpen(true);
                      }}
                      onDelete={async (id) => {
                        if (isArchiveMode && issue.status === "Gelöscht") {
                          setIssueToDelete(id);
                          setIsConfirmOpen(true);
                        } else {
                          try {
                            await deleteIssue(id, isArchiveMode, false, getCurrentIssueLoadOptions());
                            toast.success("Mangel gelöscht");
                          } catch (error) {
                            toast.error(`🫪 ${error instanceof Error ? error.message : "Mangel konnte nicht gelöscht werden"}`);
                          }
                        }
                      }}
                      onToggleVote={toggleUpvote}
                      onTogglePrivacy={togglePrivacy}
                      isArchiveMode={isArchiveMode}
                      setIssueList={setIssueList}
                      setNewsList={setNewsList}
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
          ) : viewMode === 'users' ? (
            <UsersList
              setViewMode={setViewMode}
              currentUserEmail={userEmail}
              currentUserShowOnLeaderboard={showOnLeaderboard}
              onLeaderboardPreferenceChange={updateLeaderboardPreference}
            />
          ) : viewMode === 'management' ? (
            <Suspense fallback={<p className="meta-line issue-loading">Ansicht wird geladen...</p>}>
              <Management
                setViewMode={setViewMode as any}
                userRole={userRole}
              />
            </Suspense>
          ) : (
            <Suspense fallback={<p className="meta-line issue-loading">Karte wird geladen...</p>}>
              <Map
                mapSummary={mapSummary}
                setViewMode={setViewMode as any}
                setCurrentFilter={setCurrentFilter}
                setCurrentFilterValue={setCurrentFilterValue}
              />
            </Suspense>
          )}
        </div>

        {userId && (
          <button
            className="floating-add-btn"
            onClick={() => {
              if (isRestricted) {
                toast.error("🫪 Dein Konto ist eingeschränkt. Du kannst keine neuen Mängel melden.");
                return;
              }
              setShowInputModal(true);
            }}
            title="Mangel melden"
          >
            <div>+</div>
          </button>
        )}
      </main>

      <aside className="sidebar-right">
        <div className="sidebar-header" style={{ padding: '0 16px' }}>
          <div 
            style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0, cursor: userId ? 'pointer' : 'default', padding: '6px', borderRadius: '8px', transition: 'background 0.2s' }}
            title={userId ? "Mein Profil öffnen" : ""}
            onClick={() => { if(userId) setProfileOpen(userEmail); }}
            onMouseEnter={(e) => { if (userId) e.currentTarget.style.background = 'var(--surface-strong)' }}
            onMouseLeave={(e) => { if (userId) e.currentTarget.style.background = 'transparent' }}
          >
            {userProfilePic ? (
              <img src={userProfilePic} alt="Avatar" style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)', flexShrink: 0 }} />
            ) : (
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: getUserColor(userEmail), display: 'flex', alignItems: 'center', justifyContent: 'center', color: getSecondaryUserColor(userEmail), fontWeight: 'bold', fontSize: '20px', border: '1px solid var(--border)', flexShrink: 0 }}>
                {userId ? userEmail?.charAt(0).toUpperCase() : '?'}
              </div>
            )}
            
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <span style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-h)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {userId ? (userName || userEmail.split('@')[0]) : 'Gast'}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--accent)', marginTop: '1px', fontWeight: 'bold' }}>
                {userId ? "Mein Profil ➔" : "Nicht angemeldet"}
              </span>
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {userId && (
              <button 
                className='logout-button' 
                onClick={logout} 
                title="Logout"
                style={{ width: '32px', height: '32px', padding: '0', display: 'grid', placeItems: 'center', borderRadius: '8px' }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </button>
            )}
            <SettingsButton setSettingsOpen={setSettingsOpen} />
          </div>
        </div>
        
        <div className="sidebar-scroll-container">
          {accountContent}
          
          <Newsfeed
            userRole={userRole}
            userId={userId}
            newsList={newsList}
            setNewsList={setNewsList}
          />
        </div>
      </aside>

      {/* Input Pop-up */}
      {showInputModal && (
        <div className="modal-overlay" onClick={() => setShowInputModal(false)}>

        <div className="modal-pane" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: '20px' }} className='modal-header-title'>Mangel melden</h2>
            <button className="modal-close-btn" onClick={() => setShowInputModal(false)}>X</button>
          </div>

          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {/* Input form nur sichtbar wenn man eingeloggt ist*/}
            <Suspense fallback={<p className="meta-line issue-loading">Formular wird geladen...</p>}>
              <InputForm
                isRestricted={isRestricted}
                onIssueCreated={async () => {
                  loadIssuePage(1, false);
                  await refreshMapData();
                  setShowInputModal(false);
                  toast.success("Mangel erfolgreich gemeldet");
                }}
              />
            </Suspense>
          </div>
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

                  <div className="settings-field settings-switch-field">
                    <span>Auf Bestenlisten erscheinen</span>
                    <input
                      className="native-toggle"
                      type="checkbox"
                      checked={showOnLeaderboard}
                      onChange={(event) => updateLeaderboardPreference(event.target.checked)}
                    />
                  </div>

                  {!emailVerified && (
                    <button className="verify-button" type="button" onClick={resendVerificationEmail}>
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
        <ConfirmDialog
          title="Meldung endgültig löschen?"
          message="Möchten Sie diese Meldung wirklich endgültig aus der Datenbank löschen? Diese Aktion kann nicht rückgängig gemacht werden."
          onConfirm={async () => {
            if (issueToDelete !== null) {
              try {
                await deleteIssue(issueToDelete, isArchiveMode, true, getCurrentIssueLoadOptions());
                await refreshMapData();
                toast.success("Mangel endgültig gelöscht");
              } catch (error) {
                toast.error(`🫪 ${error instanceof Error ? error.message : "Mangel konnte nicht endgültig gelöscht werden"}`);
              }
            }
            setIsConfirmOpen(false);
            setIssueToDelete(null);
          }}
          onCancel={() => { setIsConfirmOpen(false); setIssueToDelete(null); }}
        />
      )}
      {/* Report-Modal für Inhalts-Moderation */}
      {isReportModalOpen && (
        <div className="modal-overlay" onClick={() => { setIsReportModalOpen(false); setReportReason(""); setIssueToReport(null); }}>
          <div className="modal-pane" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2 className="modal-header-title" style={{ margin: 0 }}>Inhalt melden</h2>
              <button className="modal-close-btn" onClick={() => { setIsReportModalOpen(false); setReportReason(""); setIssueToReport(null); }}>X</button>
            </div>
            <div className="modal-content" style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
              <p style={{ fontSize: '14px', margin: 0 }}>Warum möchtest du diesen Mangel melden? Bitte gib eine kurze Begründung an.</p>
              <textarea 
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Begründung (z.B. unangemessene Sprache, Spam...)"
                rows={4}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
              />
              <button onClick={submitReport} style={{ width: '100%', marginTop: '10px' }}>
                Meldung abschicken
              </button>
            </div>
          </div>
        </div>
      )}
      <UserProfile 
        email={profileOpen} 
        onClose={() => setProfileOpen(null)} 
        currentUserEmail={userEmail}
        currentUserShowOnLeaderboard={showOnLeaderboard}
        onLogout={() => { setProfileOpen(null); logout(); }}
        onProfileUpdate={(newName, newPic) => { setUserName(newName); setUserProfilePic(newPic); }}
        onLeaderboardPreferenceChange={updateLeaderboardPreference}
        onFollowChange={refreshFilterOptions}
      />
    </div>
  );
}
