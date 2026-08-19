
## 4. Excel-Struktur

### 4.1 Tab „Phase_1“

Der Tab „Phase_1“ enthält 54 Aussagen.

Struktur:

- 6 Kategorien
- je Kategorie 9 Aussagen
- jede Aussage ist einem W&W-Typ von 1 bis 9 zugeordnet
- jede Kategorie besitzt eine Gewichtung

Relevante Spalten:

- ID
- Kategorie
- Aussage
- W&W-Typ
- Gewichtung

Die Spalte „index“ ist technisch nicht relevant und kann ignoriert werden.

Die Kategorien aus Phase 1 sind:

1. Auftreten und Körpersprache
   Gewichtung: 0,4

2. Die Art der Gesprächseröffnung
   Gewichtung: 0,2

3. Der Kommunikationsstil
   Gewichtung: 0,15

4. Welche Fragen werden gestellt
   Gewichtung: 0,1

5. Reaktion auf Ihre Einwände
   Gewichtung: 0,1

6. Verhalten in der Abschlussphase
   Gewichtung: 0,05

Die ersten drei Kategorien sind Pflichtkategorien.

Die letzten drei Kategorien sind Zusatzkategorien.

Wenn alle sechs Kategorien beantwortet werden, ergibt die Summe der Gewichtungen 1,0.

Wenn nur die drei Pflichtkategorien beantwortet werden, ergibt die Summe der Gewichtungen 0,75.

---

### 4.2 Tab „Phase_2“

Der Tab „Phase_2“ enthält 90 Aussagen.

Struktur:

- 9 W&W-Typen
- je Typ 10 Aussagen
- jede Aussage besitzt einen Rundenwert
- jede Aussage ist einem W&W-Typ von 1 bis 9 zugeordnet

Relevante Spalten:

- ID
- Runde
- Aussage
- W&W-Typ

Die Spalte „Runde“ in der Excel ist nicht gleichbedeutend mit der tatsächlichen Gesprächsrunde im Programm. Sie ist als Rundenwert beziehungsweise Prioritätswert innerhalb des jeweiligen W&W-Typs zu verstehen.

---

## 5. Nutzer-Menü und Profiling-Übersicht

Das Programm benötigt eine Profiling-Übersicht für jeden Nutzer.

Der Nutzer soll jederzeit sehen können, welche Profilings er bereits angelegt hat. Die Profilings werden in der Übersicht mit ihrem Alias-Namen angezeigt.

Jeder Nutzer darf unbegrenzt viele Profilings erstellen.

Innerhalb eines Nutzerkontos darf es keine Alias-Dubletten geben. Das bedeutet:

- Derselbe Alias darf für denselben Nutzer nicht zweimal angelegt werden.
- Die Prüfung sollte normalisiert erfolgen, also zum Beispiel ohne Beachtung von Groß-/Kleinschreibung und unnötigen Leerzeichen.
- Beispiel: „kunde-a“, „Kunde-A“ und „ Kunde-A “ gelten als derselbe Alias.
- Wenn ein Alias bereits existiert, darf kein neues Profiling mit diesem Alias erstellt werden.
- In diesem Fall soll der Nutzer aufgefordert werden, einen anderen Alias zu wählen oder das bestehende Profiling zu öffnen.

---

## 6. Menülogik bei Nutzern ohne Profiling

Wenn ein Nutzer noch kein Profiling erstellt hat, gibt es in der Profiling-Übersicht nur die Möglichkeit, ein neues Profiling zu starten.

Beispieltext:

„Sie haben noch kein Profiling angelegt. Starten Sie jetzt Ihr erstes Werry&Werry-Profiling.“

Aktion:

- Neues Profiling starten

Danach beginnt die Alias-Abfrage.

---

## 7. Menülogik bei Nutzern mit bestehenden Profilings

Wenn ein Nutzer bereits Profilings angelegt hat, werden diese in einer Übersicht angezeigt.

Die Übersicht soll mindestens folgende Informationen enthalten:

- Alias
- aktueller Status
- Haupttyp, falls bereits vorhanden
- Nebenausprägung, falls bereits vorhanden
- letzte Bearbeitung
- verfügbare Aktionen

Beispielhafte Darstellung:

| Alias | Status | Haupttyp | Nebenausprägung | Letzte Änderung | Aktionen |
|---|---|---|---|---|---|
| Projekt-A | Phase 1 läuft | noch offen | noch offen | 12.03.2026 | Fortsetzen |
| Kunde-B | Phase 1 abgeschlossen | Typ 3 | Typ 8 | 13.03.2026 | Phase 2 starten / Ergebnis anzeigen |
| Entscheider-C | Phase 2 läuft | Typ 6 | Typ 1 | 14.03.2026 | Fortsetzen |
| Kontakt-D | abgeschlossen | Typ 9 | Typ 2 | 15.03.2026 | Ergebnis anzeigen |

