import { NextRequest } from 'next/server'
import { VtecxNext, isVtecxNextError } from '@vtecx/vtecxnext'

// 既存エントリを再 PUT してインデックスを適用する
// 各顧客の全エントリ（顧客本体 + 子エントリ）を1回の put で処理する
export const POST = async (req: NextRequest): Promise<Response> => {
  const vtecxnext = new VtecxNext(req)
  const check = vtecxnext.checkXRequestedWith()
  if (check) return check

  try {
    let total = 0

    // ---- 顧客 + 子エントリ（1顧客 = 1トランザクション） ----
    const customerFeed = await vtecxnext.getFeed('/crm/customer').catch(() => null)
    const customers = customerFeed
      ? (Array.isArray(customerFeed) ? customerFeed : [customerFeed])
      : []

    for (const customer of customers) {
      const cid = (customer as any)?.link?.find((l: any) => l.___rel === 'self')?.___href?.split('/').pop()
      if (!cid) continue

      // 子エントリを並行取得
      const [contactFeed, activityFeed] = await Promise.all([
        vtecxnext.getFeed(`/crm/customer/${cid}/contact`).catch(() => null),
        vtecxnext.getFeed(`/crm/customer/${cid}/activity`).catch(() => null),
      ])

      const toArr = (feed: any) => feed
        ? (Array.isArray(feed) ? feed : [feed])
        : []

      // 1回の put にまとめる（親 → 子の順）
      // ※ 担当営業（member）は顧客エントリの alternate リンクで管理するため別途不要
      const batchEntries = [
        customer,                   // 親: 顧客本体（alternate リンクも含まれる）
        ...toArr(contactFeed),      // /contact エントリ群
        ...toArr(activityFeed),     // /activity エントリ群
      ]

      await vtecxnext.put({ feed: { entry: batchEntries } })
      total += batchEntries.length
    }

    // ---- 商談 ----
    const dealFeed = await vtecxnext.getFeed('/crm/deal').catch(() => null)
    const deals = dealFeed ? (Array.isArray(dealFeed) ? dealFeed : [dealFeed]) : []
    if (deals.length > 0) {
      await vtecxnext.put({ feed: { entry: deals } })
      total += deals.length
    }

    // ---- ユーザープロフィール ----
    const userFeed = await vtecxnext.getFeed('/crm/user').catch(() => null)
    const users = userFeed ? (Array.isArray(userFeed) ? userFeed : [userFeed]) : []
    if (users.length > 0) {
      await vtecxnext.put({ feed: { entry: users } })
      total += users.length
    }

    return vtecxnext.response(200, {
      feed: { title: `再インデックス完了: ${total} 件処理` },
    })
  } catch (e) {
    if (isVtecxNextError(e)) return vtecxnext.response(e.status, { feed: { title: e.message } })
    return vtecxnext.response(503, { feed: { title: 'Error occurred.' } })
  }
}
