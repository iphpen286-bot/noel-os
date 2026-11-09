import { dayNumber } from './date'

export type Hero = {
  src: string
  /** true: dunkle Statue, Zitat wird darüber gelegt.
   *  false: Bild enthält bereits Text/Komposition — ganz zeigen, Zitat darunter. */
  overlay: boolean
}

/* Nur deine eigenen Bilder — unverändert, ganz gezeigt. Weitere, die du
   schickst, einfach hier ergänzen (overlay:false = Bild ganz, Zitat darunter). */
export const HEROES: Hero[] = [
  { src: '/img/user-discipline.jpg', overlay: false },
  { src: '/img/user-definition.jpg', overlay: false },
]

/** Hero des Tages — wechselt mit dem Tag. */
export function heroOfTheDay(d = new Date()): Hero {
  const n = ((dayNumber(d) % HEROES.length) + HEROES.length) % HEROES.length
  return HEROES[n]
}
