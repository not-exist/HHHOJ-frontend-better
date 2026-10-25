import { useEffect, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'

type ToastMsg = { id: number; text: string }
type Listener = (msgs: ToastMsg[]) => void

let messages: ToastMsg[] = []
const listeners = new Set<Listener>()
let seq = 1

/** 全局 toast：showToast('已复制') */
export function showToast(text: string, ttl = 2200) {
  const id = seq++
  messages = [...messages, { id, text }]
  listeners.forEach((fn) => fn(messages))
  window.setTimeout(() => {
    messages = messages.filter((m) => m.id !== id)
    listeners.forEach((fn) => fn(messages))
  }, ttl)
}

export function ToastHost() {
  const [msgs, setMsgs] = useState<ToastMsg[]>(messages)
  useEffect(() => {
    listeners.add(setMsgs)
    return () => {
      listeners.delete(setMsgs)
    }
  }, [])
  if (msgs.length === 0) return null
  return (
    <>
      {msgs.map((m) => (
        <div className="toast" key={m.id} role="status">
          <CheckCircle2 />
          {m.text}
        </div>
      ))}
    </>
  )
}
