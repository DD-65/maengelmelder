import { useViewMode } from "../hooks/useViewMode";
import { useArchiveMode } from "../hooks/useArchiveMode";

export function ViewModeButtons(userId: number | null){
    const{viewMode, setViewMode}=useViewMode();
    const{isArchiveMode, setIsArchiveMode}=useArchiveMode();

    return(
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
      </div>)
}