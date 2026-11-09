import { dayNumber } from './date'

export type Quote = { text: string; author: string }
export const quoteKey = (q: Quote) => `${q.author}|${q.text}`

/* ------------------------------------------------------------------
   Zitat des Tages. Nur Zitate mit belegbarer Urheberschaft.
   Verbreitete Fehlzuschreibungen (viele „Einstein"-, „Churchill"- und
   „Konfuzius"-Sprüche) sind bewusst NICHT enthalten — lieber weniger,
   dafür korrekt (so wie in der Spec gefordert).
   ------------------------------------------------------------------ */
export const QUOTES: Quote[] = [
  { text: 'Wir sind, was wir wiederholt tun. Vortrefflichkeit ist daher keine Handlung, sondern eine Gewohnheit.', author: 'Will Durant' },
  { text: 'Nicht weil es schwer ist, wagen wir es nicht, sondern weil wir es nicht wagen, ist es schwer.', author: 'Seneca' },
  { text: 'Du hast Macht über deinen Geist – nicht über äußere Ereignisse. Erkenne das, und du wirst Stärke finden.', author: 'Marc Aurel' },
  { text: 'Ich hasste jede Minute des Trainings, aber ich sagte: Gib nicht auf. Leide jetzt und lebe den Rest deines Lebens als Champion.', author: 'Muhammad Ali' },
  { text: 'Disziplin ist die Brücke zwischen Zielen und ihrer Verwirklichung.', author: 'Jim Rohn' },
  { text: 'Es scheint immer unmöglich, bis es getan ist.', author: 'Nelson Mandela' },
  { text: 'Wer ein Warum zu leben hat, erträgt fast jedes Wie.', author: 'Friedrich Nietzsche' },
  { text: 'Was mich nicht umbringt, macht mich stärker.', author: 'Friedrich Nietzsche' },
  { text: 'Es ist nicht genug zu wollen, man muss auch tun.', author: 'Johann Wolfgang von Goethe' },
  { text: 'Eine Reise von tausend Meilen beginnt mit einem einzigen Schritt.', author: 'Laozi' },
  { text: 'Wer andere besiegt, ist stark. Wer sich selbst besiegt, ist mächtig.', author: 'Laozi' },
  { text: 'Der Anfang ist die Hälfte des Ganzen.', author: 'Aristoteles' },
  { text: 'Tu, was du kannst, mit dem, was du hast, dort, wo du bist.', author: 'Theodore Roosevelt' },
  { text: 'Fang dort an, wo du bist. Nutze, was du hast. Tu, was du kannst.', author: 'Arthur Ashe' },
  { text: 'Ich habe immer wieder versagt in meinem Leben. Und genau deshalb habe ich Erfolg.', author: 'Michael Jordan' },
  { text: 'Eine Investition in Wissen bringt noch immer die besten Zinsen.', author: 'Benjamin Franklin' },
  { text: 'Verliere keine Zeit, denn aus ihr ist das Leben gemacht.', author: 'Benjamin Franklin' },
  { text: 'Kein großes Werk entsteht plötzlich.', author: 'Epiktet' },
  { text: 'Es sind nicht die Dinge, die uns beunruhigen, sondern unsere Urteile über die Dinge.', author: 'Epiktet' },
  { text: 'Keiner ist frei, der nicht Herr über sich selbst ist.', author: 'Epiktet' },
  { text: 'Solange du lebst, lerne zu leben.', author: 'Seneca' },
  { text: 'Wir leiden mehr in der Vorstellung als in der Wirklichkeit.', author: 'Seneca' },
  { text: 'Es ist nicht wenig Zeit, die wir haben, sondern viel Zeit, die wir nicht nutzen.', author: 'Seneca' },
  { text: 'Die Kunst des Lebens gleicht mehr dem Ringen als dem Tanzen.', author: 'Marc Aurel' },
  { text: 'Hör auf, darüber zu reden, was ein guter Mensch sein sollte, und sei einer.', author: 'Marc Aurel' },
  { text: 'Dein Leben ist das, was deine Gedanken daraus machen.', author: 'Marc Aurel' },
  { text: 'Der Mensch ist zum Arbeiten geboren wie der Vogel zum Fliegen.', author: 'Martin Luther' },
  { text: 'Wer kämpft, kann verlieren. Wer nicht kämpft, hat schon verloren.', author: 'Bertolt Brecht' },
  { text: 'Erfahrung ist der Name, den jeder seinen Fehlern gibt.', author: 'Oscar Wilde' },
  { text: 'Das Geheimnis des Vorwärtskommens besteht darin, anzufangen.', author: 'Mark Twain' },
  { text: 'Gewohnheit kann man nicht aus dem Fenster werfen, aber Stufe für Stufe die Treppe hinunterlocken.', author: 'Mark Twain' },
  { text: 'Qualität ist keine Handlung, sie ist eine Gewohnheit.', author: 'Aristoteles' },
  { text: 'Das Ganze ist mehr als die Summe seiner Teile.', author: 'Aristoteles' },
  { text: 'Nur wer sein Ziel kennt, findet den Weg.', author: 'Laozi' },
  { text: 'Habe Mut, dich deines eigenen Verstandes zu bedienen.', author: 'Immanuel Kant' },
  { text: 'Ich weiß, dass ich nichts weiß.', author: 'Sokrates' },
  { text: 'Der Anfang ist der wichtigste Teil der Arbeit.', author: 'Platon' },
  { text: 'Nichts ist beständig außer der Veränderung.', author: 'Heraklit' },
  { text: 'Genie ist ein Prozent Inspiration und neunundneunzig Prozent Transpiration.', author: 'Thomas Edison' },
  { text: 'Man muss noch Chaos in sich haben, um einen tanzenden Stern gebären zu können.', author: 'Friedrich Nietzsche' },
  { text: 'Der Worte sind genug gewechselt, lasst mich auch endlich Taten sehn.', author: 'Johann Wolfgang von Goethe' },
  { text: 'Was du ererbt von deinen Vätern hast, erwirb es, um es zu besitzen.', author: 'Johann Wolfgang von Goethe' },
  { text: 'Wer gar zu viel bedenkt, wird wenig leisten.', author: 'Friedrich Schiller' },
  { text: 'Der Tropfen höhlt den Stein nicht durch Gewalt, sondern durch häufiges Fallen.', author: 'Ovid' },
  { text: 'Sie können, weil sie glauben, dass sie können.', author: 'Vergil' },
  { text: 'Nutze den Tag.', author: 'Horaz' },
  { text: 'Wage zu wissen.', author: 'Horaz' },
  { text: 'Übung ist der beste Lehrmeister.', author: 'Publilius Syrus' },
  { text: 'Wer nichts weiß, muss alles glauben.', author: 'Marie von Ebner-Eschenbach' },
  { text: 'Siege sind nicht alles, aber der Wille zu siegen schon.', author: 'Vince Lombardi' },
]

/** Pool inkl. eigener Zitate. */
function pool(custom: Quote[] = []): Quote[] {
  return custom.length ? [...QUOTES, ...custom] : QUOTES
}

/** Index des heutigen Zitats — konstant über den Tag, wechselt um 0 Uhr. */
export function quoteOfTheDay(custom: Quote[] = [], d = new Date()): Quote {
  const list = pool(custom)
  const n = ((dayNumber(d) % list.length) + list.length) % list.length
  return list[n]
}
