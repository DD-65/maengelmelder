export function SettingsButton({setSettingsOpen}:{setSettingsOpen: React.Dispatch<React.SetStateAction<boolean>>}){
    return(
      <button className="settings-button" type="button" aria-label="Einstellungen öffnen" title="Einstellungen" onClick={() => setSettingsOpen(true)}>
      <svg className="settings-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M19.4 13.5c.1-.5.1-1 .1-1.5s0-1-.1-1.5l2-1.5-2-3.5-2.4 1a8 8 0 0 0-2.6-1.5L14 2h-4l-.4 3a8 8 0 0 0-2.6 1.5l-2.4-1-2 3.5 2 1.5A9.4 9.4 0 0 0 4.5 12c0 .5 0 1 .1 1.5l-2 1.5 2 3.5 2.4-1a8 8 0 0 0 2.6 1.5l.4 3h4l.4-3a8 8 0 0 0 2.6-1.5l2.4 1 2-3.5-2-1.5ZM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z" />
      </svg>
      </button>
      )
}