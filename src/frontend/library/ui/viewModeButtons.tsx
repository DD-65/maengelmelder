import { useViewMode } from "../hooks/useViewMode";
import { useArchiveMode } from "../hooks/useArchiveMode";

interface ViewModeButtonsProperties{
    viewMode : "map" | "list";
    setViewMode: React.Dispatch<React.SetStateAction<"map" | "list">>;
    userId: number | null
}
//}: {userId: number | null}, {
export function ViewModeButtons({viewMode, userId, setViewMode }: ViewModeButtonsProperties){
    //const{viewMode, setViewMode}=useViewMode();
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