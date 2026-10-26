import { useEffect, useSyncExternalStore } from 'react'
import { api, type UserCard } from '@/services/api'
import { useAuth } from '@/context/AuthContext'

const MAX_NAMES = 500
const USERNAME = /^[a-zA-Z0-9_]{1,20}$/

// 缓存属于当前登录用户（未登录时为空字符串）；切换用户时从零开始。
let owner = ''
let cards: Record<string, UserCard> = {}
let queue = new Set<string>()
let scheduled = false
const asked = new Set<string>()
const listeners = new Set<() => void>()

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function snapshot(): Record<string, UserCard> {
  return cards
}

function notify(): void {
  listeners.forEach((l) => l())
}

function flush(): void {
  scheduled = false
  const names = [...queue]
  queue = new Set()
  for (let i = 0; i < names.length; i += MAX_NAMES) {
    const chunk = names.slice(i, i + MAX_NAMES)
    const requestOwner = owner
    api.userCards(chunk).then(
      (r) => {
        if (requestOwner !== owner) return
        cards = { ...cards, ...r }
        notify()
      },
      () => {
        // 请求失败的名字忘掉，下次出现时重试。
        if (requestOwner === owner) chunk.forEach((name) => asked.delete(name))
      },
    )
  }
}

function ask(session: string, names: string[]): void {
  if (session !== owner) {
    owner = session
    cards = {}
    asked.clear()
    queue = new Set()
    notify()
  }
  for (const name of names) {
    if (asked.has(name)) continue
    asked.add(name)
    queue.add(name)
  }
  if (queue.size > 0 && !scheduled) {
    scheduled = true
    setTimeout(flush, 0)
  }
}

/** 按用户名缓存用户卡片；同一 tick 内的名字合并成一次 /api/users/cards。 */
export function useUserCards(usernames: string[]): Record<string, UserCard> {
  const all = useSyncExternalStore(subscribe, snapshot)
  const { user } = useAuth()
  const session = user?.name ?? ''
  const key = usernames.join(',')
  useEffect(() => {
    ask(session, key.split(',').filter((name) => USERNAME.test(name)))
  }, [session, key])
  return all
}
