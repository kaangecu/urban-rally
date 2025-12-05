/**
 * Privacy Policy
 * GDPR-compliant privacy policy for German users (DSGVO)
 */

export function PrivacyPolicy() {
  return (
    <div className="prose prose-sm max-w-none prose-invert">
      <h1 className="text-2xl font-bold mb-4 text-white">Datenschutzerklärung / Privacy Policy</h1>
      
      <p className="text-sm text-gray-400 mb-6">
        Letzte Aktualisierung / Last Updated: {new Date().toLocaleDateString('de-DE')}
        <br />
        Version: 1.0
      </p>

      <div className="p-4 bg-blue-900/20 border-l-4 border-blue-500 mb-6">
        <p className="font-semibold text-blue-100">DSGVO-Konformität / GDPR Compliance</p>
        <p className="text-sm mt-1 text-blue-200">
          Diese Datenschutzerklärung entspricht der EU-Datenschutz-Grundverordnung (DSGVO) 
          und dem Bundesdatenschutzgesetz (BDSG).
        </p>
        <p className="text-sm text-blue-200">
          This privacy policy complies with the EU General Data Protection Regulation (GDPR) 
          and German Federal Data Protection Act (BDSG).
        </p>
      </div>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3 text-white">1. Verantwortlicher / Data Controller</h2>
        <p className="text-gray-300">
          Verantwortlich für die Datenverarbeitung:
        </p>
        <p className="text-gray-300">
          Data controller responsible for processing:
        </p>
        <div className="mt-2 p-3 bg-gray-800/50 rounded border border-gray-700">
          <p className="font-mono text-sm text-gray-300">
            UrbanRally Platform<br />
            [Organization Name]<br />
            [Address]<br />
            Berlin, Germany<br />
            E-Mail: privacy@urbanrally.app
          </p>
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3 text-white">2. Welche Daten wir sammeln / What Data We Collect</h2>
        
        <h3 className="font-semibold mt-4 mb-2 text-white">2.1 Pflichtdaten / Required Data</h3>
        <ul className="list-disc pl-6 space-y-1 text-gray-300">
          <li><strong className="text-white">Name:</strong> Ihr angezeigter Name / Your display name</li>
          <li><strong className="text-white">Team-Code:</strong> Zur Identifikation Ihres Teams / For team identification</li>
          <li><strong className="text-white">Einwilligungsdaten:</strong> Zeitstempel Ihrer Zustimmung / Consent timestamps</li>
          <li><strong className="text-white">IP-Adresse:</strong> Zum Zeitpunkt der Einwilligung (DSGVO Art. 7) / At consent time (GDPR Art. 7)</li>
        </ul>

        <h3 className="font-semibold mt-4 mb-2 text-white">2.2 Optionale Daten / Optional Data</h3>
        <ul className="list-disc pl-6 space-y-1 text-gray-300">
          <li><strong className="text-white">E-Mail:</strong> Für Benachrichtigungen (nur wenn angegeben) / For notifications (only if provided)</li>
          <li><strong className="text-white">Profilbild:</strong> Für Personalisierung (optional) / For personalization (optional)</li>
        </ul>

        <h3 className="font-semibold mt-4 mb-2 text-white">2.3 Automatisch gesammelte Daten / Automatically Collected Data</h3>
        <ul className="list-disc pl-6 space-y-1 text-gray-300">
          <li><strong className="text-white">Standort:</strong> GPS-Koordinaten bei Aufgabenabgabe / GPS coordinates when submitting tasks</li>
          <li><strong className="text-white">Fotos/Videos:</strong> Hochgeladene Medien für Aufgaben / Uploaded media for tasks</li>
          <li><strong className="text-white">Nutzungsdaten:</strong> Abgeschlossene Aufgaben, Punktzahl / Completed tasks, score</li>
          <li><strong className="text-white">Technische Daten:</strong> Gerätetyp, Browser (Firebase Analytics) / Device type, browser (Firebase Analytics)</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3 text-white">3. Rechtsgrundlage / Legal Basis</h2>
        <p className="text-gray-300">
          Wir verarbeiten Ihre Daten auf Grundlage von:
        </p>
        <p className="text-gray-300">
          We process your data based on:
        </p>
        <ul className="list-disc pl-6 mt-2 space-y-2 text-gray-300">
          <li>
            <strong className="text-white">Einwilligung (Art. 6 Abs. 1 lit. a DSGVO):</strong> Sie haben uns Ihre 
            ausdrückliche Zustimmung gegeben / You have given us explicit consent
          </li>
          <li>
            <strong className="text-white">Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO):</strong> Zur Durchführung 
            der Schnitzeljagd / To execute the scavenger hunt
          </li>
          <li>
            <strong className="text-white">Berechtigtes Interesse (Art. 6 Abs. 1 lit. f DSGVO):</strong> Zur 
            Verbesserung unserer Dienste / To improve our services
          </li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3 text-white">4. Wie wir Ihre Daten verwenden / How We Use Your Data</h2>
        <ul className="list-disc pl-6 space-y-1 text-gray-300">
          <li><strong className="text-white">Spielfunktionalität:</strong> Aufgabenverwaltung, Punktevergabe / Task management, scoring</li>
          <li><strong className="text-white">Bestenliste:</strong> Anzeige Ihres Teams und Punktestands / Display your team and score</li>
          <li><strong className="text-white">Kommunikation:</strong> Event-Updates (wenn E-Mail angegeben) / Event updates (if email provided)</li>
          <li><strong className="text-white">Moderation:</strong> Überprüfung hochgeladener Inhalte / Review of uploaded content</li>
          <li><strong className="text-white">Analyse:</strong> Verbesserung der App-Erfahrung / Improve app experience</li>
          <li><strong className="text-white">Werbung:</strong> Promotion der Organisation (mit Ihrer Zustimmung) / Promotion of organization (with your consent)</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3 text-white">5. Datenweitergabe / Data Sharing</h2>
        <p className="font-semibold mb-2 text-gray-300">
          Wir geben Ihre Daten NICHT an Dritte weiter, außer:
        </p>
        <p className="font-semibold mb-2 text-gray-300">
          We do NOT share your data with third parties, except:
        </p>
        <ul className="list-disc pl-6 space-y-1 text-gray-300">
          <li>
            <strong className="text-white">Firebase (Google):</strong> Hosting und Datenbank (DSGVO-konform, 
            EU-Server verfügbar) / Hosting and database (GDPR-compliant, EU servers available)
          </li>
          <li>
            <strong className="text-white">Veranstalterorganisation:</strong> Das Team, das die Veranstaltung 
            durchführt / The team organizing the event
          </li>
          <li>
            <strong className="text-white">Gesetzliche Verpflichtung:</strong> Bei behördlichen Anfragen / When legally required
          </li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3 text-white">6. Datenspeicherung / Data Storage</h2>
        <p className="text-gray-300">
          <strong className="text-white">Speicherdauer / Retention Period:</strong>
        </p>
        <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-300">
          <li>Während der Veranstaltung: Alle Daten aktiv / During event: All data active</li>
          <li>Nach der Veranstaltung: 30 Tage für Auswertung / After event: 30 days for evaluation</li>
          <li>Danach: Anonymisierung oder Löschung / Then: Anonymization or deletion</li>
          <li>Einwilligungsnachweise: 3 Jahre (rechtliche Anforderung) / Consent records: 3 years (legal requirement)</li>
        </ul>

        <p className="mt-3 text-gray-300">
          <strong className="text-white">Speicherort / Storage Location:</strong>
        </p>
        <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-300">
          <li>Firebase Cloud Firestore (Europa-Server bevorzugt) / Firebase Cloud Firestore (Europe servers preferred)</li>
          <li>Firebase Storage (Europa-Server bevorzugt) / Firebase Storage (Europe servers preferred)</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3 text-white">7. Ihre Rechte / Your Rights</h2>
        <p className="text-gray-300">
          Gemäß DSGVO haben Sie folgende Rechte:
        </p>
        <p className="text-gray-300">
          Under GDPR, you have the following rights:
        </p>
        <ul className="list-disc pl-6 mt-2 space-y-2 text-gray-300">
          <li>
            <strong className="text-white">Auskunftsrecht (Art. 15):</strong> Erfahren, welche Daten wir über Sie 
            speichern / Know what data we store about you
          </li>
          <li>
            <strong className="text-white">Berichtigungsrecht (Art. 16):</strong> Korrektur falscher Daten / 
            Correct inaccurate data
          </li>
          <li>
            <strong className="text-white">Löschungsrecht (Art. 17):</strong> "Recht auf Vergessenwerden" / 
            "Right to be forgotten"
          </li>
          <li>
            <strong className="text-white">Einschränkung der Verarbeitung (Art. 18):</strong> Temporäre Sperrung / 
            Temporary restriction
          </li>
          <li>
            <strong className="text-white">Datenübertragbarkeit (Art. 20):</strong> Export Ihrer Daten / 
            Export your data
          </li>
          <li>
            <strong className="text-white">Widerspruchsrecht (Art. 21):</strong> Widerspruch gegen Verarbeitung / 
            Object to processing
          </li>
          <li>
            <strong className="text-white">Widerruf der Einwilligung (Art. 7 Abs. 3):</strong> Jederzeit widerrufbar / 
            Revocable at any time
          </li>
        </ul>

        <p className="mt-3 p-3 bg-yellow-900/20 border-l-4 border-yellow-500 text-gray-300">
          <strong className="text-yellow-100">So üben Sie Ihre Rechte aus / How to exercise your rights:</strong><br />
          E-Mail an / Email to: <span className="font-mono text-yellow-200">privacy@urbanrally.app</span>
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3 text-white">8. Datensicherheit / Data Security</h2>
        <p className="text-gray-300">
          Wir schützen Ihre Daten durch:
        </p>
        <p className="text-gray-300">
          We protect your data through:
        </p>
        <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-300">
          <li>HTTPS-Verschlüsselung bei Datenübertragung / HTTPS encryption for data transfer</li>
          <li>Firebase Security Rules für Zugangskontrolle / Firebase Security Rules for access control</li>
          <li>Anonyme Authentifizierung (keine Passwörter gespeichert) / Anonymous authentication (no passwords stored)</li>
          <li>Regelmäßige Sicherheitsupdates / Regular security updates</li>
          <li>Minimale Datensammlung (Datensparsamkeit) / Minimal data collection (data minimization)</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3 text-white">9. Cookies und Tracking</h2>
        <p className="text-gray-300">
          Wir verwenden:
        </p>
        <p className="text-gray-300">
          We use:
        </p>
        <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-300">
          <li><strong className="text-white">Notwendige Cookies:</strong> Für Login und Spielfortschritt / For login and game progress</li>
          <li><strong className="text-white">Firebase Analytics:</strong> Anonymisierte Nutzungsstatistiken / Anonymized usage statistics</li>
          <li><strong className="text-white">KEINE Werbe-Cookies:</strong> Wir verkaufen keine Daten / NO advertising cookies: We don't sell data</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3 text-white">10. Minderjährige / Minors</h2>
        <p className="text-gray-300">
          Nutzer müssen mindestens 13 Jahre alt sein. Für Nutzer unter 16 Jahren ist in 
          Deutschland die Zustimmung der Eltern erforderlich (DSGVO Art. 8).
        </p>
        <p className="text-gray-300">
          Users must be at least 13 years old. In Germany, parental consent is required 
          for users under 16 (GDPR Art. 8).
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3 text-white">11. Beschwerderecht / Right to Complain</h2>
        <p className="text-gray-300">
          Sie haben das Recht, sich bei einer Datenschutzbehörde zu beschweren:
        </p>
        <p className="text-gray-300">
          You have the right to lodge a complaint with a data protection authority:
        </p>
        <div className="mt-2 p-3 bg-gray-800/50 rounded border border-gray-700">
          <p className="font-semibold text-white">Berliner Beauftragte für Datenschutz und Informationsfreiheit</p>
          <p className="text-sm text-gray-300">
            Friedrichstraße 219<br />
            10969 Berlin, Germany<br />
            Website: <a href="https://www.datenschutz-berlin.de" className="text-blue-400 hover:text-blue-300">www.datenschutz-berlin.de</a>
          </p>
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3 text-white">12. Änderungen / Changes</h2>
        <p className="text-gray-300">
          Wir können diese Datenschutzerklärung aktualisieren. Bei wesentlichen Änderungen 
          werden Sie benachrichtigt und müssen erneut zustimmen.
        </p>
        <p className="text-gray-300">
          We may update this privacy policy. For significant changes, you will be notified 
          and must consent again.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3 text-white">13. Kontakt / Contact</h2>
        <p className="text-gray-300">
          Datenschutzfragen / Privacy questions:
        </p>
        <p className="mt-2 font-mono text-sm text-blue-300">
          E-Mail: privacy@urbanrally.app<br />
          Telefon: [Phone Number]
        </p>
      </section>

      <div className="mt-8 p-4 bg-green-900/20 border-l-4 border-green-500">
        <p className="text-sm font-semibold text-green-100">
          ✓ DSGVO-konform / GDPR-compliant
        </p>
        <p className="text-sm text-green-200 mt-2">
          Diese Datenschutzerklärung erfüllt alle Anforderungen der EU-Datenschutz-Grundverordnung 
          und des deutschen Bundesdatenschutzgesetzes.
        </p>
        <p className="text-sm text-green-200">
          This privacy policy meets all requirements of the EU General Data Protection Regulation 
          and German Federal Data Protection Act.
        </p>
      </div>
    </div>
  );
}
