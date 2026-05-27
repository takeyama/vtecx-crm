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
    const feed = await vtecxnext.getFeed(`/crm/customer/${cid}/activity`)
    return vtecxnext.response(200, feed ?? null)
  } catch (e) {
    if (isVtecxNextError(e)) return vtecxnext.response(e.status, { feed: { title: e.message } })
    return vtecxnext.response(503, { feed: { title: 'Error occurred.' } })
  }
}

export const POST = async (req: NextRequest, { params }: Params): Promise<Response> => {
  const vtecxnext = new VtecxNext(req)
  const check = vtecxnext.checkXRequestedWith()
  if (check) return check

  try {
    const { cid } = await params
    const body = await apiutil.getRequestJson(req)
    const uid = await vtecxnext.uid()
    const id = String(Date.now()).padStart(13, '0')
    const uri = `/crm/customer/${cid}/activity/${id}`

    const entry: any = {
      link: [{ ___rel: 'self', ___href: uri }],
      activity: { ...body.activity, created_uid: uid },
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
