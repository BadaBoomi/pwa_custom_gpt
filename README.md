# pwa_custom_gpt

## Projektbeschreibung

pwa_custom_gpt ist eine lokale, offline-fähiger PWA-Applikation für GPT-basierte KI-Assistenten. Sie ermöglicht es, verschiedene Assistenten-IDs und API-Keys zu hinterlegen und bietet eine übersichtliche Chat- und Raumverwaltung, speichert alle Nutzerdaten local-first auf dem Gerät und nutzt IndexedDB für Räume, Konversationen, Nachrichten und Einstellungen.

## Features

- Unterstützung für mehrere Räume
- Raumbezogene Custom-Attribute per Assistant-Syntax (`[set|...]`, `[get|...]`)
- Verwaltung von Konversationen und Nachrichten
- Setup und Einstellungen für API-Key, Prompt-ID, Vector-Store-IDs und Benutzer-E-Mail
- Read-only Konfigurationsansicht mit Reload über API
- Local-first Persistenz mit IndexedDB
- Offline-fähige App-Shell als PWA
- Trennung von lokaler Persistenz und OpenAI-API-Zugriff
- Dynamische Antwort-Buttons aus Assistant-Responses mit automatischem Fallback auf Starters
- Moderne UI mit React und TypeScript

## Inhaltsverzeichnis

