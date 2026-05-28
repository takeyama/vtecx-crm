import { NextRequest } from 'next/server'
import { VtecxNext, isVtecxNextError } from '@vtecx/vtecxnext'
import * as apiutil from '@/utils/apiutil'

export const GET = async (req: NextRequest): Promise<Response> => {
  const vtecxnext = new VtecxNext(req)
  const check = vtecxnext.checkXRequestedWith()
  if (check) return check

  try {
    const customer = vtecxnext.getParameter('customer')
    if (customer) {
      const customerUri = encodeURIComponent(`/crm/customer/${customer}`)
      const feed = await vtecxnext.getFeed(`/crm/deal?customer_uri=${customerUri}`)
      return vtecxnext.response(200, feed ?? null)
    }
    const n = parseInt(vtecxnext.getParameter('n') ?? '1', 10)
    const entries = await vtecxnext.getPageWithPagination('/crm/deal?l=50', n)
    return vtecxnext.response(200, entries ?? null)
  } catch (e) {
    if (isVtecxNextError(e)) return vtecxnext.response(e.status, { feed: { title: e.message } })
    return vtecxnext.response(503, { feed: { title: 'Error occurred.' } })
  }
}

export const POST = async (req: NextRequest): Promise<Response> => {
  const vtecxnext = new VtecxNext(req)
  const check = vtecxnext.checkXRequestedWith()
  if (check) return check

  try {
    const body = await apiutil.getRequestJson(req)
    const uid = await vtecxnext.uid()
    const id = String(Date.now()).padStart(13, '0')
    const uri = `/crm/deal/${id}`

    const entry: any = {
      link: [{ ___rel: 'self', ___href: uri }],
      deal: { ...body.deal, assigned_uid: body.deal?.assigned_uid ?? uid },
      contributor: [
        { uri: 'urn:vte.cx:acl:/_group/$admin,CURD' },
        { uri: `urn:vte.cx:acl:${uid},CURD` },
        { uri: 'urn:vte.cx:acl:/_group/sales,RE' },
        { uri: 'urn:vte.cx:acl:/_group/viewer,RE' },
      ],
    }
    await vtecxnext.put({ feed: { entry: [entry] } })
    return vtecxnext.response(200, { feed: { title: uri } })
  } catch (e) {
    if (isVtecxNextError(e)) return vtecxnext.response(e.status, { feed: { title: e.message } })
    return vtecxnext.response(503, { feed: { title: 'Error occurred.' } })
  }
}
