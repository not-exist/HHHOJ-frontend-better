import { useTranslation } from 'react-i18next'
import { SlidersHorizontal, MoonStar, Palette, Wand2, Languages } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import i18n from '@/i18n'

export default function SettingsDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const { mode, setMode, hue, setHue, particles, setParticles } = useTheme()
  if (!open) return null

  return (
    <>
      <div className="drawer-mask" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-label={t('settings.title')}>
        <h3>
          <SlidersHorizontal size={18} />
          {t('settings.title')}
        </h3>

        <div className="drawer-group">
          <span className="field-label">
            <MoonStar size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />
            {t('settings.appearance')}
          </span>
          <div className="seg">
            <button className={mode === 'dark' ? 'on' : ''} onClick={() => setMode('dark')}>
              {t('settings.dark')}
            </button>
            <button className={mode === 'light' ? 'on' : ''} onClick={() => setMode('light')}>
              {t('settings.light')}
            </button>
          </div>
        </div>

        <div className="drawer-group">
          <span className="field-label">
            <Palette size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />
            {t('settings.primaryHue')} · <span className="mono">{hue}</span>
          </span>
          <input
            className="hue-slider"
            type="range"
            min={0}
            max={360}
            value={hue}
            onChange={(e) => setHue(Number(e.target.value))}
            aria-label={t('settings.primaryHue')}
          />
          <p className="small faint" style={{ marginTop: '0.45rem' }}>{t('settings.hueHint')}</p>
        </div>

        <div className="drawer-group">
          <span className="field-label">
            <Wand2 size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />
            {t('settings.effects')}
          </span>
          <div className="drawer-row">
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{t('settings.particles')}</div>
              <div className="small faint">{t('settings.particlesHint')}</div>
            </div>
            <button className={`switch ${particles ? 'on' : ''}`} onClick={() => setParticles(!particles)} aria-label={t('settings.particles')} />
          </div>
        </div>

        <div className="drawer-group">
          <span className="field-label">
            <Languages size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />
            {t('settings.language')}
          </span>
          <div className="seg">
            <button className={i18n.language === 'zh' ? 'on' : ''} onClick={() => void i18n.changeLanguage('zh')}>
              {t('settings.zh')}
            </button>
            <button className={i18n.language === 'en' ? 'on' : ''} onClick={() => void i18n.changeLanguage('en')}>
              {t('settings.en')}
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
