import { NextRequest } from 'next/server'
import { VtecxNext, isVtecxNextError } from '@vtecx/vtecxnext'
import * as apiutil from '@/utils/apiutil'

// 顧客を一括登録（1トランザクション）
export const POST = async (req: NextRequest): Promise<Response> => {
  const vtecxnext = new VtecxNext(req)
  const check = vtecxnext.checkXRequestedWith()
  if (check) return check

  try {
    const body = await apiutil.getRequestJson(req)
    const customers = body.customers
    if (!Array.isArray(customers) || customers.length === 0) {
      return vtecxnext.response(400, { feed: { title: 'customers is required.' } })
    }

    const uid = await vtecxnext.uid()
    const baseId = Date.now()
    const contributor = [
      { uri: 'urn:vte.cx:acl:/_group/$admin,CURD' },
      { uri: `urn:vte.cx:acl:${uid},CURD` },
      { uri: 'urn:vte.cx:acl:/_group/sales,RE' },
      { uri: 'urn:vte.cx:acl:/_group/viewer,RE' },
    ]

    // 顧客エントリ + 子パス（/contact・/activity）をすべて1回のputに含める
    const entries = customers.flatMap((customer: any, i: number) => {
      const uri = `/crm/customer/${String(baseId + i).padStart(13, '0')}`
      return [
        { link: [{ ___rel: 'self', ___href: uri }], customer, contributor },
        { link: [{ ___rel: 'self', ___href: `${uri}/contact` }], contributor },
        { link: [{ ___rel: 'self', ___href: `${uri}/activity` }], contributor },
      ]
    })

    await vtecxnext.put({ feed: { entry: entries } })
    return vtecxnext.response(200, { feed: { title: String(customers.length) } })
  } catch (e) {
    if (isVtecxNextError(e)) return vtecxnext.response(e.status, { feed: { title: e.message } })
    return vtecxnext.response(503, { feed: { title: 'Error occurred.' } })
  }
}
