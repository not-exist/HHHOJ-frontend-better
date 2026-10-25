import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) {
  if (total <= 1) return null
  const pages: (number | '…')[] = []
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || Math.abs(i - page) <= 1) pages.push(i)
    else if (pages[pages.length - 1] !== '…') pages.push('…')
  }
  return (
    <div className="pager">
      <button onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label="prev">
        <ChevronLeft size={15} />
      </button>
      {pages.map((p, i) =>
        p === '…' ? (
          <button key={`e${i}`} disabled>…</button>
        ) : (
          <button key={p} className={p === page ? 'on' : ''} onClick={() => onChange(p)}>
            {p}
          </button>
        ),
      )}
      <button onClick={() => onChange(page + 1)} disabled={page >= total} aria-label="next">
        <ChevronRight size={15} />
      </button>
    </div>
  )
}
