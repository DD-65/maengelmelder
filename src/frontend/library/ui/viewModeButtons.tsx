import { useViewMode } from "../hooks/useViewMode";

interface ViewModeButtonsProperties{
    viewMode : "map" | "list";
    setViewMode: (val: 'list' | 'map') => void;
    isArchiveMode: boolean;
    setIsArchiveMode: (val: boolean) => void;
    userId: number | null
}
//}: {userId: number | null}, {
export function ViewModeButtons({viewMode, userId, setViewMode, isArchiveMode, setIsArchiveMode }: ViewModeButtonsProperties){
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
      </div>)
}