# Noel OS — Deploy auf Oracle Cloud (Always Free)

Ergebnis: deine App läuft 24/7 unter `https://deine-domain.duckdns.org`, Mails werden
im Hintergrund abgerufen und sortiert, Push-Mitteilungen funktionieren.

Alles kostenlos. Reihenfolge:

## 1. Gratis-Domain (DuckDNS)
1. https://www.duckdns.org öffnen → mit Google/GitHub einloggen.
2. Subdomain ausdenken, z. B. `noelbreuer` → **add domain**. Du hast jetzt
   `noelbreuer.duckdns.org`.
3. Die IP tragen wir in Schritt 3 ein (sobald die VM steht).

## 2. Oracle-VM erstellen
1. https://www.oracle.com/cloud/free → Account anlegen (Karte nur zur
   Verifizierung, keine Abbuchung). Region in der Nähe wählen (z. B. Frankfurt).
2. Menü → **Compute → Instances → Create Instance**.
3. **Image**: Canonical **Ubuntu** (24.04). **Shape**: „Ampere" **VM.Standard.A1.Flex**
   (ARM, Always Free) mit z. B. 1–2 OCPU und 6–12 GB RAM. Falls „out of capacity":
   kleinere OCPU probieren oder später erneut.
4. **SSH-Key**: „Generate a key pair" → **beide** Dateien herunterladen (brauchst du
   nur als Notfall-Backup; für den normalen Betrieb nicht nötig).
5. **Advanced options → Management → User data** → Inhalt von
   `deploy/oracle-cloud-init.yaml` einfügen und die Platzhalter ersetzen:
   - `DEINE-DOMAIN.duckdns.org` → deine DuckDNS-Domain
   - `DEIN_GEMINI_KEY`, `DEIN_GMX_PASSWORT`, `DEIN_GMAIL_APP_PASSWORT`
   - `DEIN_GITHUB_NAME` → dein GitHub-Name (siehe Schritt 0 unten)
6. **Create**. Nach ~1 Min hat die Instanz eine **Public IP** — merken.

## 3. Domain auf die VM zeigen
Zurück auf DuckDNS: bei deiner Subdomain die **Public IP** der VM eintragen → **update ip**.

## 4. Ports öffnen (Oracle-Firewall)
Oracle-Konsole → deine Instanz → **Virtual Cloud Network → Security Lists →
Default Security List → Add Ingress Rules**:
- Quelle `0.0.0.0/0`, TCP, Zielport **80**
- Quelle `0.0.0.0/0`, TCP, Zielport **443**

## 5. Fertig
Das Startskript baut und startet alles automatisch (dauert beim ersten Mal ein paar
Minuten, weil das Image gebaut wird). Danach:
- `https://deine-domain.duckdns.org` im **Safari** öffnen.
- Teilen → **Zum Home-Bildschirm** → App öffnen → **Mitteilungen erlauben**.

---

## Schritt 0: Code auf GitHub (einmalig)
Das Startskript lädt den Code von GitHub. Dafür muss der Code in einem (öffentlichen)
Repo liegen. Das richten Claude und du gemeinsam ein — danach steht die URL
`https://github.com/iphpen286-bot/noel-os` fest und kommt in die cloud-init.

## Spätere Updates
Per SSH auf die VM:
```
cd /opt/noel-os && git pull && docker compose up -d --build
```

## Nützliche Befehle (SSH)
- Logs: `cd /opt/noel-os && docker compose logs -f app`
- Neustart: `docker compose restart`
- Status: `docker compose ps`
