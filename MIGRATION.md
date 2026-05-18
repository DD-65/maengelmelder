# Migration

Nach dem Pull: (alle Befehle im Projekt-Root ausführen)

1. `Remove-Item -Recurse -Force dist, node_modules, frontend/node_modules, backend/node_modules` (oder `rm -rf dist node_modules frontend/node_modules backend/node_modules` unter Linux/macOS) (Löscht die alten unnötigen Ordner)
2. `npm install`
3. `npm run build`


Dann ist wahrscheinlich beim Refactoring etwas passiert wie:

* Component gibt nichts mehr zurück
* Fehler im Render
* Hook erzeugt leeren State
* oder der frühere globale Inhalt wurde entfernt

Typischer Fehler nach deinem Umbau:

```tsx id="8k0f0i"
export default function Search() {
  const { issueList, setIssueList } = useIssueList();
}
```

→ kein `return` mehr.

Muss so aussehen:

```tsx id="m4mcln"
export default function Search() {
  const { issueList, setIssueList } = useIssueList();

  return (
    <div>
      Inhalt
    </div>
  );
}
```

Oder dein State wird jetzt bei jedem Render neu erstellt:

```tsx id="9pfe9x"
export function useIssueList() {
    const [issueList, setIssueList] = useState<Issue[]>([]);
    return { issueList, setIssueList };
}
```

Das ist kein globaler State — jede Komponente bekommt ihre eigene leere Liste.

Wenn vorher Daten sichtbar waren und jetzt nicht mehr, dann genau deshalb.

Für echten globalen State brauchst du:

* Context
* Zustand
* Redux

oder State im Parent halten und per Props weitergeben.

Dein aktueller Hook erzeugt nur lokalen State.
