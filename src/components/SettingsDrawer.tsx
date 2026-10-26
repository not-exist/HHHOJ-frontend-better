import { useTranslation } from 'react-i18next'
import { SlidersHorizontal, MoonStar, Palette, Wand2, Languages, ExternalLink } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import { setNativeMode } from '@/services/gm'
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

        <div className="drawer-group">
          <span className="field-label">
            <ExternalLink size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />
            接管与逃生舱
          </span>
          <p className="small faint" style={{ marginBottom: '0.55rem' }}>
            未接管的页面会自动使用 HHHOJ 原站；这里可以整站切回原站。
          </p>
          <button
            className="btn btn-ghost btn-sm"
            style={{ width: '100%' }}
            onClick={() => {
              setNativeMode(true)
              location.reload()
            }}
          >
            <ExternalLink size={13} /> 切换到 HHHOJ 原站
          </button>
          <p className="small faint" style={{ marginTop: '0.5rem' }}>
            也可以访问 <code>?native=1</code>；用 <code>?takeover=1</code> 或 GM 菜单恢复接管。
          </p>
        </div>
      </aside>
    </>
  )
}
