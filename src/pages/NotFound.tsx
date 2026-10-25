import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Compass } from 'lucide-react'

export default function NotFound() {
  const { t } = useTranslation()
  return (
    <div className="glass pad rise center" style={{ padding: '5rem 1rem' }}>
      <div className="nf-code">{t('notfound.title')}</div>
      <p className="muted" style={{ margin: '0.8rem 0 1.4rem' }}>{t('notfound.subtitle')}</p>
      <Link to="/" className="btn btn-primary">
        <Compass size={15} /> {t('notfound.backHome')}
      </Link>
    </div>
  )
}
