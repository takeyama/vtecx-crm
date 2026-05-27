import { NextRequest } from 'next/server'
import { VtecxNext, isVtecxNextError } from '@vtecx/vtecxnext'
import * as apiutil from '@/utils/apiutil'

type Params = { params: Promise<{ cid: string }> }

export const GET = async (req: NextRequest, { params }: Params): Promise<Response> => {
  const vtecxnext = new VtecxNext(req)
  const check = vtecxnext.checkXRequestedWith()
  if (check) return check

  try {
    const { cid } = await params
    const entry = await vtecxnext.getEntry(`/crm/customer/${cid}`)
    return vtecxnext.response(200, entry ?? null)
  } catch (e) {
    if (isVtecxNextError(e)) return vtecxnext.response(e.status, { feed: { title: e.message } })
    return vtecxnext.response(503, { feed: { title: 'Error occurred.' } })
  }
}

export const PUT = async (req: NextRequest, { params }: Params): Promise<Response> => {
  const vtecxnext = new VtecxNext(req)
  const check = vtecxnext.checkXRequestedWith()
  if (check) return check

  try {
    const { cid } = await params
    const uri = `/crm/customer/${cid}`
    const body = await apiutil.getRequestJson(req)
    const existing = await vtecxnext.getEntry(uri)

    const entry: any = {
      link: [{ ___rel: 'self', ___href: uri }],
      id: existing?.id,
      customer: body.customer,
      contributor: existing?.contributor,
    }
    await vtecxnext.put({ feed: { entry: [entry] } })
    return vtecxnext.response(200, { feed: { title: 'Updated.' } })
  } catch (e) {
    if (isVtecxNextError(e)) return vtecxnext.response(e.status, { feed: { title: e.message } })
    return vtecxnext.response(503, { feed: { title: 'Error occurred.' } })
  }
}

export const DELETE = async (req: NextRequest, { params }: Params): Promise<Response> => {
  const vtecxnext = new VtecxNext(req)
  const check = vtecxnext.checkXRequestedWith()
  if (check) return check

  try {
    const { cid } = await params
    const uri = `/crm/customer/${cid}`
    const existing = await vtecxnext.getEntry(uri)

    const entry: any = {
      link: [{ ___rel: 'self', ___href: uri }],
      id: existing?.id,
      customer: { ...(existing as any)?.customer, is_deleted: true },
      contributor: existing?.contributor,
    }
    await vtecxnext.put({ feed: { entry: [entry] } })
    return vtecxnext.response(200, { feed: { title: 'Deleted.' } })
  } catch (e) {
    if (isVtecxNextError(e)) return vtecxnext.response(e.status, { feed: { title: e.message } })
    return vtecxnext.response(503, { feed: { title: 'Error occurred.' } })
  }
}
