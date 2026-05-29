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
    //const{viewMode, setViewMode}=useViewMode();

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