1. [Projektbeschreibung](#projektbeschreibung)
2. [Features](#features)
3. [Inhaltsverzeichnis](#inhaltsverzeichnis)
4. [Installation](#installation)
5. [Authentisierung](#authentisierung)
6. [Konfiguration von Starters](#konfiguration-von-starters)
7. [Nutzung](#nutzung)
8. [Raumattribute](#raumattribute)
9. [Dynamische Antwort-Buttons](#dynamische-antwort-buttons)
10. [Rule Flows](#rule-flows)
11. [Konfiguration](#konfiguration)
12. [Lizenz](#lizenz)

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
- **PROMPT-ID**: Die globale Prompt-ID für Konfigurationsanfragen (`GET_CONFIGURATION`)
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
| Zweck | Prompt | Prompt-ID |
|-------|--------|-----------|
| Frage nach einer berühmten Persönlichkeit | Wer war eigentlich | pmpt_... |
| Rechenaufgabe | Wieviel ist | pmpt_... |
| Humor | Erzähle einen Witz über | pmpt_... |
| Codierung | Schreib einen Python-Code für | pmpt_... |
| Zusammenfassung | Fasse zusammen: | pmpt_... |
```

### Spalten:
- **Zweck**: Kurze Beschreibung des Starters, wird in der UI angezeigt
- **Prompt**: Der eigentliche Prompt-Text, der in das Eingabefeld übernommen wird
- **Prompt-ID**: Prompt-Ziel für Dialoganfragen bei gewähltem Zweck

### Verwendung in der App

Nach dem Speichern der Konfiguration werden die Starters lokal geladen und in jeder Konversation als auswählbare Vorschläge angezeigt.

Zusätzlich bietet die Einstellungsseite:
- eine read-only Tabelle mit den aktuellen Konfigurationsdaten
- einen Button **Konfigurationsdaten neu lesen**, der `GET_CONFIGURATION` über die API auslöst
- Parsing von Antworten sowohl als Markdown-Tabelle als auch als JSON im `output_text` (inklusive ` ```json `-Codeblock)

## Nutzung

### Erste Schritte
1. Beim ersten Start API-Key und Prompt-ID im Setup-Dialog eingeben.
2. Optional: Vector-Store-IDs und Benutzer-E-Mail ergänzen.
3. Räume und Konversationen direkt in der App anlegen.

### Arbeitsablauf
1. **Räume verwalten**: Neue Räume erstellen oder vorhandene auswählen
2. **Chats erstellen**: Innerhalb eines Raumes neue Chats für verschiedene Themen anlegen
3. **Zweck wählen**: In der Konversation muss zuerst ein Label aus **Zweck** gewählt werden
4. **Mit Starters arbeiten**: Die Auswahl setzt den Eingabetext auf den Wert aus **Prompt**
5. **Konversieren**: Nachrichten werden mit der **Prompt-ID** des aktuell gewählten Labels gesendet
6. **Label wechseln**: Bei Auswahl eines anderen Labels wechselt die verwendete Prompt-ID sofort
7. **Offline nutzen**: App-Shell und lokale Daten bleiben ohne Backend auf dem Gerät verfügbar

### Regeln für Prompt-Routing

- Ohne Label-Auswahl ist kein Senden möglich.
- Für Dialoge gilt ausschließlich die Prompt-ID aus dem ausgewählten Label.
- Die globale Prompt-ID wird nur für Konfigurationsanfragen verwendet, nicht für normale Dialognachrichten.

## Raumattribute

Assistant-Antworten können Custom-Attribute direkt an den aktuellen Raum schreiben und daraus lesen.

### Syntax

- `[set|Alias|Heiko]` speichert im aktuellen Raum das Attribut `Alias` mit dem Wert `Heiko`
- `[get|Alias]` wird in der sichtbaren Assistant-Nachricht durch den aktuell gespeicherten Wert ersetzt

Gespeicherte Raumattribute werden überall zusammen mit dem Raumnamen angezeigt, zum Beispiel `Projekt (Alias: Heiko)`.

## Dynamische Antwort-Buttons

Zusätzlich zu den konfigurierten Starters kann die Assistant-Antwort temporäre Buttons für den aktuellen Chat setzen.

### Trigger-Format

Unterstütztes Inline-Format in einer Assistant-Textantwort:

```text
[[buttons:[Label 1|Inhalt 1], [Label 2|Inhalt 2], [Label 3|Inhalt 3]]]
```

### Verhalten in der UI

- Enthält die letzte Assistant-Antwort ein gültiges `[[buttons:...]]`, dann werden die Starter-Buttons ausgeblendet.
- Stattdessen werden die im Token definierten Buttons angezeigt.
- Ein Klick auf einen dieser Buttons setzt den jeweiligen Inhalt in das Eingabefeld.
- Der Token selbst wird nicht in der sichtbaren Assistant-Nachricht angezeigt.
- Enthält die letzte Assistant-Antwort kein `[[buttons:...]]`, erscheinen automatisch wieder die normalen Starter-Buttons aus der Konfiguration.

### Hinweise zum Format

- Jeder Button muss als Paar `[Label|Inhalt]` angegeben sein.
- Leere Labels oder leere Inhalte werden ignoriert.
- Bei mehreren `[[buttons:...]]`-Blöcken in derselben Nachricht wird der zuletzt gefundene gültige Block verwendet.

### Beispiel Ende-zu-Ende

1. Aktive Standard-Buttons (aus Starters):
	- `Frage`
	- `Humor`
	- `Zusammenfassung`

2. Assistant-Antwort enthält folgenden Text:

```text
Gerne. Waehlen Sie einen naechsten Schritt:
[[buttons:[Kurzfassung|Fasse die letzten 3 Antworten in 5 Saetzen zusammen.], [Naechste Frage|Stelle mir eine Rueckfrage zum Zielbild.], [ToDo-Liste|Erzeuge eine priorisierte ToDo-Liste aus dem Chatverlauf.]]]
```

3. Sichtbares Ergebnis im Chat:
	- Angezeigt wird nur: `Gerne. Waehlen Sie einen naechsten Schritt:`
	- Der `[[buttons:...]]`-Block wird aus der sichtbaren Nachricht entfernt.

4. Ergebnis bei den Buttons oberhalb des Eingabefelds:
	- Die Starter-Buttons werden temporaer ersetzt durch:
	  - `Kurzfassung`
	  - `Naechste Frage`
	  - `ToDo-Liste`
	- Klick auf `Kurzfassung` setzt den zugehoerigen Inhalt in das Eingabefeld.

5. Fallback:
	- Die naechste Assistant-Antwort enthaelt keinen `[[buttons:...]]`-Block.
	- Danach zeigt die UI automatisch wieder die konfigurierten Starter-Buttons an.

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
| Einstellungen | localStorage | API-Key, globale Prompt-ID, Vector-Store-IDs, E-Mail |
| Konfigurationsauswahl pro Chat | localStorage | Gewähltes Zweck-Label inkl. Prompt/Prompt-ID |
| App-Shell | Service Worker / PWA Cache | Offline-Bereitstellung statischer Assets |

**Hinweise:**
- Es gibt kein Backend für Räume, Konversationen oder Nachrichten.
- API-Zugriffe sind ausschließlich für OpenAI-Requests vorgesehen und getrennt von der lokalen Persistenz.
- Schema-Migrationen werden in der IndexedDB-Schicht versioniert.
- Für die PWA-Tests ist der Production-Preview die verlässlichste Variante, weil dort Manifest und Service Worker wie im echten Build aktiv sind.

## Rule Flows

Rule Flows sind deterministische, schrittweise Dialogabläufe, die die normale AI-Antwortlogik zeitweise übernehmen. Die Flows sind modular aufgebaut und werden über den Flow-Namen auf ein Skript im Projekt gemappt.

### Zweck

- Trennung von freier AI-Konversation und strengem, validierbarem Ablauf
- Wiederverwendbare, versionierbare Flow-Module
- Kontrollierte Zustandsmaschine pro Chat mit Persistenz in IndexedDB

### Architekturüberblick

- Parsing und Session-Erstellung: `src/flows/ruleFlowEngine.ts`
- Handler-Vertrag (Interface): `src/flows/flowTypes.ts`
- Modul-Registry und Auflösung: `src/flows/flowRegistry.ts`
- Konkrete Flow-Skripte: `src/rule_flows/*.ts`
- Orchestrierung im Chat-Lebenszyklus: `src/repositories/chatRepository.ts`

### Trigger-Formate

Rule Flows können durch Assistant-Ausgaben gestartet werden.

1. Token-Format (Textantwort)
	 - Unterstützt: `[[start_rule_flow:flow_name]]`
	 - Wichtig: Ohne `:flow_name` wird der Token nicht mehr als Trigger erkannt.

2. JSON-basierte Direktiven (führendes JSON-Objekt)
	 - `start_rule_flow`-Objekt
	 - `tool: "start_rule_flow"`
	 - `function_call.name: "start_rule_flow"`

Hinweis: Beim JSON-Format kann bei fehlendem `flowType` aktuell ein Fallback auf den Default-Flow greifen. Für eindeutiges Verhalten sollte `flowType` immer explizit gesetzt werden.

### Wie ein Flow aufgelöst wird

1. Die App extrahiert `flowType` aus der Assistant-Antwort.
2. Es wird eine Flow-Session für den Chat angelegt.
3. Die Registry sucht ein Modul gleichen Namens unter `src/rule_flows`.
4. Existiert ein Handler, übernimmt er Initial-Prompt und Folgeturns.
5. Existiert kein Handler, wird eine Assistant-Fehlermeldung gespeichert und der deterministische Modus beendet.

### Benennung und Konventionen

- Dateiname entspricht `flowType`:
	- Beispiel: `flowType = "collect_contact"` -> Datei `src/rule_flows/collect_contact.ts`
- Erlaubte Zeichen im Token-Flow-Namen: `a-z`, `0-9`, `_`, `-`
- Empfehlung: ausschließlich lowercase verwenden

### Handler-Vertrag

Jedes Flow-Modul exportiert einen Default-Handler mit zwei Methoden:

- `getInitialPrompt(flowType)`
	- Liefert den Starttext, der nach Aktivierung des Flows in den Chat geschrieben wird.
- `handleTurn(session, userInput)`
	- Verarbeitet den nächsten Nutzereingang deterministisch und liefert:
		- `nextStep`
		- `status` (`running`, `completed`, `aborted`)
		- `answers`
		- `assistantReply`
		- optional `resultSummary`

### Beispiel: Neuer Flow

Datei anlegen: `src/rule_flows/lead_capture.ts`

```ts
import type { RuleFlowHandler } from '@/flows/flowTypes'

const leadCaptureFlow: RuleFlowHandler = {
		getInitialPrompt() {
				return 'Lead Flow gestartet. Wie lautet Ihr Name?'
		},

		handleTurn(session, userInput) {
				const input = userInput.trim()
				if (!input) {
						return {
								nextStep: session.currentStep,
								status: 'running',
								answers: session.answers,
								assistantReply: 'Bitte geben Sie einen Wert ein.',
						}
				}

				return {
						nextStep: 'done',
						status: 'completed',
						answers: { ...session.answers, name: input },
						assistantReply: 'Danke. Lead wurde erfasst.',
						resultSummary: `name=${input}`,
				}
		},
}

export default leadCaptureFlow
```

Danach kann der Flow mit folgendem Token gestartet werden:

```text
[[start_rule_flow:lead_capture]]
```

### Laufzeitverhalten

- Solange eine Flow-Session den Status `running` hat, verarbeitet der Flow-Handler die Nutzereingaben.
- Bei `completed` wird die Session entfernt und der normale AI-Modus fortgesetzt.
- Bei fehlendem Skript wird der Flow abgebrochen und eine sichtbare Hinweisnachricht im Chat hinterlegt.

### Persistenz

Flow-Sessions werden in IndexedDB in der Tabelle `flowSessions` gespeichert. Persistiert werden unter anderem:

- `chatId`, `flowId`, `flowType`
- `currentStep`, `answers`
- `status`, optional `resultSummary`
- `createdAt`, `updatedAt`

Dadurch kann ein laufender Flow nach Reload der App fortgesetzt werden.

### Konfiguration und Erweiterung

- Kein zentraler Registry-Eintrag pro Flow notwendig: die Modulauflösung erfolgt automatisch über die Dateien in `src/rule_flows`.
- Für neue Flows reicht ein neues Modul im richtigen Dateinamen.
- Für konsistentes Verhalten sollten Flows:
	- Input trimmen und validieren
	- auf ungültige Zustände robust reagieren
	- klare, nutzerfreundliche Antworten liefern

### Troubleshooting

- Flow startet nicht:
	- Prüfen, ob Token exakt `[[start_rule_flow:flow_name]]` lautet.
	- Prüfen, ob Dateiname in `src/rule_flows` exakt dem `flow_name` entspricht.

- Unerwartet falscher Flow:
	- Prüfen, ob JSON-Direktiven ohne `flowType` gesendet wurden (können auf Default fallen).

- Build-Fehler nach neuem Flow:
	- Typen gegen `RuleFlowHandler` prüfen.
	- `npm run build` ausführen.

## Lizenz

Diese Software steht unter der MIT License. Siehe [LICENSE](LICENSE) für weitere Informationen.
