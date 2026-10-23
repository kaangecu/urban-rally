/**
 * Privacy Policy
 * GDPR-compliant privacy policy for German users (DSGVO), in English or German
 */

import type { LegalLang } from './language';
import { LegalSections, type LegalSection } from './LegalSections';

interface PolicyText {
  title: string;
  updated: string;
  compliance: [string, string];
  sections: LegalSection[];
  compliant: [string, string];
}

const AUTHORITY = {
  lines: ['Berliner Beauftragte für Datenschutz und Informationsfreiheit', 'Friedrichstraße 219', '10969 Berlin, Germany'],
  link: { href: 'https://www.datenschutz-berlin.de', label: 'www.datenschutz-berlin.de' },
};

const TEXT: Record<LegalLang, PolicyText> = {
  en: {
    title: 'Privacy Policy',
    updated: 'Last updated',
    compliance: ['GDPR Compliance', 'This privacy policy complies with the EU General Data Protection Regulation (GDPR) and German Federal Data Protection Act (BDSG).'],
    sections: [
      {
        title: '1. Data Controller',
        paragraphs: ['Data controller responsible for processing:'],
        box: { lines: ['UrbanRally Platform', '[Organization Name]', '[Address]', 'Berlin, Germany', 'Email: privacy@urbanrally.app'] },
      },
      {
        title: '2. What Data We Collect',
        subsections: [
          {
            title: '2.1 Required Data',
            items: [
              { term: 'Name', text: 'Your display name' },
              { term: 'Team code', text: 'For team identification' },
              { term: 'Consent data', text: 'Consent timestamps' },
              { term: 'IP address', text: 'At consent time (GDPR Art. 7)' },
            ],
          },
          {
            title: '2.2 Optional Data',
            items: [
              { term: 'Email', text: 'For notifications (only if provided)' },
              { term: 'Profile picture', text: 'For personalization (optional)' },
            ],
          },
          {
            title: '2.3 Automatically Collected Data',
            items: [
              { term: 'Location', text: 'GPS coordinates when submitting tasks' },
              { term: 'Photos/videos', text: 'Uploaded media for tasks' },
              { term: 'Usage data', text: 'Completed tasks, score' },
              { term: 'Technical data', text: 'Device type, browser (Firebase Analytics)' },
            ],
          },
        ],
      },
      {
        title: '3. Legal Basis',
        paragraphs: ['We process your data based on:'],
        items: [
          { term: 'Consent (Art. 6(1)(a) GDPR)', text: 'You have given us explicit consent' },
          { term: 'Performance of a contract (Art. 6(1)(b) GDPR)', text: 'To execute the scavenger hunt' },
          { term: 'Legitimate interest (Art. 6(1)(f) GDPR)', text: 'To improve our services' },
        ],
      },
      {
        title: '4. How We Use Your Data',
        items: [
          { term: 'Game functionality', text: 'Task management, scoring' },
          { term: 'Leaderboard', text: 'Display your team and score' },
          { term: 'Communication', text: 'Event updates (if email provided)' },
          { term: 'Moderation', text: 'Review of uploaded content' },
          { term: 'Analytics', text: 'Improve app experience' },
          { term: 'Promotion', text: 'Promotion of the organization (with your consent)' },
        ],
      },
      {
        title: '5. Data Sharing',
        intro: 'We do NOT share your data with third parties, except:',
        items: [
          { term: 'Firebase (Google)', text: 'Hosting and database (GDPR-compliant, EU servers available)' },
          { term: 'Organizing entity', text: 'The team organizing the event' },
          { term: 'Legal obligation', text: 'When legally required' },
        ],
      },
      {
        title: '6. Data Storage',
        subsections: [
          {
            title: 'Retention Period',
            items: [
              'During event: All data active',
              'After event: 30 days for evaluation',
              'Then: Anonymization or deletion',
              'Consent records: 3 years (legal requirement)',
            ],
          },
          {
            title: 'Storage Location',
            items: ['Firebase Cloud Firestore (Europe servers preferred)', 'Firebase Storage (Europe servers preferred)'],
          },
        ],
      },
      {
        title: '7. Your Rights',
        paragraphs: ['Under GDPR, you have the following rights:'],
        items: [
          { term: 'Right of access (Art. 15)', text: 'Know what data we store about you' },
          { term: 'Right to rectification (Art. 16)', text: 'Correct inaccurate data' },
          { term: 'Right to erasure (Art. 17)', text: '"Right to be forgotten"' },
          { term: 'Restriction of processing (Art. 18)', text: 'Temporary restriction' },
          { term: 'Data portability (Art. 20)', text: 'Export your data' },
          { term: 'Right to object (Art. 21)', text: 'Object to processing' },
          { term: 'Withdrawal of consent (Art. 7(3))', text: 'Revocable at any time' },
        ],
        note: { term: 'How to exercise your rights', text: 'Email privacy@urbanrally.app' },
      },
      {
        title: '8. Data Security',
        paragraphs: ['We protect your data through:'],
        items: [
          'HTTPS encryption for data transfer',
          'Firebase Security Rules for access control',
          'Anonymous authentication (no passwords stored)',
          'Regular security updates',
          'Minimal data collection (data minimization)',
        ],
      },
      {
        title: '9. Cookies and Tracking',
        paragraphs: ['We use:'],
        items: [
          { term: 'Necessary cookies', text: 'For login and game progress' },
          { term: 'Firebase Analytics', text: 'Anonymized usage statistics' },
          { term: 'NO advertising cookies', text: "We don't sell data" },
        ],
      },
      {
        title: '10. Minors',
        paragraphs: ['Users must be at least 13 years old. In Germany, parental consent is required for users under 16 (GDPR Art. 8).'],
      },
      {
        title: '11. Right to Complain',
        paragraphs: ['You have the right to lodge a complaint with a data protection authority:'],
        box: AUTHORITY,
      },
      {
        title: '12. Changes',
        paragraphs: ['We may update this privacy policy. For significant changes, you will be notified and must consent again.'],
      },
      {
        title: '13. Contact',
        paragraphs: ['Privacy questions:'],
        contact: ['Email: privacy@urbanrally.app', 'Phone: [Phone Number]'],
      },
    ],
    compliant: ['GDPR-compliant', 'This privacy policy meets all requirements of the EU General Data Protection Regulation and German Federal Data Protection Act.'],
  },
  de: {
    title: 'Datenschutzerklärung',
    updated: 'Letzte Aktualisierung',
    compliance: ['DSGVO-Konformität', 'Diese Datenschutzerklärung entspricht der EU-Datenschutz-Grundverordnung (DSGVO) und dem Bundesdatenschutzgesetz (BDSG).'],
    sections: [
      {
        title: '1. Verantwortlicher',
        paragraphs: ['Verantwortlich für die Datenverarbeitung:'],
        box: { lines: ['UrbanRally Platform', '[Organization Name]', '[Address]', 'Berlin, Germany', 'E-Mail: privacy@urbanrally.app'] },
      },
      {
        title: '2. Welche Daten wir sammeln',
        subsections: [
          {
            title: '2.1 Pflichtdaten',
            items: [
              { term: 'Name', text: 'Ihr angezeigter Name' },
              { term: 'Team-Code', text: 'Zur Identifikation Ihres Teams' },
              { term: 'Einwilligungsdaten', text: 'Zeitstempel Ihrer Zustimmung' },
              { term: 'IP-Adresse', text: 'Zum Zeitpunkt der Einwilligung (DSGVO Art. 7)' },
            ],
          },
          {
            title: '2.2 Optionale Daten',
            items: [
              { term: 'E-Mail', text: 'Für Benachrichtigungen (nur wenn angegeben)' },
              { term: 'Profilbild', text: 'Für Personalisierung (optional)' },
            ],
          },
          {
            title: '2.3 Automatisch gesammelte Daten',
            items: [
              { term: 'Standort', text: 'GPS-Koordinaten bei Aufgabenabgabe' },
              { term: 'Fotos/Videos', text: 'Hochgeladene Medien für Aufgaben' },
              { term: 'Nutzungsdaten', text: 'Abgeschlossene Aufgaben, Punktzahl' },
              { term: 'Technische Daten', text: 'Gerätetyp, Browser (Firebase Analytics)' },
            ],
          },
        ],
      },
      {
        title: '3. Rechtsgrundlage',
        paragraphs: ['Wir verarbeiten Ihre Daten auf Grundlage von:'],
        items: [
          { term: 'Einwilligung (Art. 6 Abs. 1 lit. a DSGVO)', text: 'Sie haben uns Ihre ausdrückliche Zustimmung gegeben' },
          { term: 'Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO)', text: 'Zur Durchführung der Schnitzeljagd' },
          { term: 'Berechtigtes Interesse (Art. 6 Abs. 1 lit. f DSGVO)', text: 'Zur Verbesserung unserer Dienste' },
        ],
      },
      {
        title: '4. Wie wir Ihre Daten verwenden',
        items: [
          { term: 'Spielfunktionalität', text: 'Aufgabenverwaltung, Punktevergabe' },
          { term: 'Bestenliste', text: 'Anzeige Ihres Teams und Punktestands' },
          { term: 'Kommunikation', text: 'Event-Updates (wenn E-Mail angegeben)' },
          { term: 'Moderation', text: 'Überprüfung hochgeladener Inhalte' },
          { term: 'Analyse', text: 'Verbesserung der App-Erfahrung' },
          { term: 'Werbung', text: 'Promotion der Organisation (mit Ihrer Zustimmung)' },
        ],
      },
      {
        title: '5. Datenweitergabe',
        intro: 'Wir geben Ihre Daten NICHT an Dritte weiter, außer:',
        items: [
          { term: 'Firebase (Google)', text: 'Hosting und Datenbank (DSGVO-konform, EU-Server verfügbar)' },
          { term: 'Veranstalterorganisation', text: 'Das Team, das die Veranstaltung durchführt' },
          { term: 'Gesetzliche Verpflichtung', text: 'Bei behördlichen Anfragen' },
        ],
      },
      {
        title: '6. Datenspeicherung',
        subsections: [
          {
            title: 'Speicherdauer',
            items: [
              'Während der Veranstaltung: Alle Daten aktiv',
              'Nach der Veranstaltung: 30 Tage für Auswertung',
              'Danach: Anonymisierung oder Löschung',
              'Einwilligungsnachweise: 3 Jahre (rechtliche Anforderung)',
            ],
          },
          {
            title: 'Speicherort',
            items: ['Firebase Cloud Firestore (Europa-Server bevorzugt)', 'Firebase Storage (Europa-Server bevorzugt)'],
          },
        ],
      },
      {
        title: '7. Ihre Rechte',
        paragraphs: ['Gemäß DSGVO haben Sie folgende Rechte:'],
        items: [
          { term: 'Auskunftsrecht (Art. 15)', text: 'Erfahren, welche Daten wir über Sie speichern' },
          { term: 'Berichtigungsrecht (Art. 16)', text: 'Korrektur falscher Daten' },
          { term: 'Löschungsrecht (Art. 17)', text: '"Recht auf Vergessenwerden"' },
          { term: 'Einschränkung der Verarbeitung (Art. 18)', text: 'Temporäre Sperrung' },
          { term: 'Datenübertragbarkeit (Art. 20)', text: 'Export Ihrer Daten' },
          { term: 'Widerspruchsrecht (Art. 21)', text: 'Widerspruch gegen Verarbeitung' },
          { term: 'Widerruf der Einwilligung (Art. 7 Abs. 3)', text: 'Jederzeit widerrufbar' },
        ],
        note: { term: 'So üben Sie Ihre Rechte aus', text: 'E-Mail an privacy@urbanrally.app' },
      },
      {
        title: '8. Datensicherheit',
        paragraphs: ['Wir schützen Ihre Daten durch:'],
        items: [
          'HTTPS-Verschlüsselung bei Datenübertragung',
          'Firebase Security Rules für Zugangskontrolle',
          'Anonyme Authentifizierung (keine Passwörter gespeichert)',
          'Regelmäßige Sicherheitsupdates',
          'Minimale Datensammlung (Datensparsamkeit)',
        ],
      },
      {
        title: '9. Cookies und Tracking',
        paragraphs: ['Wir verwenden:'],
        items: [
          { term: 'Notwendige Cookies', text: 'Für Login und Spielfortschritt' },
          { term: 'Firebase Analytics', text: 'Anonymisierte Nutzungsstatistiken' },
          { term: 'KEINE Werbe-Cookies', text: 'Wir verkaufen keine Daten' },
        ],
      },
      {
        title: '10. Minderjährige',
        paragraphs: ['Nutzer müssen mindestens 13 Jahre alt sein. Für Nutzer unter 16 Jahren ist in Deutschland die Zustimmung der Eltern erforderlich (DSGVO Art. 8).'],
      },
      {
        title: '11. Beschwerderecht',
        paragraphs: ['Sie haben das Recht, sich bei einer Datenschutzbehörde zu beschweren:'],
        box: AUTHORITY,
      },
      {
        title: '12. Änderungen',
        paragraphs: ['Wir können diese Datenschutzerklärung aktualisieren. Bei wesentlichen Änderungen werden Sie benachrichtigt und müssen erneut zustimmen.'],
      },
      {
        title: '13. Kontakt',
        paragraphs: ['Datenschutzfragen:'],
        contact: ['E-Mail: privacy@urbanrally.app', 'Telefon: [Phone Number]'],
      },
    ],
    compliant: ['DSGVO-konform', 'Diese Datenschutzerklärung erfüllt alle Anforderungen der EU-Datenschutz-Grundverordnung und des deutschen Bundesdatenschutzgesetzes.'],
  },
};

export function PrivacyPolicy({ lang }: { lang: LegalLang }) {
  const t = TEXT[lang];
  return (
    <div className="max-w-none text-gray-700 dark:text-gray-300">
      <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{t.title}</h1>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        {t.updated}: {new Date().toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-GB')}
        <br />
        Version: 1.0
      </p>

      <div className="p-4 bg-gray-100 dark:bg-gray-800 border-l-4 border-blue-500 mb-6">
        <p className="font-semibold text-gray-900 dark:text-white">{t.compliance[0]}</p>
        <p className="text-sm mt-1">{t.compliance[1]}</p>
      </div>

      <LegalSections sections={t.sections} />

      <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 border-l-4 border-green-500">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">{t.compliant[0]}</p>
        <p className="text-sm mt-2">{t.compliant[1]}</p>
      </div>
    </div>
  );
}
