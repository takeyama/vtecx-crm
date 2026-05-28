import { NextRequest } from 'next/server'
import { VtecxNext, isVtecxNextError } from '@vtecx/vtecxnext'

const GROUPS = ['/_group/sales', '/_group/viewer'] as const

// グループメンバー一覧を取得
export const GET = async (req: NextRequest): Promise<Response> => {
  const vtecxnext = new VtecxNext(req)
  const check = vtecxnext.checkXRequestedWith()
  if (check) return check

  try {
    const [salesFeed, viewerFeed] = await Promise.all(
      GROUPS.map((g) => vtecxnext.getFeed(g).catch(() => null))
    )

    const toUids = (feed: any): string[] => {
      if (!feed) return []
      const entries = feed ?? []
      return entries
        .map((e: any) => {
          const href: string = e?.link?.find((l: any) => l.___rel === 'self')?.___href ?? ''
          return href.split('/').pop() ?? ''
        })
        .filter(Boolean)
    }

    const salesUids = toUids(salesFeed)
    const viewerUids = toUids(viewerFeed)
    const entries = [
      ...salesUids.map((uid) => ({ groupmembers: { group_name: 'sales', uid } })),
      ...viewerUids.map((uid) => ({ groupmembers: { group_name: 'viewer', uid } })),
    ]
    return vtecxnext.response(200, entries.length > 0 ? entries : null)
  } catch (e) {
    if (isVtecxNextError(e)) return vtecxnext.response(e.status, { feed: { title: e.message } })
    return vtecxnext.response(503, { feed: { title: 'Error occurred.' } })
  }
}

// グループへの追加・削除
// body: { uid: string, group: "/_group/sales" | "/_group/viewer", action: "add" | "remove" }
export const POST = async (req: NextRequest): Promise<Response> => {
  const vtecxnext = new VtecxNext(req)
  const check = vtecxnext.checkXRequestedWith()
  if (check) return check

  try {
    const body = await req.json()
    const { uid, group, action } = body as { uid: string; group: string; action: 'add' | 'remove' }

    if (!uid || !group || !action) {
      return vtecxnext.response(400, { feed: { title: 'uid, group, action are required.' } })
    }
    if (!GROUPS.includes(group as any)) {
      return vtecxnext.response(400, { feed: { title: 'Invalid group.' } })
    }

    if (action === 'add') {
      await vtecxnext.addGroupByAdmin([uid], group)
    } else {
      await vtecxnext.leaveGroupByAdmin([uid], group)
    }

    return vtecxnext.response(200, { feed: { title: 'Done.' } })
  } catch (e) {
    if (isVtecxNextError(e)) return vtecxnext.response(e.status, { feed: { title: e.message } })
    return vtecxnext.response(503, { feed: { title: 'Error occurred.' } })
  }
}
