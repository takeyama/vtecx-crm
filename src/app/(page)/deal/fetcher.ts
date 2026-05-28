import * as browserutil from '@/utils/browserutil'
import { CrmEntry, DealEntity } from '@/typings/crm'

export const fetchDeals = async (n = 1): Promise<CrmEntry[]> => {
  try {
    const data = await browserutil.requestApi('GET', 'crm/deal', `n=${n}`)
    return Array.isArray(data) ? data as CrmEntry[] : []
  } catch (e: any) {
    if (e?.status === 204) return []
    throw e
  }
}

export const fetchDealsByCustomer = async (cid: string): Promise<CrmEntry[]> => {
  try {
    const data = await browserutil.requestApi('GET', 'crm/deal', `customer=${cid}`)
    return (Array.isArray(data) ? data as CrmEntry[] : []).filter((e) => !e.deal?.is_deleted)
  } catch {
    return []
  }
}

export const fetchDeal = async (did: string): Promise<CrmEntry | null> => {
  try {
    const data = await browserutil.requestApi('GET', `crm/deal/${did}`, '')
    return (data as CrmEntry) ?? null
  } catch (e: any) {
    if (e?.status === 204) return null
    throw e
  }
}

export const createDeal = async (deal: DealEntity): Promise<string> => {
  const data = await browserutil.requestApi(
    'POST',
    'crm/deal',
    '',
    JSON.stringify({ deal }),
    { 'Content-Type': 'application/json' }
  )
  return data?.feed?.title ?? ''
}

export const updateDeal = async (did: string, deal: DealEntity): Promise<void> => {
  await browserutil.requestApi(
    'PUT',
    `crm/deal/${did}`,
    '',
    JSON.stringify({ deal }),
    { 'Content-Type': 'application/json' }
  )
}

export const deleteDeal = async (did: string): Promise<void> => {
  await browserutil.requestApi('DELETE', `crm/deal/${did}`, '')
}
