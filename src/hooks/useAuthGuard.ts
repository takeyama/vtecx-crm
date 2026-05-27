import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { fetchMyInfo, MyInfo } from '@/app/(page)/settings/fetcher'

export type AuthState = 'checking' | 'ok' | 'redirecting'

export const useAuthGuard = () => {
  const router = useRouter()
  const [state, setState] = useState<AuthState>('checking')
  const [info, setInfo] = useState<MyInfo | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const data = await fetchMyInfo()
        if (!data.display_name?.trim()) {
          router.replace('/setup')
          setState('redirecting')
          return
        }
        const hasRole = data.isAdmin || data.isSales || data.isViewer
        if (!hasRole) {
          router.replace('/pending')
          setState('redirecting')
          return
        }
        setInfo(data)
        setState('ok')
      } catch {
        setState('ok')
      }
    })()
  }, [])

  return { state, info }
}
