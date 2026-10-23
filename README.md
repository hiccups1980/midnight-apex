# Midnight Apex

Ein kleines 3D-Arcade-Rennspiel im Browser, inspiriert von der schnellen, farbenfrohen Rennspiel-Ära der 1980er. Es verwendet Three.js und Vite; Strecke, Autos und Landschaft werden direkt im Code aufgebaut.

## Starten

Zum Spielen genügt die **`index.html` im Hauptverzeichnis**: Datei herunterladen und per Doppelklick im Browser öffnen. Alles ist eingebettet, einschließlich 3D-Engine und Gestaltung. Es werden weder Node.js noch ein Server oder eine Internetverbindung benötigt. Voraussetzung ist ein aktueller Browser mit WebGL 2.

GitHub zeigt HTML-Dateien als Quellcode an. Zum Spielen die Datei wirklich herunterladen und lokal öffnen oder auf einem Webserver bereitstellen.

## Entwickeln

Voraussetzung: Node.js 20.19+ oder 22.12+.

```sh
npm install
npm run dev
```

Vite zeigt danach eine lokale Adresse an (standardmäßig `http://localhost:5173`). Für einen Produktionsbuild:

```sh
npm run build
npm run preview
```

Der Build erzeugt zusätzlich die direkt öffnungsfähige `index.html` im Hauptverzeichnis und in `dist/`. Änderungen erfolgen in `src/`; die HTML-Vorlage liegt in `src/index.html`. Nach Änderungen `npm run build` ausführen und die aktualisierte `index.html` mit hochladen.

## Steuerung

- **↑ / W:** Beschleunigen
- **↓ / S:** Bremsen und rückwärts fahren
- **← / A** und **→ / D:** Lenken
- **Leertaste:** Handbremse
- **R:** Rennen neu starten
- **Enter:** Countdown starten

Drei Runden fahren, die Bestzeit bleibt lokal im Browser gespeichert. Über das Notensymbol oben rechts lässt sich der einfache Start-/Countdown-Sound aktivieren.

Auf kleinen Bildschirmen erscheinen nach dem Start Touch-Tasten für Gas, Bremse und Lenkung. Beim Verlassen des Browserfensters pausiert das Rennen. Kontrollpunkte müssen in Reihenfolge auf der Strecke passiert werden; nach einem verpassten Kontrollpunkt zurückfahren oder das Rennen mit **R** neu starten.

## Prüfungen

```sh
npm test
npm run build
```

Die Logiktests benötigen Node.js 22.18 oder neuer (empfohlen: Node.js 24). Sie prüfen Ausrollen, Bremsen, Geschwindigkeitsgrenzen, Fahrzeugausrichtung, Zeitformatierung, gespeicherte Bestzeiten und die Rundenzählung.

Der Prototyp hat noch keine Fahrzeug- oder Baumkollisionen. Die Bestzeit wird bei gesperrtem Browserspeicher nur für die aktuelle Sitzung gehalten.
