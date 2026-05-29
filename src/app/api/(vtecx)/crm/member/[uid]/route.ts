import { NextRequest } from 'next/server'
import { VtecxNext, isVtecxNextError } from '@vtecx/vtecxnext'

type Params = { params: Promise<{ uid: string }> }

// エイリアス経由でユーザーが担当する顧客一覧を取得
// 顧客エントリに rel="alternate" で /crm/member/{uid}/{cid} が付与されているため
// getFeed / getPageWithPagination で顧客エントリが直接返る（N+1 なし）
//
// エイリアスパスでも通常の検索パラメータ・ページングが使用可能
// （フィールドフィルタにはインデックス設定が必要）
export const GET = async (req: NextRequest, { params }: Params): Promise<Response> => {
  const vtecxnext = new VtecxNext(req)
  const check = vtecxnext.checkXRequestedWith()
  if (check) return check

  try {
    const { uid } = await params
    const n = parseInt(vtecxnext.getParameter('n') ?? '1', 10)
    const status = vtecxnext.getParameter('status')
    const q = vtecxnext.getParameter('q')

    // クエリパラメータを構築（エイリアスパスでも通常どおり使用可能）
    const uriParams = ['f', 'l=25']
    if (q) uriParams.push(`customer.name-ft-${encodeURIComponent(q)}`)
    else if (status) uriParams.push(`customer.status-eq-${encodeURIComponent(status)}`)
    const uri = `/crm/member/${uid}?${uriParams.join('&')}`

    // ページングもエイリアスパスで通常どおり使用可能
    let lastPageNumber = 0
    let hasNext = false
    if (n === 1) {
      const info = await vtecxnext.pagination(uri, '1,50')
      lastPageNumber = info?.lastPageNumber ?? 0
      hasNext = info?.hasNext ?? false
    }

    const raw = lastPageNumber === 0 && n === 1 ? null : await vtecxnext.getPage(uri, n)
    const entries = raw === null ? [] : Array.isArray(raw) ? raw : [raw]
    const active = entries.filter((e: any) => !e.customer?.is_deleted)

    return vtecxnext.response(200, { entries: active, lastPageNumber, hasNext, currentPage: n })
  } catch (e) {
    if (isVtecxNextError(e)) return vtecxnext.response(e.status, { feed: { title: e.message } })
    return vtecxnext.response(503, { feed: { title: 'Error occurred.' } })
  }
}