Zusätzlich muss immer die Aktion angeboten werden:

- Neues Profiling starten

Das gilt auch dann, wenn bereits viele Profilings vorhanden sind.

---

## 8. Profiling-Status und mögliche Aktionen

Das System soll den Status eines Profilings eindeutig speichern.

Mögliche Statuswerte:

1. Alias angelegt, Phase 1 noch nicht gestartet
2. Phase 1 läuft
3. Phase 1 abgeschlossen, Phase 2 noch nicht gestartet
4. Phase 2 läuft
5. Pausiert
6. Abgeschlossen

Je nach Status werden unterschiedliche Aktionen angeboten.

### Status: Alias angelegt, Phase 1 noch nicht gestartet

Aktion:

- Phase 1 starten / Fortsetzen

### Status: Phase 1 läuft

Aktion:

- Fortsetzen

Das System setzt exakt bei der zuletzt offenen Kategorie fort.

### Status: Phase 1 abgeschlossen, Phase 2 noch nicht gestartet

Aktionen:

- Phase 2 starten
- Ergebnis anzeigen
- später fortsetzen

### Status: Phase 2 läuft

Aktion:

- Fortsetzen

Das System setzt exakt bei der zuletzt offenen Aussage oder Runde fort.

### Status: Pausiert

Aktion:

- Fortsetzen

Das System setzt exakt an der gespeicherten Stelle fort.

### Status: Abgeschlossen

Aktion:

- Ergebnis anzeigen

Wenn das fachlich gewünscht ist, kann zusätzlich eine Option „Weiteres Finetuning starten“ angeboten werden, sofern noch nicht alle maximalen Phase-2-Runden ausgeschöpft sind. Standardmäßig gilt ein abgeschlossenes Profiling aber als beendet.

---

## 9. Zu speichernde Daten pro Profiling

Für jedes Profiling müssen mindestens folgende Informationen gespeichert werden:

- Profiling-ID
- Benutzer-ID
- Alias
- normalisierte Alias-Form zur Dublettenprüfung
- Alias gesetzt: Ja/Nein
- Datum und Uhrzeit der Anlage
- Datum und Uhrzeit der letzten Änderung
- aktueller Status
- aktuelle Phase
- aktuelle Kategorie in Phase 1
- bearbeitete Kategorien in Phase 1
- ausgewählte Aussagen in Phase 1
- Phase-1-Punktestand je W&W-Typ
- etablierter W&W-Typ nach Phase 1
- Nebenausprägung nach Phase 1
- ob Phase 2 gestartet wurde
- aktuelle Runde in Phase 2
- aktuelle Aussage in Phase 2
- bereits gestellte Aussagen in Phase 2
- Bewertungen in Phase 2
- aktueller Punktestand in Phase 2 je W&W-Typ
- aktueller Haupttyp in Phase 2
- aktuelle Nebenausprägung in Phase 2
- Stabilitätseinschätzung
- Abschlussstatus
- verwendete Versionen der Aussagen und Textbausteine

Zusätzlich müssen für jede Nutzerantwort gespeichert werden:

- Profiling-ID
- Aussage-ID
- Aussage-Version
- angezeigter Aussage-Text als Snapshot oder eindeutige Version
- Antwortwert des Nutzers
- Datum und Uhrzeit der Antwort
- Phase
- Runde beziehungsweise Kategorie
- Reihenfolge innerhalb der Runde oder Kategorie

---

## 10. Alias- und Datenschutzlogik

Jedes Profiling beginnt immer mit einem Alias.

Es dürfen keine echten Namen realer Personen verwendet werden. Das System kann dies technisch nicht zuverlässig prüfen. Deshalb muss der Nutzer aktiv bestätigen, dass der Alias keinen Rückschluss auf eine reale Person zulässt.

Ein bereits gesetzter Alias darf innerhalb desselben Profilings nicht erneut abgefragt werden.

Ein neues Profiling beginnt nur, wenn der Nutzer ausdrücklich ein neues Profiling starten möchte.

Wenn ein Nutzer ein unvollständiges Profiling hat, soll das System in der Übersicht anbieten, dieses Profiling fortzusetzen.

---

## 11. Startablauf mit Alias

Wenn der Nutzer „Neues Profiling starten“ auswählt, beginnt der Assistent mit folgendem Textbaustein:

