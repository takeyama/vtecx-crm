import { NextRequest } from 'next/server'
import { VtecxNext, isVtecxNextError } from '@vtecx/vtecxnext'

type Params = { params: Promise<{ cid: string; uid: string }> }

// 担当営業を削除（顧客エントリから alternate リンクを除去）
export const DELETE = async (req: NextRequest, { params }: Params): Promise<Response> => {
  const vtecxnext = new VtecxNext(req)
  const check = vtecxnext.checkXRequestedWith()
  if (check) return check

  try {
    const { cid, uid } = await params
    const altHref = `/crm/member/${uid}/${cid}`

    const customer = await vtecxnext.getEntry(`/crm/customer/${cid}`)
    const existingLinks: any[] = (customer as any)?.link ?? []
    const updatedLinks = existingLinks.filter(
      (l: any) => !(l.___rel === 'alternate' && l.___href === altHref)
    )

    await vtecxnext.put({
      feed: {
        entry: [{
          ...(customer as any),
          link: updatedLinks,
        }]
      }
    })

    return vtecxnext.response(200, { feed: { title: 'Deleted.' } })
  } catch (e) {
    if (isVtecxNextError(e)) return vtecxnext.response(e.status, { feed: { title: e.message } })
    return vtecxnext.response(503, { feed: { title: 'Error occurred.' } })
  }
}
