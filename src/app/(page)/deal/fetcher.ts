import * as browserutil from '@/utils/browserutil'
import { CrmEntry, DealEntity } from '@/typings/crm'

export interface DealFilter {
  stage?: string
  q?: string
  dateFrom?: string
  dateTo?: string
}

export interface PagedResult {
  entries: CrmEntry[]
  lastPageNumber: number
  hasNext: boolean
}

export const fetchDeals = async (n = 1, filter?: DealFilter): Promise<PagedResult> => {
  try {
    const params: string[] = [`n=${n}`]
    if (filter?.q) params.push(`q=${encodeURIComponent(filter.q)}`)
    if (filter?.stage) params.push(`stage=${filter.stage}`)
    if (filter?.dateFrom) params.push(`date_from=${filter.dateFrom}`)
    if (filter?.dateTo) params.push(`date_to=${filter.dateTo}`)
    const data = await browserutil.requestApi('GET', 'crm/deal', params.join('&'))
    const entries = (Array.isArray(data?.entries) ? data.entries as CrmEntry[] : [])
      .filter((e: CrmEntry) => !e.deal?.is_deleted)
    return { entries, lastPageNumber: data?.lastPageNumber ?? 0, hasNext: data?.hasNext ?? false }
  } catch (e: any) {
    if (e?.status === 204) return { entries: [], lastPageNumber: 0, hasNext: false }
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
