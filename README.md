# pwa_custom_gpt

## Projektbeschreibung

pwa_custom_gpt ist die lokale, offline-fähige PWA-Neuimplementierung von a_custom_gpt. Die App bildet die fachliche Logik der Android-Version nach, speichert alle Nutzerdaten local-first auf dem Gerät und nutzt IndexedDB für Räume, Konversationen, Nachrichten und Einstellungen.

## Features

- Unterstützung für mehrere Räume
- Verwaltung von Konversationen und Nachrichten
- Setup und Einstellungen für API-Key, Prompt-ID, Vector-Store-IDs und Benutzer-E-Mail
- Local-first Persistenz mit IndexedDB
- Offline-fähige App-Shell als PWA
- Trennung von lokaler Persistenz und OpenAI-API-Zugriff
- Moderne UI mit React und TypeScript

## Inhaltsverzeichnis

1. [Projektbeschreibung](#projektbeschreibung)
2. [Features](#features)
3. [Inhaltsverzeichnis](#inhaltsverzeichnis)
4. [Installation](#installation)
5. [Authentisierung](#authentisierung)
6. [Konfiguration von Starters](#konfiguration-von-starters)
7. [Nutzung](#nutzung)
8. [Lizenz](#lizenz)

## Installation

1. Repository klonen:
	```bash
	git clone <repo-url>
	```
2. Abhängigkeiten installieren:
	```bash
	npm install
	```
3. Entwicklungsserver starten:
	```bash
	npm run dev
	```
4. Für einen realistischen PWA-Check die gebaute App starten:
	```bash
	npm run build
	npm run preview
	```

### Lokaler Start unter Windows / WSL

Im aktuellen Workspace laufen die Befehle bequem in WSL im Projektverzeichnis `c:\Users\Heiko\git\pwa_custom_gpt`:

```bash
cd /mnt/c/Users/Heiko/git/pwa_custom_gpt
npm install
npm run dev
```

Danach ist die App unter `http://localhost:5173/` erreichbar. Für den Production-Preview läuft sie unter `http://localhost:4173/`.

## Authentisierung

Die App trennt lokale App-Daten klar von den Daten für den OpenAI-Zugriff.

### 1. Direkte API-Key & Prompt-ID
Die primäre Konfiguration erfolgt über:
- **API-Key**: OpenAI API-Key für die Authentifizierung bei der OpenAI API
- **PROMPT-ID**: Die ID des konfigurierten OpenAI Prompts
- **VECTORS-TORE-IDS**: Komma-getrennte Liste von OpenAI Vector-Stores
- **User-E-Mail**: Optionaler Benutzerwert, der in den Request-Headern mitgegeben wird

Diese Werte werden im Setup-Dialog eingegeben und lokal im Browser gespeichert.

### 2. User Authentisierung
Zusätzlich kann eine Benutzer-E-Mail lokal hinterlegt werden. Sie wird beim Senden einer Nachricht als Kontext an die OpenAI-API übergeben, ersetzt aber keine serverseitige Authentisierung.

## Konfiguration von Starters

Starters sind vordefinierte Prompt-Vorschläge, die in Konversationen schnell verfügbar sind. Sie werden lokal als Markdown-Tabelle gespeichert und von der App geparst.

### Starters.md Dateistruktur

**Beispiel starters.md:**
```markdown
| Zweck | Prompt |
|-------|--------|
| Frage nach einer berühmten Persönlichkeit | Wer war eigentlich |
| Rechenaufgabe | Wieviel ist |
| Humor | Erzähle einen Witz über |
| Codierung | Schreib einen Python-Code für |
| Zusammenfassung | Fasse zusammen: |
```

### Spalten:
- **Zweck**: Kurze Beschreibung des Starters, wird in der UI angezeigt
- **Prompt**: Der eigentliche Prompt-Text, der in das Eingabefeld übernommen wird

### Verwendung in der App

Nach dem Speichern der Konfiguration werden die Starters lokal geladen und in jeder Konversation als auswählbare Vorschläge angezeigt.

## Nutzung

### Erste Schritte
1. Beim ersten Start API-Key und Prompt-ID im Setup-Dialog eingeben.
2. Optional: Vector-Store-IDs und Benutzer-E-Mail ergänzen.
3. Räume und Konversationen direkt in der App anlegen.

### Arbeitsablauf
1. **Räume verwalten**: Neue Räume erstellen oder vorhandene auswählen
2. **Chats erstellen**: Innerhalb eines Raumes neue Chats für verschiedene Themen anlegen
3. **Mit Starters arbeiten**: In der Konversation auf Starter-Vorschläge klicken, um den Prompt einzufügen
4. **Konversieren**: Prompts bearbeiten und Nachrichten an den Assistenten senden
5. **Offline nutzen**: App-Shell und lokale Daten bleiben ohne Backend auf dem Gerät verfügbar

### Schnelltest

1. App im Browser öffnen und einmal vollständig einrichten.
2. Einen Raum und einen Chat anlegen.
3. Browser neu laden und prüfen, ob Räume und Chats erhalten bleiben.
4. Im Production-Preview die DevTools öffnen, offline schalten und die Seite neu laden.
5. Prüfen, ob die App-Shell weiterhin startet und die lokalen Daten sichtbar bleiben.

### Chat-Verwaltung
- **Chats umbenennen**: Mit dem Bearbeiten-Icon
- **Chats löschen**: Mit dem Löschen-Icon
- **Chats verschieben**: Chats zwischen Räumen mit dem Verschieben-Icon verlagern

## Konfiguration

Die App ist bewusst local-first ausgelegt. Wichtige Daten werden im Browser gespeichert:

| Bereich | Speicher | Beschreibung |
|---|---|---|
| Räume, Chats, Nachrichten | IndexedDB | Persistente App-Daten |
| Einstellungen | localStorage | API-Key, Prompt-ID, Vector-Store-IDs, E-Mail |
| App-Shell | Service Worker / PWA Cache | Offline-Bereitstellung statischer Assets |

**Hinweise:**
- Es gibt kein Backend für Räume, Konversationen oder Nachrichten.
- API-Zugriffe sind ausschließlich für OpenAI-Requests vorgesehen und getrennt von der lokalen Persistenz.
- Schema-Migrationen werden in der IndexedDB-Schicht versioniert.
- Für die PWA-Tests ist der Production-Preview die verlässlichste Variante, weil dort Manifest und Service Worker wie im echten Build aktiv sind.

## Lizenz

Diese Software steht unter der MIT License. Siehe [LICENSE](LICENSE) für weitere Informationen.
