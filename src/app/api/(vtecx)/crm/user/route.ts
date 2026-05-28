import { NextRequest } from 'next/server'
import { VtecxNext, isVtecxNextError } from '@vtecx/vtecxnext'

// 全ユーザープロフィール一覧（管理者用）
export const GET = async (req: NextRequest): Promise<Response> => {
  const vtecxnext = new VtecxNext(req)
  const check = vtecxnext.checkXRequestedWith()
  if (check) return check

  try {
    const feed = await vtecxnext.getFeed('/crm/user')
    if (!feed) return vtecxnext.response(200, null)

    const entries = Array.isArray(feed) ? feed : [feed]
    const entriesWithEmail = await Promise.all(
      entries.map(async (entry: any) => {
        const uid = entry.link?.find((l: any) => l.___rel === 'self')?.___href?.split('/').pop()
        if (!uid) return entry
        const userEntry = await vtecxnext.getEntry(`/_user/${uid}`).catch(() => null)
        const email = (userEntry as any)?.contributor?.[0]?.email ?? entry.userprofile?.email
        return { ...entry, userprofile: { ...entry.userprofile, email } }
      })
    )
    return vtecxnext.response(200, entriesWithEmail)
  } catch (e) {
    if (isVtecxNextError(e)) return vtecxnext.response(e.status, { feed: { title: e.message } })
    return vtecxnext.response(503, { feed: { title: 'Error occurred.' } })
  }
}
