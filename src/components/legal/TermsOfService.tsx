/**
 * Terms of Service
 * GDPR-compliant terms for German users
 */

export function TermsOfService() {
  return (
    <div className="prose prose-sm max-w-none prose-invert">
      <h1 className="text-2xl font-bold mb-4 text-white">Nutzungsbedingungen / Terms of Service</h1>
      
      <p className="text-sm text-gray-400 mb-6">
        Letzte Aktualisierung / Last Updated: {new Date().toLocaleDateString('de-DE')}
      </p>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3 text-white">1. Anwendungsbereich / Scope</h2>
        <p className="text-gray-300">
          Diese Nutzungsbedingungen regeln die Nutzung der UrbanRally-Plattform ("die App"), 
          einer Schnitzeljagd-Anwendung für internationale Studierendengruppen.
        </p>
        <p className="text-gray-300">
          These Terms of Service govern your use of the UrbanRally platform ("the App"), 
          a scavenger hunt application for international student groups.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3 text-white">2. Nutzerkonto / User Account</h2>
        <p className="text-gray-300">
          Durch die Eingabe eines Team-Codes und Ihrer persönlichen Daten erstellen Sie ein 
          temporäres Nutzerkonto für die Dauer der Veranstaltung.
        </p>
        <p className="text-gray-300">
          By entering a team code and your personal information, you create a temporary 
          user account for the duration of the event.
        </p>
        <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-300">
          <li>Sie müssen mindestens 13 Jahre alt sein / You must be at least 13 years old</li>
          <li>Sie sind für die Vertraulichkeit Ihres Team-Codes verantwortlich / You are responsible for your team code's confidentiality</li>
          <li>Sie dürfen nur ein Konto pro Person erstellen / You may only create one account per person</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3 text-white">3. Erlaubte Nutzung / Permitted Use</h2>
        <p className="font-medium mb-2 text-gray-300">Sie verpflichten sich: / You agree to:</p>
        <ul className="list-disc pl-6 space-y-1 text-gray-300">
          <li>Die App nur für legale Zwecke zu nutzen / Use the app for lawful purposes only</li>
          <li>Keine anstößigen, beleidigenden oder unangemessenen Inhalte hochzuladen / Not upload offensive, abusive, or inappropriate content</li>
          <li>Die Privatsphäre anderer Teilnehmer zu respektieren / Respect other participants' privacy</li>
          <li>Keine Personen ohne deren Einwilligung zu fotografieren oder zu filmen / Not photograph or film people without their consent</li>
          <li>Verkehrsregeln und öffentliche Sicherheit zu beachten / Follow traffic rules and public safety guidelines</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3 text-white">4. Verbotene Aktivitäten / Prohibited Activities</h2>
        <p className="font-medium mb-2 text-gray-300">Folgendes ist untersagt: / The following is prohibited:</p>
        <ul className="list-disc pl-6 space-y-1 text-gray-300">
          <li>Betrügen, Manipulation oder Ausnutzung von Schwachstellen / Cheating, manipulation, or exploiting vulnerabilities</li>
          <li>Hochladen von urheberrechtlich geschütztem Material / Uploading copyrighted material</li>
          <li>Belästigung oder Mobbing anderer Nutzer / Harassment or bullying of other users</li>
          <li>Automatisierte Tools oder Bots verwenden / Using automated tools or bots</li>
          <li>Reverse Engineering der App / Reverse engineering the app</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3 text-white">5. Inhalte und geistige Eigentumsrechte / Content and Intellectual Property</h2>
        <p className="text-gray-300">
          Durch das Hochladen von Fotos oder Videos gewähren Sie der Veranstalterorganisation 
          eine nicht-exklusive Lizenz zur Nutzung dieser Inhalte für Werbezwecke.
        </p>
        <p className="text-gray-300">
          By uploading photos or videos, you grant the organizing entity a non-exclusive 
          license to use this content for promotional purposes.
        </p>
        <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-300">
          <li>Sie behalten alle Rechte an Ihren Inhalten / You retain all rights to your content</li>
          <li>Sie bestätigen, dass Sie der Urheber sind / You confirm you are the content creator</li>
          <li>Sie erteilen eine weltweite, gebührenfreie Lizenz / You grant a worldwide, royalty-free license</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3 text-white">6. Haftungsausschluss / Limitation of Liability</h2>
        <p className="text-gray-300">
          Die App wird "wie besehen" bereitgestellt. Wir übernehmen keine Garantie für 
          ununterbrochene oder fehlerfreie Verfügbarkeit.
        </p>
        <p className="text-gray-300">
          The app is provided "as is". We make no warranty of uninterrupted or error-free availability.
        </p>
        <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-300">
          <li>Wir haften nicht für Verluste oder Schäden / We are not liable for losses or damages</li>
          <li>Sie nutzen die App auf eigenes Risiko / You use the app at your own risk</li>
          <li>Wir haften nicht für Inhalte Dritter / We are not liable for third-party content</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3 text-white">7. Kündigung / Termination</h2>
        <p className="text-gray-300">
          Wir behalten uns das Recht vor, Konten ohne Vorankündigung zu sperren oder zu 
          löschen, wenn gegen diese Bedingungen verstoßen wird.
        </p>
        <p className="text-gray-300">
          We reserve the right to suspend or delete accounts without notice if these 
          terms are violated.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3 text-white">8. Änderungen / Changes</h2>
        <p className="text-gray-300">
          Wir können diese Bedingungen jederzeit ändern. Wesentliche Änderungen werden 
          Ihnen per E-Mail mitgeteilt (falls angegeben).
        </p>
        <p className="text-gray-300">
          We may modify these terms at any time. Significant changes will be communicated 
          via email (if provided).
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3 text-white">9. Anwendbares Recht / Governing Law</h2>
        <p className="text-gray-300">
          Diese Bedingungen unterliegen deutschem Recht. Gerichtsstand ist Berlin, Deutschland.
        </p>
        <p className="text-gray-300">
          These terms are governed by German law. Jurisdiction is Berlin, Germany.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3 text-white">10. Kontakt / Contact</h2>
        <p className="text-gray-300">
          Bei Fragen zu diesen Bedingungen wenden Sie sich bitte an:
        </p>
        <p className="text-gray-300">
          For questions about these terms, please contact:
        </p>
        <p className="mt-2 font-mono text-sm text-blue-300">
          legal@urbanrally.app
        </p>
      </section>

      <div className="mt-8 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
        <p className="text-sm text-gray-300">
          <strong className="text-white">Wichtig:</strong> Durch das Akzeptieren dieser Bedingungen bestätigen Sie, 
          dass Sie diese gelesen, verstanden und akzeptiert haben.
        </p>
        <p className="text-sm text-gray-300 mt-2">
          <strong className="text-white">Important:</strong> By accepting these terms, you confirm that you have 
          read, understood, and agreed to them.
        </p>
      </div>
    </div>
  );
}