„Wir erstellen nun ein Werry&Werry-Profil für einen konkreten Gesprächspartner. Ziel ist es, eine belastbare Arbeitshypothese zu entwickeln, welcher W&W-Typ bei dieser Person im Vordergrund steht und welche Nebenausprägung zusätzlich eine Rolle spielen könnte.“

Danach folgt:

„Bitte vergeben Sie zuerst einen Alias-Namen für die Person, die wir einschätzen. Nutzen Sie keinesfalls den echten Namen einer realen Person, damit Persönlichkeitsrechte geschützt bleiben. Der Alias hilft uns, das Profil später sauber fortzuführen. Gleichzeitig wird der Vertriebs-Mentor auf den Alias zugreifen können, um typengerechtes Vertriebs- und Verkaufstraining zu ermöglichen.“

Danach wartet das System auf die Alias-Eingabe.

Nach Eingabe des Alias prüft das System:

- Ist der Alias leer?
- Ist der Alias für diesen Nutzer bereits vorhanden?
- Ist der Alias formal zulässig?

Wenn der Alias bereits vorhanden ist, wird kein neues Profiling erstellt. Der Nutzer erhält den Hinweis:

„Dieser Alias existiert bereits in Ihrer Profiling-Übersicht. Bitte wählen Sie einen anderen Alias oder öffnen Sie das bestehende Profiling.“

Nach Eingabe eines gültigen und noch nicht vorhandenen Alias muss der Nutzer folgende Bestätigung aktiv abgeben:

„Ich bestätige hiermit, die AGBs gelesen und verstanden zu haben – insbesondere bestätige ich, dass der vergebene Alias-Name keine Rückschlüsse auf echte Personen geben kann.“

Diese Bestätigung muss gespeichert werden mit:

- Benutzer-ID
- Profiling-ID
- Alias
- Datum und Uhrzeit
- Version des Bestätigungstextes

Der Bestätigungstext darf nicht hard-coded sein. Er muss als Textbaustein in der Datenbank liegen, damit er später geändert werden kann.

Erst nach Alias und Bestätigung startet Phase 1.

---

## 12. Fortsetzen, Pausieren und Neustart

Das System muss folgende Fälle unterscheiden:

### Fall 1: Kein Profiling vorhanden

Der Nutzer sieht nur die Möglichkeit:

- Neues Profiling starten

### Fall 2: Profilings vorhanden

Der Nutzer sieht seine Profiling-Übersicht mit allen vorhandenen Alias-Profilings und den jeweils möglichen Aktionen.

### Fall 3: Nutzer möchte ein vorhandenes Profiling fortsetzen

Das System lädt den gespeicherten Status und setzt exakt an der letzten offenen Stelle fort.

Wenn eine Aussage bereits angezeigt, aber noch nicht beantwortet wurde, soll beim Fortsetzen dieselbe Aussage erneut angezeigt werden.

### Fall 4: Nutzer möchte ein neues Profiling starten

Das System legt ein neues Profiling an und beginnt mit der Alias-Abfrage.

### Fall 5: Nutzer pausiert während einer Runde oder Kategorie

Das System speichert den exakten Zustand.

Beim späteren Fortsetzen wird dieselbe Kategorie, Runde oder Aussage wieder aufgenommen.

---

## 13. Phase 1: Ziel und Einleitung

Phase 1 dient der Bildung einer ersten Arbeitshypothese auf Basis beobachtbarer Merkmale beim ersten Eindruck einer Person.

Nach Alias und Bestätigung wird folgender Textbaustein angezeigt:

„In der ersten Phase arbeiten wir mit dem ersten Eindruck. Menschen bilden sich oft innerhalb weniger Sekunden eine Einschätzung über andere Personen – zum Beispiel anhand von Erscheinungsbild, Körperhaltung, Mimik, Stimme, Gesprächseröffnung und Kommunikationsstil. Dieser erste Eindruck kann erstaunlich treffsicher sein, ist aber auch anfällig für selektive Wahrnehmung und Vorurteile. Deshalb nutzen wir ihn nur als erste Arbeitshypothese und prüfen ihn anschließend im Finetuning genauer.

Ich zeige Ihnen nacheinander mehrere Kategorien mit jeweils 9 Aussagen. Bitte wählen Sie jeweils eine der 9 Aussagen aus, die am besten zu [Alias] passt.“

Der Platzhalter [Alias] wird durch den gespeicherten Alias ersetzt.

---

## 14. Phase 1: Pflichtkategorien

Die Pflichtkategorien werden immer in dieser Reihenfolge bearbeitet:

1. Auftreten und Körpersprache
2. Die Art der Gesprächseröffnung
3. Der Kommunikationsstil

Je Kategorie werden alle 9 Aussagen aus der Excel angezeigt.

