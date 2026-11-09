import { useState } from 'react'
import { useStore } from '../store/store'
import { formatToday } from '../lib/date'
import { quoteOfTheDay, quoteKey } from '../lib/quotes'
import { heroOfTheDay, HEROES, type Hero } from '../lib/heroes'
import Sheet from './Sheet'
import { Button, Field } from './ui'
import { haptic } from '../lib/haptics'
import './QuoteHero.css'

function Heart({ filled, onClick, light }: { filled: boolean; onClick: () => void; light?: boolean }) {
  return (
    <button className={'q-heart press' + (light ? ' light' : '')} aria-pressed={filled}
      onClick={() => { haptic.soft(); onClick() }} aria-label="Favorit">
      <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8">
        <path d="M12 20.5 4.5 13a4.6 4.6 0 0 1 6.5-6.5l1 1 1-1A4.6 4.6 0 0 1 19.5 13Z" />
      </svg>
    </button>
  )
}

export default function QuoteHero() {
  const custom = useStore((s) => s.quotes.custom)
  const favorites = useStore((s) => s.quotes.favorites)
  const toggleFav = useStore((s) => s.toggleFavQuote)
  const addCustom = useStore((s) => s.addCustomQuote)

  const quote = quoteOfTheDay(custom)
  const isFav = favorites.includes(quoteKey(quote))

  const hp = new URLSearchParams(window.location.search).get('h')
  const hero: Hero = hp != null && HEROES[Number(hp)] ? HEROES[Number(hp)] : heroOfTheDay()

  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [author, setAuthor] = useState('')
  const saveOwn = () => {
    if (!text.trim() || !author.trim()) return
    addCustom(text.trim(), author.trim())
    setText(''); setAuthor(''); setOpen(false)
  }

  const addSheet = (
    <Sheet open={open} onOpenChange={setOpen} title="Eigenes Zitat">
      <Field label="Zitat">
        <textarea className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Text des Zitats" />
      </Field>
      <Field label="Urheber">
        <input className="input" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Wer hat es gesagt?" />
      </Field>
      <div style={{ marginTop: 'var(--sp-4)' }}>
        <Button full onClick={saveOwn}>Hinzufügen</Button>
      </div>
    </Sheet>
  )

  if (hero.overlay) {
    return (
      <section className="qhero">
        <img className="qhero-img" src={hero.src} alt="" aria-hidden="true" loading="eager" decoding="async" />
        <Heart filled={isFav} onClick={() => toggleFav(quoteKey(quote))} light />
        <div className="qhero-content">
          <p className="caption qhero-date">{formatToday()}</p>
          <blockquote className="qhero-quote">
            <p className="qhero-text">{quote.text}</p>
            <footer className="qhero-author">{quote.author}</footer>
          </blockquote>
        </div>
        {addSheet}
      </section>
    )
  }

  return (
    <section className="qhero qhero--asis">
      <img className="qhero-full" src={hero.src} alt="Motiv des Tages" loading="eager" decoding="async" />
      <div className="qhero-below">
        <p className="caption">{formatToday()}</p>
        <blockquote className="qhero-quote">
          <p className="qhero-text-b">{quote.text}</p>
          <div className="qhero-foot">
            <span className="qhero-author-b secondary">{quote.author}</span>
            <div className="qhero-actions">
              <Heart filled={isFav} onClick={() => toggleFav(quoteKey(quote))} />
              <button className="q-add press" onClick={() => setOpen(true)} aria-label="Eigenes Zitat">+</button>
            </div>
          </div>
        </blockquote>
      </div>
      {addSheet}
    </section>
  )
}
