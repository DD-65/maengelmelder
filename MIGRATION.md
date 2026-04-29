# Migration

Nach dem Pull: (alle Befehle im Projekt-Root ausführen)

1. `Remove-Item -Recurse -Force dist, node_modules, frontend/node_modules, backend/node_modules` (oder `rm -rf dist node_modules frontend/node_modules backend/node_modules` unter Linux/macOS) (Löscht die alten unnötigen Ordner)
2. `npm install`
3. `npm run build`
