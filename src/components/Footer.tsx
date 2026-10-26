import { useTranslation } from 'react-i18next'
import { Sparkles, Github, BookOpen, Heart } from 'lucide-react'

export default function Footer() {
  const { t } = useTranslation()
  return (
    <footer className="footer">
      <div className="container">
        <div className="row" style={{ gap: '0.55rem' }}>
          <span className="logo-mark" style={{ width: '1.6rem', height: '1.6rem', borderRadius: '0.5rem', display: 'grid', placeItems: 'center', color: '#fff', background: 'linear-gradient(135deg, var(--primary), hsl(calc(var(--hue) + 70) 80% 60%))' }}>
            <Sparkles size={13} />
          </span>
          <div>
            <b style={{ color: 'var(--text-2)' }}>TwilightOJ</b>
            <div>{t('footer.slogan')}</div>
          </div>
        </div>
        <div className="footer-links">
          <a href="#" onClick={(e) => e.preventDefault()}><BookOpen size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />{t('footer.docs')}</a>
          <a href="#" onClick={(e) => e.preventDefault()}><Github size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />{t('footer.github')}</a>
          <a href="#" onClick={(e) => e.preventDefault()}>{t('footer.style')}</a>
        </div>
        <div className="row" style={{ gap: '0.3rem', color: 'var(--text-3)' }}>
          <Heart size={12} />
          {t('footer.copyright')}
        </div>
      </div>
    </footer>
  )
}