Der Nutzer wählt genau eine Aussage aus.

Die W&W-Typzuordnung und Gewichtung werden intern gespeichert, aber dem Nutzer bei der Auswahl nicht angezeigt.

---

## 15. Phase 1: Anzeigeformat der Kategorien

Für jede Pflichtkategorie wird dieses Format verwendet:

Kategorie: [Kategoriename]

Bitte wählen Sie die Aussage, die am besten zu [Alias] passt.

Aussagen:

1. [Aussage 1 aus Excel]
2. [Aussage 2 aus Excel]
3. [Aussage 3 aus Excel]
4. [Aussage 4 aus Excel]
5. [Aussage 5 aus Excel]
6. [Aussage 6 aus Excel]
7. [Aussage 7 aus Excel]
8. [Aussage 8 aus Excel]
9. [Aussage 9 aus Excel]

Die Reihenfolge innerhalb einer Kategorie orientiert sich an der Excel-Reihenfolge beziehungsweise an der Sortierung nach W&W-Typ 1 bis 9.

Der Nutzer antwortet mit einer Zahl von 1 bis 9.

Wenn der Nutzer eine ungültige Eingabe macht, fragt das System erneut nach einer gültigen Zahl von 1 bis 9.

Nach einer gültigen Auswahl:

- Auswahl speichern
- zugehörigen W&W-Typ aus der Datenbank ermitteln
- Gewichtung der Kategorie ermitteln
- Punktestand aktualisieren
- nächste Kategorie anzeigen

Nach Kategorie 1 folgt Kategorie 2.

Nach Kategorie 2 folgt Kategorie 3.

Nach Kategorie 3 folgt die Abfrage der Zusatzkategorien.

---

## 16. Phase 1: Zusatzkategorien

Nach den drei Pflichtkategorien fragt das System:

„Die drei wichtigsten Kategorien des ersten Eindrucks sind nun bearbeitet und wir haben einen ersten Hinweis zum möglichen W&W-Typ. Wenn Sie glauben, dass Sie Aussagen zu folgenden Bereichen ebenso bewerten können, sichern wir so den ersten Eindruck noch weiter ab. Möchten Sie zusätzlich eine, mehrere oder alle der folgenden Kategorien bearbeiten? Sie können sich auch die Aussagen anzeigen lassen und dann entscheiden, ob Sie eine Bewertung abgeben möchten.“

Dann werden die Zusatzkategorien angeboten:

- Welche Fragen werden gestellt
- Reaktion auf Ihre Einwände
- Verhalten in der Abschlussphase

Der Nutzer kann wählen:

- keine Zusatzkategorie
- eine bestimmte Zusatzkategorie
- mehrere Zusatzkategorien
- alle Zusatzkategorien

Wenn Zusatzkategorien gewählt werden, werden sie in folgender Reihenfolge bearbeitet:

1. Welche Fragen werden gestellt
2. Reaktion auf Ihre Einwände
3. Verhalten in der Abschlussphase

Wenn eine Kategorie nicht gewählt wurde, wird sie übersprungen.

---

## 17. Phase 1: Anzeigeformat der Zusatzkategorien

Für jede Zusatzkategorie wird dieses Format verwendet:

Zusatzkategorie: [Kategoriename]

Bitte wählen Sie die Aussage, die am besten zu [Alias] passt.

Aussagen:

1. [Aussage 1 aus Excel]
2. [Aussage 2 aus Excel]
3. [Aussage 3 aus Excel]
4. [Aussage 4 aus Excel]
5. [Aussage 5 aus Excel]
6. [Aussage 6 aus Excel]
7. [Aussage 7 aus Excel]
8. [Aussage 8 aus Excel]
9. [Aussage 9 aus Excel]

Der Nutzer kann entweder eine Zahl von 1 bis 9 wählen oder die Zusatzkategorie überspringen.

Wenn der Nutzer eine Zahl nennt:

- Auswahl speichern
- zugehörigen W&W-Typ ermitteln
- Gewichtung ermitteln
- Punktestand aktualisieren
- nächste gewählte Zusatzkategorie anzeigen

Wenn der Nutzer die Kategorie überspringt:

- Kategorie nicht werten
- keine Punkte vergeben
- nächste gewählte Zusatzkategorie anzeigen

Nach Abschluss der Zusatzkategorien folgt die Auswertung von Phase 1.

---

## 18. Phase 1: Berechnung

Jede ausgewählte Aussage ist einem W&W-Typ zugeordnet.

Für die Berechnung gilt:

- Der W&W-Typ der ausgewählten Aussage erhält die Gewichtung der jeweiligen Kategorie als Punkte.
- Nicht ausgewählte Typen erhalten für diese Kategorie 0 Punkte.
- Die Punkte werden je W&W-Typ aufsummiert.

