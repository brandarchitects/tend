# Tend — Dein Netzwerk. Gepflegt.

Persönliches CRM im Browser. Kontakte verwalten, Beziehungen pflegen, KI-Empfehlungen erhalten.

---

## Setup-Anleitung (Schritt für Schritt)

Diese Anleitung erklärt jeden Schritt so, dass du ohne Entwicklungserfahrung alles einrichten kannst. Du brauchst nur einen Browser und ca. 30 Minuten.

---

### Schritt 1: Firebase einrichten (Datenbank + Login)

Firebase ist die Datenbank, in der deine Kontakte gespeichert werden, und das Login-System.

#### 1.1 Firebase-Projekt erstellen

1. Öffne [console.firebase.google.com](https://console.firebase.google.com/)
2. Melde dich mit deinem Google-Konto an
3. Klicke **"Projekt erstellen"**
4. Projektname: `tend-crm` (oder ein Name deiner Wahl)
5. Google Analytics: kannst du **deaktivieren** (brauchst du nicht)
6. Klicke **"Projekt erstellen"** und warte bis es fertig ist
7. Klicke **"Weiter"**

#### 1.2 Web-App registrieren

1. Auf der Projekt-Startseite klicke das **Web-Symbol** `</>` (sieht aus wie spitze Klammern)
2. App-Name: `Tend`
3. Firebase Hosting: **nicht** ankreuzen
4. Klicke **"App registrieren"**
5. Du siehst jetzt einen Code-Block mit deiner Konfiguration. **Notiere dir diese drei Werte:**
   - `apiKey` → das ist dein `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `authDomain` → das ist dein `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `projectId` → das ist dein `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
6. Klicke **"Weiter zur Konsole"**

#### 1.3 Login aktivieren (Authentication)

1. Im linken Menü klicke auf **"Authentication"**
2. Klicke **"Jetzt starten"**
3. Unter "Anmeldemethode" klicke auf **"E-Mail-Adresse/Passwort"**
4. Schalte den **ersten Schalter auf "Aktiviert"**
5. Klicke **"Speichern"**

#### 1.4 Deinen User anlegen

1. In Authentication, klicke auf den Tab **"Users"**
2. Klicke **"Nutzer hinzufügen"**
3. Gib deine E-Mail-Adresse und ein sicheres Passwort ein
4. Klicke **"Nutzer hinzufügen"**
5. **Merke dir diese Zugangsdaten** — damit meldest du dich in Tend an

#### 1.5 Datenbank aktivieren (Firestore)

1. Im linken Menü klicke auf **"Firestore Database"**
2. Klicke **"Datenbank erstellen"**
3. Standort: wähle **`europe-west6 (Zürich)`** (Daten bleiben in der Schweiz)
4. Sicherheitsregeln: wähle **"Im Produktionsmodus starten"**
5. Klicke **"Erstellen"**

#### 1.6 Sicherheitsregeln setzen

Damit nur du (eingeloggt) auf die Daten zugreifen kannst:

1. In Firestore, klicke auf den Tab **"Regeln"**
2. Ersetze den gesamten Text mit folgendem:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

3. Klicke **"Veröffentlichen"**

#### 1.7 Firestore-Indexe erstellen

Tend braucht zwei Such-Indexe. Erstelle sie so:

1. In Firestore, klicke auf den Tab **"Indexe"**
2. Klicke **"Index erstellen"**
3. Erstelle diese zwei Indexe:

**Index 1:**
- Sammlungs-ID: `contacts`
- Felder: `contexts` (Arrays) + `lastName` (Aufsteigend)
- Klicke "Erstellen"

**Index 2:**
- Sammlungs-ID: `interactions`
- Felder: `contactId` (Aufsteigend) + `date` (Absteigend)
- Klicke "Erstellen"

> Die Indexe brauchen ca. 2–5 Minuten zum Erstellen. Du siehst den Status in der Liste.

---

### Schritt 2: Anthropic API Key holen (KI-Empfehlungen)

Die KI-Empfehlungen auf dem Dashboard kommen von Claude (Anthropic).

1. Öffne [console.anthropic.com](https://console.anthropic.com/)
2. Erstelle ein Konto oder melde dich an
3. Gehe zu **"API Keys"** (im linken Menü)
4. Klicke **"Create Key"**
5. Name: `Tend`
6. Kopiere den angezeigten Key — er beginnt mit `sk-ant-...`
7. **Speichere ihn sicher** — du siehst ihn nur einmal

> Kosten: ca. CHF 5–15/Monat bei normaler Nutzung. Du kannst ein Ausgabenlimit setzen unter "Plans & Billing".

---

### Schritt 3: Resend einrichten (E-Mail-Reminder)

Resend sendet dir täglich eine E-Mail wenn Touchpoints fällig sind.

1. Öffne [resend.com](https://resend.com/)
2. Erstelle ein Konto (kostenlos, 100 E-Mails/Tag reichen für dich)
3. Gehe zu **"API Keys"**
4. Klicke **"Create API Key"**
5. Name: `Tend`
6. Permission: **"Sending access"**
7. Kopiere den Key — er beginnt mit `re_...`

> **Wichtig:** Im Free-Plan kann Resend nur an deine eigene E-Mail senden. Das reicht für Tend (du bist der einzige Nutzer). Wenn du eine eigene Domain hast, kannst du diese später unter "Domains" verifizieren.

---

### Schritt 4: Vercel Deployment (App online bringen)

Vercel hostet die App und macht sie im Browser erreichbar.

#### 4.1 GitHub-Repository verbinden

1. Öffne [vercel.com](https://vercel.com/)
2. Melde dich mit deinem **GitHub-Account** an
3. Klicke **"Add New" → "Project"**
4. Suche das Repository `brandarchitects/tend`
5. Klicke **"Import"**

#### 4.2 Environment Variables setzen

Bevor du deployst, musst du die Schlüssel eintragen:

1. Auf der Import-Seite scrolle zu **"Environment Variables"**
2. Füge diese Variablen hinzu (Name links, Wert rechts):

| Name | Wert (von wo) |
|------|---------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Aus Schritt 1.2 |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Aus Schritt 1.2 |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Aus Schritt 1.2 |
| `ANTHROPIC_API_KEY` | Aus Schritt 2 |
| `RESEND_API_KEY` | Aus Schritt 3 |
| `CRON_SECRET` | Ein beliebiger langer Text, z.B. `mein-geheimer-cron-schluessel-2024` |

3. Klicke **"Deploy"**
4. Warte 1–2 Minuten bis das Deployment fertig ist
5. Du bekommst eine URL wie `tend-abc123.vercel.app` — das ist deine App!

#### 4.3 Eigene Domain verbinden (optional)

1. In Vercel, gehe zu deinem Projekt → **"Settings" → "Domains"**
2. Gib deine gewünschte Domain ein, z.B. `tend.pascalstoeckli.ch`
3. Vercel zeigt dir DNS-Einstellungen die du bei deinem Domain-Anbieter setzen musst
4. Bei deinem Domain-Anbieter: erstelle einen **CNAME-Eintrag** der auf `cname.vercel-dns.com` zeigt

---

### Schritt 5: Microsoft Outlook verbinden (optional)

Damit du Termine direkt aus Tend in deinen Outlook-Kalender buchen kannst.

> Dieser Schritt ist **optional** und etwas aufwändiger. Du kannst ihn auch später machen.

#### 5.1 Azure App registrieren

1. Öffne [portal.azure.com](https://portal.azure.com/)
2. Melde dich mit deinem Microsoft-Konto an
3. Suche oben in der Suchleiste nach **"App-Registrierungen"** und klicke darauf
4. Klicke **"Neue Registrierung"**
5. Name: `Tend CRM`
6. Unterstützte Kontotypen: **"Konten in einem beliebigen Organisationsverzeichnis und persönliche Microsoft-Konten"**
7. Umleitungs-URI:
   - Typ: **Web**
   - URI: `https://DEINE-VERCEL-URL.vercel.app/api/outlook/callback`
   - (Ersetze `DEINE-VERCEL-URL` mit deiner echten Vercel-URL)
8. Klicke **"Registrieren"**

#### 5.2 Werte notieren

Auf der Übersichtsseite der App siehst du:
- **Anwendungs-ID (Client)** → das ist dein `MICROSOFT_CLIENT_ID`
- **Verzeichnis-ID (Mandant)** → das ist dein `MICROSOFT_TENANT_ID`

#### 5.3 Client Secret erstellen

1. Im linken Menü klicke auf **"Zertifikate & Geheimnisse"**
2. Klicke **"Neuer geheimer Clientschlüssel"**
3. Beschreibung: `Tend`
4. Ablauf: **24 Monate**
5. Klicke **"Hinzufügen"**
6. Kopiere den **"Wert"** (nicht die ID!) → das ist dein `MICROSOFT_CLIENT_SECRET`

> **Achtung:** Der Wert wird nur einmal angezeigt. Kopiere ihn sofort!

#### 5.4 API-Berechtigungen setzen

1. Im linken Menü klicke auf **"API-Berechtigungen"**
2. Klicke **"Berechtigung hinzufügen"**
3. Wähle **"Microsoft Graph"**
4. Wähle **"Delegierte Berechtigungen"**
5. Suche und aktiviere: **`Calendars.ReadWrite`**
6. Klicke **"Berechtigungen hinzufügen"**

#### 5.5 Keys in Vercel eintragen

1. Gehe zu deinem Vercel-Projekt → **"Settings" → "Environment Variables"**
2. Füge hinzu:
   - `MICROSOFT_CLIENT_ID` → aus Schritt 5.2
   - `MICROSOFT_CLIENT_SECRET` → aus Schritt 5.3
   - `MICROSOFT_TENANT_ID` → aus Schritt 5.2
3. Klicke **"Save"**
4. Gehe zu **"Deployments"** → klicke auf die drei Punkte beim letzten Deployment → **"Redeploy"**

#### 5.6 In Tend verbinden

1. Öffne Tend in deinem Browser
2. Gehe zu **Einstellungen**
3. Klicke **"Mit Microsoft verbinden"**
4. Melde dich mit deinem Microsoft-Konto an und erteile die Berechtigungen
5. Du wirst zurück zu Tend geleitet — fertig!

---

## Tägliche Nutzung

### Erster Login
1. Öffne deine Tend-URL im Browser
2. Gib die E-Mail und das Passwort ein, das du in Schritt 1.4 erstellt hast
3. Du siehst das Dashboard

### Kontakte hinzufügen
- **Manuell:** Gehe zu "Kontakte" → "Neuer Kontakt"
- **iPhone-Import:** Gehe zu "Import/Export" → ziehe eine .vcf Datei rein
  - iPhone: Einstellungen → Kontakte → "Alle Kontakte exportieren" → per AirDrop/Mail an dich senden

### Interaktion loggen
1. Öffne einen Kontakt
2. Klicke "Neue Interaktion"
3. Wähle Kanal (Treffen/Mail/Anruf/LinkedIn), Datum und Notiz
4. Speichern — der Touchpoint-Timer wird zurückgesetzt

### KI-Empfehlungen
- Das Dashboard zeigt dir automatisch 1–3 Kontakte, die du kontaktieren solltest
- Im KI-Assistenten (oben rechts, Sparkles-Icon) siehst du detailliertere Empfehlungen

### Termin buchen (mit Outlook)
1. Öffne einen Kontakt
2. Klicke "Termin buchen"
3. Der Termin wird direkt in deinem Outlook-Kalender erstellt

---

## Kosten-Übersicht

| Service | Kosten |
|---------|--------|
| Firebase (Firestore + Auth) | Kostenlos (Spark Plan reicht) |
| Vercel (Hosting) | Kostenlos (Hobby Plan) |
| Anthropic Claude API | ca. CHF 5–15/Monat |
| Resend (E-Mail) | Kostenlos (100 E-Mails/Tag) |
| Microsoft Azure | Kostenlos (App Registration) |
| **Total** | **ca. CHF 5–15/Monat** |

---

## Hilfe & Fehlerbehebung

**"Anmeldung fehlgeschlagen"**
→ Überprüfe E-Mail und Passwort. Stelle sicher, dass du den User in Firebase Authentication erstellt hast (Schritt 1.4).

**"Keine Kontakte werden geladen"**
→ Prüfe ob die Firebase-Umgebungsvariablen in Vercel korrekt gesetzt sind. Nach Änderungen an Variablen musst du ein Redeploy machen.

**"KI-Empfehlungen erscheinen nicht"**
→ Prüfe ob der `ANTHROPIC_API_KEY` in Vercel gesetzt ist. Die KI braucht mindestens einen Kontakt um Empfehlungen zu geben.

**"E-Mail-Reminder kommen nicht"**
→ Prüfe ob `RESEND_API_KEY` und `CRON_SECRET` in Vercel gesetzt sind. Der Cron-Job läuft nur auf Vercel (nicht lokal).

**"Outlook-Verbindung funktioniert nicht"**
→ Stelle sicher, dass die Redirect-URI in Azure exakt mit deiner Vercel-URL übereinstimmt (inkl. `/api/outlook/callback`).
