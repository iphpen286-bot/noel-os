import type { MailInput } from './classify'

/** Beispiel-Mails für den Mock-Modus (kein IMAP-Konto konfiguriert). */
export const MOCK_MAILS: (MailInput & { uid: number; date: number })[] = [
  { uid: 1001, date: Date.now() - 1000 * 60 * 40, from_name: 'Hochschule München', from_addr: 'studium@hm.edu', subject: 'Zusage Immatrikulation — Rückmeldung bis Freitag', snippet: 'Wir freuen uns, Ihnen einen Studienplatz anzubieten. Bitte bestätigen Sie bis Freitag.' },
  { uid: 1002, date: Date.now() - 1000 * 60 * 120, from_name: 'Dr. Weber Praxis', from_addr: 'termine@praxis-weber.de', subject: 'Terminbestätigung Montag 14:30', snippet: 'Ihr Termin am Montag um 14:30 Uhr ist bestätigt. Bitte bringen Sie Ihre Versichertenkarte mit.' },
  { uid: 1003, date: Date.now() - 1000 * 60 * 200, from_name: 'Sparkasse', from_addr: 'service@sparkasse.de', subject: 'Rechnung / Kontoauszug November', snippet: 'Ihr Kontoauszug für November steht bereit.' },
  { uid: 1004, date: Date.now() - 1000 * 60 * 300, from_name: 'GymShark', from_addr: 'news@gymshark.com', subject: '-40% Black Friday Sale — nur heute!', snippet: 'Sichere dir jetzt 40% Rabatt auf alles. Newsletter abmelden.' },
  { uid: 1005, date: Date.now() - 1000 * 60 * 600, from_name: 'YouTube', from_addr: 'no-reply@youtube.com', subject: 'Neue Videos von deinen Abos', snippet: 'Schau dir die neuesten Uploads an.' },
  { uid: 1006, date: Date.now() - 1000 * 60 * 60 * 20, from_name: 'Marko', from_addr: 'marko@gmail.com', subject: 'Zocken am Wochenende?', snippet: 'Yo, Bock am Samstag zu zocken? Meld dich.' },
]