Beispiel:

Wenn in der Kategorie „Auftreten und Körpersprache“ eine Aussage gewählt wird, die W&W-Typ 3 zugeordnet ist, erhält Typ 3 den Wert 0,4.

Wenn in der Kategorie „Die Art der Gesprächseröffnung“ eine Aussage gewählt wird, die W&W-Typ 8 zugeordnet ist, erhält Typ 8 den Wert 0,2.

Die Berechnung erfolgt über alle beantworteten Kategorien.

Zusatzkategorien, die übersprungen wurden, werden nicht gewertet.

---

## 19. Phase 1: Ergebnis und Tie-Breaking

Nach Abschluss von Phase 1 wird ermittelt:

- etablierter W&W-Typ nach Phase 1
- Nebenausprägung nach Phase 1

Der etablierte W&W-Typ ist grundsätzlich der Typ mit der höchsten Punktzahl.

Die Nebenausprägung ist grundsätzlich der Typ mit der zweithöchsten Punktzahl.

Falls es einen Gleichstand gibt, wird folgende Reihenfolge zur Auflösung verwendet:

1. Höhere Gesamtpunktzahl
2. Höhere Punktzahl aus den drei Pflichtkategorien
3. Auswahl in der früheren beziehungsweise höher gewichteten Kategorie
   Reihenfolge:
   - Auftreten und Körpersprache
   - Die Art der Gesprächseröffnung
   - Der Kommunikationsstil
   - Welche Fragen werden gestellt
   - Reaktion auf Ihre Einwände
   - Verhalten in der Abschlussphase
4. Wenn danach immer noch Gleichstand besteht, wird das Ergebnis als gleichauf gekennzeichnet. Für die technische Fortsetzung in Phase 2 wird der zuerst nach dieser Logik verfügbare Typ als Arbeits-Haupttyp verwendet.

Dem Nutzer soll keine Scheingenauigkeit vermittelt werden. Das Ergebnis ist als Arbeitshypothese auszugeben.

---

## 20. Phase 1: Ausgabe

Nach der Berechnung zeigt das System ein kurzes Ergebnis.

Beispielhafte Struktur:

„Das Phase-1-Profil für [Alias] ist abgeschlossen.

Etablierter W&W-Typ nach Phase 1: W&W-Typ [X]
Nebenausprägung: W&W-Typ [Y]

Bitte beachten Sie: Dies ist eine vertriebspraktische Arbeitshypothese auf Basis des ersten Eindrucks und keine psychologische Diagnose.“

Danach folgt der Übergang zu Phase 2.

---

## 21. Übergang zu Phase 2

Nach Phase 1 wird folgender Textbaustein verwendet:

„Der W&W-Typ von [Alias] ist nun auf Basis des ersten Eindrucks etabliert. Das ist bereits eine gute Ausgangslage, um Verkaufstraining und Gesprächsstrategie an diesem Typ auszurichten. Wenn Sie möchten, können wir jetzt oder später mit Phase 2, dem Finetuning, fortfahren.“

Danach folgt die Erklärung:

„Im Finetuning werden weitere Aussagen bewertet. Jede Aussage bewerten Sie mit 0 bis 5 Punkten. Insgesamt können bis zu 90 Aussagen bearbeitet werden, in maximal 10 Runden mit jeweils 9 Aussagen. Meist zeigt sich schon nach 2 bis 3 Runden eine sehr stabile Einordnung.“

Danach fragt das System:

„Möchten Sie jetzt mit Phase 2 starten?“

Wenn der Nutzer nicht starten möchte:

- Profiling-Status speichern
- Phase 1 als abgeschlossen markieren
- Phase 2 als noch nicht gestartet markieren
- freundlich beenden
- darauf hinweisen, dass Phase 2 später über die Profiling-Übersicht gestartet werden kann

Wenn der Nutzer starten möchte:

- Phase 2 initialisieren
- Runde 1 vorbereiten
- erste Aussage aus Runde 1 anzeigen

---

## 22. Phase 2: Voraussetzung

Phase 2 darf nur gestartet werden, wenn Phase 1 abgeschlossen ist und ein etablierter W&W-Typ nach Phase 1 gespeichert wurde.

Falls ein Nutzer Phase 2 starten möchte, ohne dass Phase 1 abgeschlossen wurde, soll das System freundlich darauf hinweisen, dass zuerst Phase 1 durchgeführt werden muss.

---

## 23. Phase 2: Bewertungsskala

In Phase 2 wird jede Aussage einzeln angezeigt.

Der Nutzer bewertet jede Aussage mit 0 bis 5 Punkten.

