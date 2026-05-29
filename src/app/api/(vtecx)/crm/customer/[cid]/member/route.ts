import { NextRequest } from 'next/server'
import { VtecxNext, isVtecxNextError } from '@vtecx/vtecxnext'

type Params = { params: Promise<{ cid: string }> }

// 担当営業一覧を取得（顧客エントリの alternate リンクから抽出）
export const GET = async (req: NextRequest, { params }: Params): Promise<Response> => {
  const vtecxnext = new VtecxNext(req)
  const check = vtecxnext.checkXRequestedWith()
  if (check) return check

  try {
    const { cid } = await params
    const customer = await vtecxnext.getEntry(`/crm/customer/${cid}`)
    const links = (customer as any)?.link ?? []
    const uids: string[] = links
      .filter((l: any) => l.___rel === 'alternate' && l.___href?.startsWith('/crm/member/'))
      .map((l: any) => (l.___href as string).split('/')[3])
      .filter(Boolean)

    const entries = uids.map((uid) => ({ member: { uid } }))
    return vtecxnext.response(200, entries.length > 0 ? entries : null)
  } catch (e) {
    if (isVtecxNextError(e)) return vtecxnext.response(e.status, { feed: { title: e.message } })
    return vtecxnext.response(503, { feed: { title: 'Error occurred.' } })
  }
}

// 担当営業を追加（顧客エントリに alternate リンクを付与）
export const POST = async (req: NextRequest, { params }: Params): Promise<Response> => {
  const vtecxnext = new VtecxNext(req)
  const check = vtecxnext.checkXRequestedWith()
  if (check) return check

  try {
    const { cid } = await params
    const body = await req.json()
    const targetUid: string = body.uid
    if (!targetUid) return vtecxnext.response(400, { feed: { title: 'uid is required.' } })

    const contributor = [
      { uri: 'urn:vte.cx:acl:/_group/$admin,CURD' },
      { uri: 'urn:vte.cx:acl:/_group/sales,CURDE' },
      { uri: 'urn:vte.cx:acl:/_group/viewer,RE' },
    ]
    const altHref = `/crm/member/${targetUid}/${cid}`

    // 顧客エントリを取得してエイリアスリンクを追加
    const customer = await vtecxnext.getEntry(`/crm/customer/${cid}`)
    const existingLinks: any[] = (customer as any)?.link ?? []

    // 重複チェック
    if (existingLinks.some((l: any) => l.___rel === 'alternate' && l.___href === altHref)) {
      return vtecxnext.response(200, { feed: { title: 'Already exists.' } })
    }

    const updatedCustomer = {
      ...(customer as any),
      link: [...existingLinks, { ___rel: 'alternate', ___href: altHref }],
    }

    // エイリアス親パス登録 + 顧客エントリ更新を1トランザクションでまとめる
    // 親パス（/crm/member/{uid}）を先頭に配置
    await vtecxnext.put({
      feed: {
        entry: [
          { link: [{ ___rel: 'self', ___href: `/crm/member/${targetUid}` }], contributor },
          updatedCustomer,
        ]
      }
    })

    return vtecxnext.response(200, { feed: { title: altHref } })
  } catch (e) {
    if (isVtecxNextError(e)) return vtecxnext.response(e.status, { feed: { title: e.message } })
    return vtecxnext.response(503, { feed: { title: 'Error occurred.' } })
  }
}
