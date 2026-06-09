// import { useViewMode } from "../hooks/useViewMode";

interface ViewModeButtonsProperties{
    viewMode : "map" | "list" | "management";
    setViewMode: (val: 'list' | 'map' | 'management') => void;
    isArchiveMode: boolean;
    setIsArchiveMode: (val: boolean) => void;
    isManagementMode: boolean;
    setIsManagementMode: (val: boolean) => void;
    userId: number | null;
    userRole: string | null;
}
//}: {userId: number | null}, {
export function ViewModeButtons({viewMode, userId, userRole, setViewMode, isArchiveMode, setIsArchiveMode, setIsManagementMode }: ViewModeButtonsProperties){
    return(
        <div className="view-mode-switch-container">
        <button 
          onClick={() => { setViewMode('list'); setIsArchiveMode(false); }} 
          className={`view-mode-btn ${viewMode === 'list' && !isArchiveMode ? 'active' : ''}`}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6" x2="21" y2="6"></line>
            <line x1="8" y1="12" x2="21" y2="12"></line>
            <line x1="8" y1="18" x2="21" y2="18"></line>
            <line x1="3" y1="6" x2="3.01" y2="6"></line>
            <line x1="3" y1="12" x2="3.01" y2="12"></line>
            <line x1="3" y1="18" x2="3.01" y2="18"></line>
          </svg>
          <span>Liste</span>
        </button>

        <button 
          onClick={() => { setViewMode('map'); setIsArchiveMode(false); }} 
          className={`view-mode-btn ${viewMode === 'map' && !isArchiveMode ? 'active' : ''}`}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="1 6 1 22 8 19 16 22 23 19 23 3 16 6 8 3 1 6"></polygon>
            <line x1="8" y1="3" x2="8" y2="19"></line>
            <line x1="16" y1="6" x2="16" y2="22"></line>
          </svg>
          <span>Karte</span>
        </button>

        {userId && (
          <button 
            onClick={() => { setViewMode('list'); setIsArchiveMode(true); }}
            className={`view-mode-btn ${isArchiveMode ? 'active' : ''}`}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="21 8 21 21 3 21 3 8"></polyline>
              <rect x="1" y="3" width="22" height="5"></rect>
              <line x1="10" y1="12" x2="14" y2="12"></line>
            </svg>
            <span>Archiv</span>
          </button>
        )}
        
        {(userRole === "admin" || userRole === "superadmin") && (
          <button 
            onClick={() => { setViewMode('management'); setIsManagementMode(true); }}
            className={`view-mode-btn ${viewMode === 'management' ? 'active' : ''}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="orange" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path stroke-linecap="round" stroke-linejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z" />
            </svg>
            <span>Management</span>
          </button>
        )}
      </div>)
}