Bedeutung:

0 = keine Einschätzung möglich / keine Meinung
1 = trifft kaum zu
2 = trifft eher wenig zu
3 = trifft teilweise zu
4 = trifft deutlich zu
5 = trifft sehr stark zu

Diese Skala soll zu Beginn von Phase 2 erklärt werden und bei Bedarf erneut angezeigt werden können.

---

## 24. Phase 2: Anzeigeformat der Aussagen

Jede Aussage wird einzeln angezeigt.

Format:

Aussage [x] von 9:

[exakter Aussage-Text aus der aktiven Datenbankversion]

Bitte bewerten Sie diese Aussage für [Alias] mit 0 bis 5.

Nach jeder Aussage wartet das System auf die Bewertung.

Erlaubt sind nur Werte von 0 bis 5.

Bei ungültiger Eingabe wird dieselbe Aussage erneut angezeigt und um eine gültige Bewertung gebeten.

---

## 25. Phase 2: Allgemeine Regeln

Für Phase 2 gelten folgende Regeln:

- Es gibt maximal 10 Runden.
- Jede Runde enthält 9 Aussagen.
- Jede Aussage wird einzeln gestellt.
- Aussagen mit Bewertung 1 bis 5 dürfen nie erneut gestellt werden.
- Aussagen mit Bewertung 0 dürfen später erneut gestellt werden.
- Eine mit 0 bewertete Aussage bringt keine Punkte.
- Eine mit 0 bewertete Aussage zählt dennoch als beantwortete Aussage für die aktuelle Runde.
- Innerhalb derselben Runde darf keine Aussage doppelt gestellt werden.
- Die Auswahl der Aussagen richtet sich dynamisch nach dem aktuellen Haupttyp und der aktuellen Nebenausprägung.
- Der Nutzer kann nach Zwischenergebnissen entscheiden, ob er fortfahren möchte.
- Nach Runde 1 wird intern ausgewertet und automatisch mit Runde 2 fortgefahren.
- Ab Runde 2 werden Zwischenergebnisse angezeigt.

---

## 26. Phase 2: Speicherung der Runden

Wenn eine Runde vorbereitet wird, muss die ausgewählte Aussagenliste für diese Runde gespeichert werden.

Das ist wichtig, damit beim Pausieren und Fortsetzen nicht versehentlich eine neue Auswahl generiert wird.

Pro Runde müssen gespeichert werden:

- Rundennummer
- ausgewählte Aussage-IDs
- Reihenfolge der Anzeige
- ob die Aussage bereits beantwortet wurde
- Bewertung des Nutzers
- Zeitpunkt der Bewertung

Wenn der Nutzer mitten in einer Runde pausiert, wird später mit der nächsten offenen Aussage aus derselben gespeicherten Runde fortgesetzt.

---

## 27. Phase 2: Runde 1

Runde 1 basiert auf dem etablierten W&W-Typ aus Phase 1.

Für Runde 1 werden 9 Aussagen ausgewählt:

- 2 Aussagen des in Phase 1 führenden W&W-Typs
- 7 Aussagen anderer W&W-Typen

Für den führenden W&W-Typ werden die Aussagen mit Rundenwert 1 und Rundenwert 2 aus der Excel verwendet.

Für die anderen W&W-Typen werden Aussagen mit Rundenwert 1 verwendet.

Da es 8 andere W&W-Typen gibt, aber nur 7 Aussagen anderer Typen benötigt werden, wird einer der 8 anderen Typen in Runde 1 ausgelassen.

Der ausgelassene Typ soll gespeichert und in den nächsten Runden bevorzugt berücksichtigt werden, sofern er nicht ohnehin als Haupttyp oder Nebenausprägung relevant wird.

Die Reihenfolge der 9 ausgewählten Aussagen innerhalb der Runde kann zufällig gemischt werden, damit der Nutzer keine Typ-Struktur erkennt. Die Typzuordnung wird dem Nutzer nicht angezeigt.

Nach jeder Bewertung wird die Antwort gespeichert.

Nach Abschluss von Runde 1:

- Punkte je W&W-Typ berechnen
- aktuellen Haupttyp ermitteln
- aktuelle Nebenausprägung ermitteln
- Ergebnis intern speichern
- automatisch mit Runde 2 fortfahren

Nach Runde 1 wird noch kein ausführliches Zwischenergebnis angezeigt.

---

## 28. Phase 2: Runde 2

Runde 2 basiert auf dem Ergebnis aus Runde 1.

Für Runde 2 werden 9 Aussagen ausgewählt:

