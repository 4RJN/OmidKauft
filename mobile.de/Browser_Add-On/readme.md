🗂️ Inhalt

manifest.json (Manifest V3)

content.js (enthält deine komplette Funktion inkl. Overlay, Paging-Fetch + AdCleaner)

popup.html + popup.js (Toolbar-Popup mit „Inserate extrahieren“-Button & Toggle für AdCleaner)

▶️ Installation (Chrome/Edge/Brave/Opera)

ZIP entpacken.

chrome://extensions öffnen → Entwicklermodus aktivieren.

Entpackte Erweiterung laden → den entpackten Ordner auswählen.

Auf mobile.de gehen → auf die Erweiterungs-Schaltfläche klicken:

„Inserate extrahieren“ öffnet dein Overlay mit Tabelle/Export.

„Werbung/Sponsored/Top automatisch ausblenden“ ein/aus.

🦊 Firefox (Developer Edition empfohlen)

ZIP entpacken.

about:debugging#/runtime/this-firefox → „Temporäre Add-on laden“ → manifest.json wählen.

Button in der Toolbar nutzen.

ℹ️ Hinweise

Das Add-on läuft automatisch auf https://www.mobile.de/* und https://suchen.mobile.de/*.

Der AdCleaner-Status wird gespeichert (bei Seitenwechsel erneut aktiv).

Die Tabelle hat Sortierung, CSV-Export und „Weitere Seiten laden“ (N Seiten via fetch aggregieren).

Die Erkennung Privat/Händler ist heuristisch; wenn mobile.de neue explizite Marker einbaut,  muss angepasst werden.
