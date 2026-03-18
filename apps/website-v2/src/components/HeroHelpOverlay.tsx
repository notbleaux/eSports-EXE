// Hero Help Overlay - Rotating 5 mascots, fluid/adaptive
import { useState, useEffect } from 'react'

interface Hero {
  name: string
  tip: string
  sprite: string
}

const heroes: Hero[] = [
  { name: 'Yahu', tip: 'Click Quarterly Grid for panels', sprite: '/heroes/yahu.png' },
  { name: 'Meha', tip: 'Centre Dial toggles SFX', sprite: '/heroes/meha.png' }
  // ... 3 more
]

export const HeroHelpOverlay = () => {
  const [currentHero, setCurrentHero] = useState(0)
  const [show, setShow] = useState(true)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (show) {
      const interval = setInterval(() => {
        setCurrentHero(prev => (prev + 1) % heroes.length)
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [show])

  if (!show || dismissed) return null

  return (
    <div className="fixed bottom-4 right-4 bg-gradient-to-r from-purple-500 to-blue-500 p-4 rounded-xl shadow-2xl max-w-sm animate-float">
      <div className="flex items-center gap-3">
        <img
          src={heroes[currentHero].sprite}
          alt={heroes[currentHero].name}
          className="w-12 h-12 rounded-full shadow-lg"
        />
        <div>
          <h3 className="font-bold text-white">{heroes[currentHero].name}</h3>
          <p className="text-xs text-slate-200">{heroes[currentHero].tip}</p>
        </div>
        <button onClick={() => setShow(false)} className="ml-2 text-white hover:text-slate-200">
          ×
        </button>
        <button
          onClick={() => {
            setDismissed(true)
            localStorage.setItem('heroHelpDismissed', 'true')
          }}
          className="ml-1 text-xs underline"
        >
          Never
        </button>
      </div>
    </div>
  )
}
