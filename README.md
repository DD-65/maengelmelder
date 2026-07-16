# Mängelmelder

Eine **(inoffizielle!)** Plattform zum Melden und Verwalten von Mängeln auf den Campi der RPTU (Kaiserslautern und Landau), entstanden im Programmierprojekt [Projekt Agile Methoden 2](https://modhb.rptu.de/mhb/courses/INF-71-01-K-4/).

Mit dem Mängelmelder können Studierende und Beschäftigte beispielsweise beschädigtes Mobiliar, WLAN-Ausfälle, defekte Steckdosen oder Schlaglöcher melden. Die Meldungen werden auf einer Karte und in einer durchsuchbaren Liste dargestellt, können kommentiert und bewertet sowie über einen rollenbasierten Verwaltungsbereich bearbeitet werden.

## Funktionen

- Öffentliche und private Mängel melden
- Bilder an Meldungen anhängen
- Gebäude über den Gerätestandort oder Bild-Metadaten ermitteln
- Mängel in einer Listen- oder Kartenansicht anzeigen
- Meldungen suchen, filtern, sortieren und seitenweise laden
- Für Meldungen abstimmen und Kommentare verfassen
- Anderen Nutzern folgen und Bestenlisten anzeigen
- Den Bearbeitungsstatus einer Meldung verfolgen
- E-Mail-Verifizierung, Passwort-Zurücksetzung und Statusmeldungen
- Inhalte moderieren und Nutzer über verschiedene Rollen verwalten
- Helles und dunkles Farbschema (sowie verschiedenste Accessibility-Features wie screenreader-support und Bedienen nur mit der Tastatur)
- Responsive Benutzeroberfläche für Desktop und Mobilgeräte

## Technologien

- **Frontend:** React, TypeScript und Vite
- **Backend:** Express und TypeScript
- **Datenbank:** SQLite mit `better-sqlite3`
- **Karte:** Leaflet
- **Bildverarbeitung:** Multer, Sharp und EXIF-Auswertung
- **Authentifizierung:** Sessions und bcrypt
- **E-Mail:** Nodemailer

## Lokale Entwicklung

### Voraussetzungen

- Node.js `20.19+` oder `22.12+`
- npm

### Installation

```bash
git clone https://github.com/DD-65/maengelmelder
cd maengelmelder
npm install
```

Im Projektverzeichnis eine `.env`-Datei anlegen:

```dotenv
PORT=3001
NODE_ENV=development
SESSION_SECRET=durch-einen-langen-wert-ersetzen
APP_BASE_URL=http://localhost:3001

EMAIL_TOKEN_TTL_MINUTES=60

SMTP_HOST=smtp.test.de
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=smtp-benutzer
SMTP_PASS=smtp-passwort
SMTP_FROM=maengelmelder@test.de
```

Die SMTP-Konfiguration wird für die E-Mail-Verifizierung, das Zurücksetzen von Passwörtern und Benachrichtigungen benötigt. Die Anwendung startet und funktioniert auch ohne SMTP-Konfiguration, kann dann jedoch keine E-Mails versenden.

Entwicklungsserver starten:

```bash
npm run dev
```

Anschließend [http://localhost:3001](http://localhost:3001) öffnen.
(Standardmäßig ist http basic auth aktiviert, mit username `team` und passwort `pam2`)

## Andere Befehle

| Befehl | Beschreibung |
|---|---|
| `npm run dev` | Entwicklungsserver starten |
| `npm run build` | Backend und Frontend kompilieren |
| `npm run preview` | Produktions-Build des Frontends lokal anzeigen |
| `npm run lint` | Quellcode mit ESLint prüfen (schlägt im Moment fehl)|

## Projektstruktur

```text
maengelmelder/
├── public/                 Statische Dateien und RPTU-Branding
├── scripts/                Deployment-Skripte
├── deploy/                 Service-Konfiguration
├── src/
│   ├── backend/            Express-API, Datenbank und E-Mail-Versand
│   │   ├── issues/         Mängel-Routen, Filterung und Abfragen
│   │   ├── middleware/     Authentifizierung und Textfilter
│   │   └── user/           Nutzerbezogene Routen
│   └── frontend/           React-Anwendung
│       └── library/
│           ├── constants/  Räume und Gebäudekoordinaten
│           ├── hooks/      Anwendungszustand und API-Hooks
│           ├── types/      TypeScript-Datentypen
│           ├── ui/         Wiederverwendbare UI-Komponenten
│           └── utils/      Hilfsfunktionen
├── uploads/                Hochgeladene Mängel- und Profilbilder
└── database/app.db         SQLite-Datenbank
```

Das Datenbankschema wird beim Start des Backends automatisch angelegt und aktualisiert.

## Benutzerrollen

| Rolle | Berechtigungen |
|---|---|
| Nutzer | Mängel erstellen, ansehen, bewerten und kommentieren |
| Admin | Inhalte moderieren, Status ändern und Nutzer verwalten |
| Superadmin | Administratoren und erweiterte Verwaltungsfunktionen verwalten |

(Der Superadmin hat standardmäßig die Accountdaten `root@team.de`/`IchBinRoot`)

Meldungen durchlaufen folgenden Statusprozess:

```text
Gemeldet → Akzeptiert → In Bearbeitung → Behoben
                      ↘ Abgelehnt
```

Gelöschte Meldungen werden zunächst archiviert und können von berechtigten Administratoren endgültig entfernt werden.

## Produktions-Deployment

```bash
npm ci
npm run build
NODE_ENV=production node dist/backend/server.js
```

Vor dem Deployment:

- Einen sicheren und eindeutigen `SESSION_SECRET` setzen
- HTTPS und einen Reverse Proxy konfigurieren (bspw nginx + certbot)
- SMTP und `APP_BASE_URL` konfigurieren
- `database/app.db` regelmäßig sichern
- Das Verzeichnis `uploads/` dauerhaft speichern
- Entwicklungszugänge und Fallback-Secrets ersetzen
- Cookie-, CORS- und Basic-Auth-Einstellungen prüfen

Beispiele für ein Deployment-Skript und einen systemd-Service befinden sich in `scripts/` und `deploy/`.
