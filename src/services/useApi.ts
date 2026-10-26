import { useCallback, useEffect, useState, type DependencyList } from 'react'

export interface AsyncResult<T> {
  data: T | undefined
  loading: boolean
  error: unknown
  reload: () => void
}

/** 页面级数据读取：保留上一次成功数据，重试时重新跑 loader */
export function useApi<T>(loader: () => Promise<T>, deps: DependencyList): AsyncResult<T> {
  const [data, setData] = useState<T | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)
    loader().then(
      (value) => {
        if (!alive) return
        setData(value)
        setLoading(false)
      },
      (reason) => {
        if (!alive) return
        setError(reason)
        setLoading(false)
      },
    )
    return () => {
      alive = false
    }
    // deps 由调用方显式给出；loader 每次渲染都会新建，不能放进依赖
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version])

  const reload = useCallback(() => setVersion((v) => v + 1), [])
  return { data, loading, error, reload }
}
