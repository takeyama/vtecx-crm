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
      const feed = await vtecxnext.getFeed(`/crm/deal?f&deal.customer_uri-eq-${customerUri}`)
      return vtecxnext.response(200, feed ?? null)
    }
    const n = parseInt(vtecxnext.getParameter('n') ?? '1', 10)
    const stage = vtecxnext.getParameter('stage')
    const q = vtecxnext.getParameter('q')
    const dateFrom = vtecxnext.getParameter('date_from')
    const dateTo = vtecxnext.getParameter('date_to')
    const params = ['f', 'l=50']
    if (q) params.push(`deal.name-ft-${encodeURIComponent(q)}`)
    else if (dateFrom) params.push(`deal.expected_close_date-ge-${encodeURIComponent(dateFrom)}`)
    if (!q && dateTo) params.push(`deal.expected_close_date-le-${encodeURIComponent(dateTo)}`)
    if (!q && !dateFrom && stage) params.push(`deal.stage-eq-${encodeURIComponent(stage)}`)
    const uri = `/crm/deal?${params.join('&')}`

    let lastPageNumber = 0
    let hasNext = false
    if (n === 1) {
      const info = await vtecxnext.pagination(uri, '1,50')
      lastPageNumber = info?.lastPageNumber ?? 0
      hasNext = info?.hasNext ?? false
    }
    const raw = lastPageNumber === 0 && n === 1 ? null : await vtecxnext.getPage(uri, n)
    const entries = raw === null ? [] : Array.isArray(raw) ? raw : [raw]
    return vtecxnext.response(200, { entries, lastPageNumber, hasNext, currentPage: n })
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