- 2 verfügbare Aussagen des aktuell führenden W&W-Typs
- 2 verfügbare Aussagen der aktuellen Nebenausprägung
- 5 verfügbare Aussagen anderer W&W-Typen

Verfügbar bedeutet:

- Die Aussage wurde noch nicht mit 1 bis 5 bewertet.
- Die Aussage ist nicht bereits in der aktuellen Runde eingeplant.
- Aussagen, die früher mit 0 bewertet wurden, gelten weiterhin als verfügbar.

Bei der Auswahl sollen niedrigere Rundenwerte bevorzugt werden.

Für Runde 2 gilt besonders:

- Zuerst Aussagen mit Rundenwert 1 verwenden, falls noch verfügbar.
- Danach Aussagen mit Rundenwert 2 verwenden.
- Danach entsprechend höhere Rundenwerte.

Nach Abschluss von Runde 2 wird ein Zwischenergebnis angezeigt.

Danach fragt das System:

„Möchten Sie mit einer weiteren Runde fortfahren?“

Wenn der Nutzer fortfahren möchte, beginnt Runde 3.

Wenn der Nutzer nicht fortfahren möchte, wird das Profiling abgeschlossen oder pausiert, je nachdem, was der Nutzer ausdrücklich möchte.

---

## 29. Phase 2: Ab Runde 3

Ab Runde 3 wird nach demselben Grundprinzip wie in Runde 2 verfahren.

Pro Runde werden 9 Aussagen ausgewählt:

- 2 verfügbare Aussagen zum aktuell führenden W&W-Typ
- 2 verfügbare Aussagen zur aktuellen Nebenausprägung
- 5 verfügbare Aussagen anderer W&W-Typen

Auch hier gilt:

- Niedrige Rundenwerte werden bevorzugt.
- Aussagen mit Bewertung 1 bis 5 sind gesperrt.
- Aussagen mit Bewertung 0 dürfen erneut gestellt werden.
- Keine Aussage darf innerhalb derselben Runde doppelt vorkommen.
- Falls für einen Zieltyp weniger verfügbare Aussagen vorhanden sind als benötigt, werden die fehlenden Plätze mit verfügbaren Aussagen anderer Typen aufgefüllt.
- Bei der Auffüllung sollen unterrepräsentierte Typen bevorzugt werden.

Nach jeder Runde:

- Ranking aktualisieren
- Haupttyp ermitteln
- Nebenausprägung ermitteln
- Arbeitswahrscheinlichkeit einschätzen
- Stabilität einschätzen
- Zwischenergebnis anzeigen
- fragen, ob der Nutzer fortfahren möchte

Nach maximal 10 Runden wird das Profiling automatisch abgeschlossen.

---

## 30. Phase 2: Punktesystem

In Phase 2 werden Punkte direkt aus den Nutzerbewertungen gebildet.

Wenn eine Aussage einem W&W-Typ zugeordnet ist, erhält dieser Typ die vom Nutzer vergebene Punktzahl.

Beispiel:

Eine Aussage ist W&W-Typ 6 zugeordnet.
Der Nutzer bewertet sie mit 4.
Dann erhält W&W-Typ 6 vier Punkte.

Bewertung 0:

- wird gespeichert
- bringt keine Punkte
- sperrt die Aussage nicht dauerhaft
- erlaubt eine spätere erneute Anzeige dieser Aussage

Der aktuelle Punktestand in Phase 2 wird je W&W-Typ summiert.

Phase 1 wird nicht in den Phase-2-Punktestand eingerechnet.

Phase 1 bleibt als Ausgangshypothese separat gespeichert.

---

## 31. Phase 2: Haupttyp und Nebenausprägung

Nach jeder abgeschlossenen Runde wird ermittelt:

- aktueller Haupttyp
- aktuelle Nebenausprägung

Der Haupttyp ist der W&W-Typ mit der höchsten Punktzahl in Phase 2.

Die Nebenausprägung ist der W&W-Typ mit der zweithöchsten Punktzahl in Phase 2.

Bei Gleichstand in Phase 2 gilt folgende Reihenfolge:

1. Höhere Phase-2-Punktzahl
2. Falls gleich: Typ, der in Phase 1 stärker war
3. Falls gleich: Phase-1-Haupttyp vor Phase-1-Nebenausprägung
4. Falls gleich: mehr Bewertungen mit 5 Punkten
5. Falls gleich: mehr Bewertungen mit 4 oder 5 Punkten
6. Falls immer noch gleich: Ergebnis als gleichauf kennzeichnen und einen technischen Arbeits-Haupttyp für die Fortsetzung festlegen

Wenn ein Gleichstand fachlich relevant ist, soll dies in der Ergebnisformulierung vorsichtig sichtbar gemacht werden.

