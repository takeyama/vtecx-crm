import { NextRequest } from 'next/server'
import { VtecxNext, isVtecxNextError } from '@vtecx/vtecxnext'
import * as apiutil from '@/utils/apiutil'

// 自分のプロフィールを取得（ロール情報も含む）
export const GET = async (req: NextRequest): Promise<Response> => {
  const vtecxnext = new VtecxNext(req)
  const check = vtecxnext.checkXRequestedWith()
  if (check) return check

  try {
    const uid = await vtecxnext.uid()
    const [profile, isAdmin, isSales, isViewer] = await Promise.all([
      vtecxnext.getEntry(`/crm/user/${uid}`).catch(() => null),
      vtecxnext.isGroupMember('/_group/$admin').catch(() => false),
      vtecxnext.isGroupMember('/_group/sales').catch(() => false),
      vtecxnext.isGroupMember('/_group/viewer').catch(() => false),
    ])

    const entry: any = {
      ...(profile ?? {}),
      rights: JSON.stringify({ uid, isAdmin, isSales, isViewer }),
    }
    return vtecxnext.response(200, entry)
  } catch (e) {
    if (isVtecxNextError(e)) return vtecxnext.response(e.status, { feed: { title: e.message } })
    return vtecxnext.response(503, { feed: { title: 'Error occurred.' } })
  }
}

// 自分のプロフィールを保存（なければ作成、あれば更新）
export const PUT = async (req: NextRequest): Promise<Response> => {
  const vtecxnext = new VtecxNext(req)
  const check = vtecxnext.checkXRequestedWith()
  if (check) return check

  try {
    const uid = await vtecxnext.uid()
    const uri = `/crm/user/${uid}`
    const body = await apiutil.getRequestJson(req)
    const existing = await vtecxnext.getEntry(uri).catch(() => null)

    const entry: any = {
      link: [{ ___rel: 'self', ___href: uri }],
      id: existing?.id,
      userprofile: body.userprofile,
      contributor: existing?.contributor ?? [
        { uri: 'urn:vte.cx:acl:/_group/$admin,CURD' },
        { uri: `urn:vte.cx:acl:${uid},CURD` },
        { uri: 'urn:vte.cx:acl:+,RE' },
      ],
    }
    await vtecxnext.put({ feed: { entry: [entry] } })
    return vtecxnext.response(200, { feed: { title: 'Saved.' } })
  } catch (e) {
    if (isVtecxNextError(e)) return vtecxnext.response(e.status, { feed: { title: e.message } })
    return vtecxnext.response(503, { feed: { title: 'Error occurred.' } })
  }
}
