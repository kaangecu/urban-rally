/**
 * Terms of Service
 * GDPR-compliant terms for German users, in English or German
 */

import type { LegalLang } from './language';
import { LegalSections, type LegalSection } from './LegalSections';

const TEXT: Record<LegalLang, { title: string; updated: string; sections: LegalSection[]; important: [string, string] }> = {
  en: {
    title: 'Terms of Service',
    updated: 'Last updated',
    sections: [
      {
        title: '1. Scope',
        paragraphs: ['These Terms of Service govern your use of the UrbanRally platform ("the App"), a scavenger hunt application for international student groups.'],
      },
      {
        title: '2. User Account',
        paragraphs: ['By entering a team code and your personal information, you create a temporary user account for the duration of the event.'],
        items: [
          'You must be at least 13 years old',
          "You are responsible for your team code's confidentiality",
          'You may only create one account per person',
        ],
      },
      {
        title: '3. Permitted Use',
        intro: 'You agree to:',
        items: [
          'Use the app for lawful purposes only',
          'Not upload offensive, abusive, or inappropriate content',
          "Respect other participants' privacy",
          'Not photograph or film people without their consent',
          'Follow traffic rules and public safety guidelines',
        ],
      },
      {
        title: '4. Prohibited Activities',
        intro: 'The following is prohibited:',
        items: [
          'Cheating, manipulation, or exploiting vulnerabilities',
          'Uploading copyrighted material',
          'Harassment or bullying of other users',
          'Using automated tools or bots',
          'Reverse engineering the app',
        ],
      },
      {
        title: '5. Content and Intellectual Property',
        paragraphs: ['By uploading photos or videos, you grant the organizing entity a non-exclusive license to use this content for promotional purposes.'],
        items: [
          'You retain all rights to your content',
          'You confirm you are the content creator',
          'You grant a worldwide, royalty-free license',
        ],
      },
      {
        title: '6. Limitation of Liability',
        paragraphs: ['The app is provided "as is". We make no warranty of uninterrupted or error-free availability.'],
        items: [
          'We are not liable for losses or damages',
          'You use the app at your own risk',
          'We are not liable for third-party content',
        ],
      },
      {
        title: '7. Termination',
        paragraphs: ['We reserve the right to suspend or delete accounts without notice if these terms are violated.'],
      },
      {
        title: '8. Changes',
        paragraphs: ['We may modify these terms at any time. Significant changes will be communicated via email (if provided).'],
      },
      {
        title: '9. Governing Law',
        paragraphs: ['These terms are governed by German law. Jurisdiction is Berlin, Germany.'],
      },
      {
        title: '10. Contact',
        paragraphs: ['For questions about these terms, please contact:'],
        contact: ['legal@urbanrally.app'],
      },
    ],
    important: ['Important:', 'By accepting these terms, you confirm that you have read, understood, and agreed to them.'],
  },
  de: {
    title: 'Nutzungsbedingungen',
    updated: 'Letzte Aktualisierung',
    sections: [
      {
        title: '1. Anwendungsbereich',
        paragraphs: ['Diese Nutzungsbedingungen regeln die Nutzung der UrbanRally-Plattform ("die App"), einer Schnitzeljagd-Anwendung für internationale Studierendengruppen.'],
      },
      {
        title: '2. Nutzerkonto',
        paragraphs: ['Durch die Eingabe eines Team-Codes und Ihrer persönlichen Daten erstellen Sie ein temporäres Nutzerkonto für die Dauer der Veranstaltung.'],
        items: [
          'Sie müssen mindestens 13 Jahre alt sein',
          'Sie sind für die Vertraulichkeit Ihres Team-Codes verantwortlich',
          'Sie dürfen nur ein Konto pro Person erstellen',
        ],
      },
      {
        title: '3. Erlaubte Nutzung',
        intro: 'Sie verpflichten sich:',
        items: [
          'Die App nur für legale Zwecke zu nutzen',
          'Keine anstößigen, beleidigenden oder unangemessenen Inhalte hochzuladen',
          'Die Privatsphäre anderer Teilnehmer zu respektieren',
          'Keine Personen ohne deren Einwilligung zu fotografieren oder zu filmen',
          'Verkehrsregeln und öffentliche Sicherheit zu beachten',
        ],
      },
      {
        title: '4. Verbotene Aktivitäten',
        intro: 'Folgendes ist untersagt:',
        items: [
          'Betrügen, Manipulation oder Ausnutzung von Schwachstellen',
          'Hochladen von urheberrechtlich geschütztem Material',
          'Belästigung oder Mobbing anderer Nutzer',
          'Automatisierte Tools oder Bots verwenden',
          'Reverse Engineering der App',
        ],
      },
      {
        title: '5. Inhalte und geistige Eigentumsrechte',
        paragraphs: ['Durch das Hochladen von Fotos oder Videos gewähren Sie der Veranstalterorganisation eine nicht-exklusive Lizenz zur Nutzung dieser Inhalte für Werbezwecke.'],
        items: [
          'Sie behalten alle Rechte an Ihren Inhalten',
          'Sie bestätigen, dass Sie der Urheber sind',
          'Sie erteilen eine weltweite, gebührenfreie Lizenz',
        ],
      },
      {
        title: '6. Haftungsausschluss',
        paragraphs: ['Die App wird "wie besehen" bereitgestellt. Wir übernehmen keine Garantie für ununterbrochene oder fehlerfreie Verfügbarkeit.'],
        items: [
          'Wir haften nicht für Verluste oder Schäden',
          'Sie nutzen die App auf eigenes Risiko',
          'Wir haften nicht für Inhalte Dritter',
        ],
      },
      {
        title: '7. Kündigung',
        paragraphs: ['Wir behalten uns das Recht vor, Konten ohne Vorankündigung zu sperren oder zu löschen, wenn gegen diese Bedingungen verstoßen wird.'],
      },
      {
        title: '8. Änderungen',
        paragraphs: ['Wir können diese Bedingungen jederzeit ändern. Wesentliche Änderungen werden Ihnen per E-Mail mitgeteilt (falls angegeben).'],
      },
      {
        title: '9. Anwendbares Recht',
        paragraphs: ['Diese Bedingungen unterliegen deutschem Recht. Gerichtsstand ist Berlin, Deutschland.'],
      },
      {
        title: '10. Kontakt',
        paragraphs: ['Bei Fragen zu diesen Bedingungen wenden Sie sich bitte an:'],
        contact: ['legal@urbanrally.app'],
      },
    ],
    important: ['Wichtig:', 'Durch das Akzeptieren dieser Bedingungen bestätigen Sie, dass Sie diese gelesen, verstanden und akzeptiert haben.'],
  },
};

export function TermsOfService({ lang }: { lang: LegalLang }) {
  const t = TEXT[lang];
  return (
    <div className="max-w-none text-gray-700 dark:text-gray-300">
      <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{t.title}</h1>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        {t.updated}: {new Date().toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-GB')}
      </p>

      <LegalSections sections={t.sections} />

      <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <p className="text-sm">
          <strong className="text-gray-900 dark:text-white">{t.important[0]}</strong> {t.important[1]}
        </p>
      </div>
    </div>
  );
}
