import * as browserutil from '@/utils/browserutil'
import { CrmEntry, DealEntity, normalizeEntries } from '@/typings/crm'

export const fetchDeals = async (n = 1): Promise<CrmEntry[]> => {
  try {
    const data = await browserutil.requestApi('GET', 'crm/deal', `n=${n}`)
    return normalizeEntries(data)
  } catch (e: any) {
    if (e?.status === 204) return []
    throw e
  }
}

export const fetchDeal = async (did: string): Promise<CrmEntry | null> => {
  try {
    const data = await browserutil.requestApi('GET', `crm/deal/${did}`, '')
    const entries = normalizeEntries(data)
    return entries[0] ?? null
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