---

## 32. Phase 2: Zwischenergebnis

Nach Runde 2 und nach jeder weiteren Runde wird ein Zwischenergebnis angezeigt.

Das Zwischenergebnis enthält:

- aktueller Haupttyp
- aktuelle Nebenausprägung
- Arbeitswahrscheinlichkeit des Haupttyps
- Stabilität der Einschätzung
- Hinweis, dass es sich nicht um eine Diagnose handelt

Beispielhafte Struktur:

„Zwischenergebnis nach Runde [Rundennummer]:

Aktueller Haupttyp: W&W-Typ [X]
Aktuelle Nebenausprägung: W&W-Typ [Y]
Arbeitswahrscheinlichkeit: [vorsichtige Einschätzung]
Stabilität: [vorsichtige Stabilitätseinschätzung]

Hinweis: Dies ist eine vertriebspraktische Arbeitshypothese und keine psychologische Diagnose.“

Danach:

„Möchten Sie mit einer weiteren Runde fortfahren?“

---

## 33. Arbeitswahrscheinlichkeit und Stabilität

Die Arbeitswahrscheinlichkeit und Stabilität sind heuristische Einschätzungen. Sie sind keine statistische Wahrheit und keine psychologische Diagnose.

Das System soll keine Scheingenauigkeit erzeugen. Deshalb sollen lieber vorsichtige Formulierungen verwendet werden statt exakter Prozentwerte.

Zulässige Formulierungen sind zum Beispiel:

- „derzeit eher schwach abgesichert“
- „derzeit plausibel, aber noch offen“
- „bereits recht stabil“
- „sehr stabil, weitere Runden würden voraussichtlich nur noch feinjustieren“

Für eine erste Umsetzung kann folgende Logik genutzt werden:

### Eher schwach abgesichert

Wenn:

- erst wenige Aussagen bewertet wurden oder
- der Abstand zwischen Haupttyp und Nebenausprägung sehr klein ist oder
- der Haupttyp gerade erst gewechselt hat

Formulierung:

„Die Einschätzung ist derzeit eher schwach abgesichert. Weitere Runden sind sinnvoll.“

### Plausibel, aber noch offen

Wenn:

- mindestens zwei Runden abgeschlossen sind und
- ein Haupttyp erkennbar ist, aber
- der Abstand zur Nebenausprägung noch nicht groß ist

Formulierung:

„Die Einschätzung ist derzeit plausibel, aber noch offen. Weitere Aussagen können das Bild noch verändern.“

### Bereits recht stabil

Wenn:

- mehrere Runden abgeschlossen sind und
- der Haupttyp über mindestens zwei Auswertungen hinweg stabil bleibt und
- ein deutlicher Abstand zur Nebenausprägung besteht

Formulierung:

„Die Einschätzung ist bereits recht stabil. Weitere Runden können noch feinjustieren.“

### Sehr stabil

Wenn:

- mindestens vier Runden abgeschlossen sind und
- der Haupttyp über mehrere Runden stabil bleibt und
- ein sehr deutlicher Abstand zur Nebenausprägung besteht

Formulierung:

„Die Einschätzung ist sehr stabil. Weitere Runden würden voraussichtlich nur noch feinjustieren.“

Wenn Prozentwerte verwendet werden, müssen sie ausdrücklich als Arbeitswahrscheinlichkeit bezeichnet werden. Es dürfen keine exakten Nachkommastellen oder scheinbar wissenschaftlichen Genauigkeiten ausgegeben werden.

---

## 34. Abschluss des Profilings

Das Profiling kann abgeschlossen werden, wenn:

- der Nutzer nach einem Zwischenergebnis nicht weiter fortfahren möchte
- die maximale Anzahl von 10 Runden erreicht ist
- fachlich eine sehr stabile Einschätzung erreicht ist und der Nutzer beenden möchte

Beim Abschluss wird folgender Textbaustein verwendet:

„Sehr gut, das Profiling für [Alias] ist nun abgeschlossen. Die Arbeit hat sich gelohnt: Auf dieser Grundlage können Verkaufstraining, Gesprächsstrategie, Einwandbehandlung und Beratung jetzt deutlich zielgerichteter am etablierten W&W-Typ ausgerichtet werden.“

Danach gibt das System aus:

- finaler W&W-Typ
- finale Nebenausprägung
- kurze Stabilitätseinschätzung

Wenn Phase 2 durchgeführt wurde, basiert das finale Ergebnis auf Phase 2.

Wenn nur Phase 1 durchgeführt wurde, basiert das Ergebnis auf Phase 1 und wird entsprechend als weniger abgesicherte Arbeitshypothese gekennzeichnet.

---
