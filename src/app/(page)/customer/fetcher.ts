import * as browserutil from '@/utils/browserutil'
import { CrmEntry, CustomerEntity } from '@/typings/crm'

export interface CustomerFilter {
  status?: string
  q?: string
  memberUid?: string
}

export interface PagedResult {
  entries: CrmEntry[]
  lastPageNumber: number
  hasNext: boolean
}

export const fetchCustomers = async (n = 1, filter?: CustomerFilter): Promise<PagedResult> => {
  try {
    const params: string[] = [`n=${n}`]
    if (filter?.q) params.push(`q=${encodeURIComponent(filter.q)}`)
    if (filter?.status) params.push(`status=${filter.status}`)
    const data = await browserutil.requestApi('GET', 'crm/customer', params.join('&'))
    const entries = (Array.isArray(data?.entries) ? data.entries as CrmEntry[] : [])
      .filter((e: CrmEntry) => !e.customer?.is_deleted)
    return { entries, lastPageNumber: data?.lastPageNumber ?? 0, hasNext: data?.hasNext ?? false }
  } catch (e: any) {
    if (e?.status === 204) return { entries: [], lastPageNumber: 0, hasNext: false }
    throw e
  }
}

export const fetchCustomer = async (cid: string): Promise<CrmEntry | null> => {
  try {
    const data = await browserutil.requestApi('GET', `crm/customer/${cid}`, '')
    return (data as CrmEntry) ?? null
  } catch (e: any) {
    if (e?.status === 204) return null
    throw e
  }
}

export const bulkCreateCustomers = async (customers: CustomerEntity[]): Promise<number> => {
  const data = await browserutil.requestApi(
    'POST',
    'crm/customer/bulk',
    '',
    JSON.stringify({ customers }),
    { 'Content-Type': 'application/json' }
  )
  return parseInt(data?.feed?.title ?? '0', 10)
}

export const createCustomer = async (customer: CustomerEntity): Promise<string> => {
  const data = await browserutil.requestApi(
    'POST',
    'crm/customer',
    '',
    JSON.stringify({ customer }),
    { 'Content-Type': 'application/json' }
  )
  return data?.feed?.title ?? ''
}

export const updateCustomer = async (cid: string, customer: CustomerEntity): Promise<void> => {
  await browserutil.requestApi(
    'PUT',
    `crm/customer/${cid}`,
    '',
    JSON.stringify({ customer }),
    { 'Content-Type': 'application/json' }
  )
}

export const fetchCustomersByMember = async (
  uid: string,
  page = 1,
  filter?: { status?: string; q?: string }
): Promise<PagedResult> => {
  try {
    const params: string[] = [`n=${page}`]
    if (filter?.q) params.push(`q=${encodeURIComponent(filter.q)}`)
    if (filter?.status) params.push(`status=${filter.status}`)
    const data = await browserutil.requestApi('GET', `crm/member/${uid}`, params.join('&'))
    const entries = Array.isArray(data?.entries) ? data.entries as CrmEntry[] : []
    return { entries, lastPageNumber: data?.lastPageNumber ?? 0, hasNext: data?.hasNext ?? false }
  } catch {
    return { entries: [], lastPageNumber: 0, hasNext: false }
  }
}

export const fetchMembers = async (cid: string): Promise<CrmEntry[]> => {
  try {
    const data = await browserutil.requestApi('GET', `crm/customer/${cid}/member`, '')
    return (Array.isArray(data) ? data as CrmEntry[] : []).filter((e) => !e.member?.is_deleted)
  } catch {
    return []
  }
}

export const addMember = async (cid: string, uid: string): Promise<void> => {
  await browserutil.requestApi(
    'POST',
    `crm/customer/${cid}/member`,
    '',
    JSON.stringify({ uid }),
    { 'Content-Type': 'application/json' }
  )
}

export const removeMember = async (cid: string, uid: string): Promise<void> => {
  await browserutil.requestApi('DELETE', `crm/customer/${cid}/member/${uid}`, '')
}

export const fetchAllCustomers = async (): Promise<CrmEntry[]> => {
  try {
    const data = await browserutil.requestApi('GET', 'crm/customer', 'all=1')
    return (Array.isArray(data) ? data as CrmEntry[] : []).filter((e) => !e.customer?.is_deleted)
  } catch {
    return []
  }
}

export const deleteCustomer = async (cid: string): Promise<void> => {
  await browserutil.requestApi('DELETE', `crm/customer/${cid}`, '')
}

export const fetchContacts = async (cid: string): Promise<CrmEntry[]> => {
  try {
    const data = await browserutil.requestApi('GET', `crm/customer/${cid}/contact`, '')
    return (Array.isArray(data) ? data as CrmEntry[] : []).filter((e) => !e.contact?.is_deleted)
  } catch (e: any) {
    if (e?.status === 204) return []
    throw e
  }
}

export const createContact = async (cid: string, contact: import('@/typings/crm').ContactEntity): Promise<void> => {
  await browserutil.requestApi(
    'POST',
    `crm/customer/${cid}/contact`,
    '',
    JSON.stringify({ contact }),
    { 'Content-Type': 'application/json' }
  )
}

export const updateContact = async (cid: string, ctid: string, contact: import('@/typings/crm').ContactEntity): Promise<void> => {
  await browserutil.requestApi(
    'PUT',
    `crm/customer/${cid}/contact/${ctid}`,
    '',
    JSON.stringify({ contact }),
    { 'Content-Type': 'application/json' }
  )
}

export const deleteContact = async (cid: string, ctid: string): Promise<void> => {
  await browserutil.requestApi('DELETE', `crm/customer/${cid}/contact/${ctid}`, '')
}

export const fetchActivities = async (cid: string): Promise<CrmEntry[]> => {
  try {
    const data = await browserutil.requestApi('GET', `crm/customer/${cid}/activity`, '')
    return (Array.isArray(data) ? data as CrmEntry[] : []).filter((e) => !e.activity?.is_deleted)
  } catch (e: any) {
    if (e?.status === 204) return []
    throw e
  }
}

export const createActivity = async (cid: string, activity: import('@/typings/crm').ActivityEntity): Promise<void> => {
  await browserutil.requestApi(
    'POST',
    `crm/customer/${cid}/activity`,
    '',
    JSON.stringify({ activity }),
    { 'Content-Type': 'application/json' }
  )
}

export const updateActivity = async (cid: string, aid: string, activity: import('@/typings/crm').ActivityEntity): Promise<void> => {
  await browserutil.requestApi(
    'PUT',
    `crm/customer/${cid}/activity/${aid}`,
    '',
    JSON.stringify({ activity }),
    { 'Content-Type': 'application/json' }
  )
}

export const deleteActivity = async (cid: string, aid: string): Promise<void> => {
  await browserutil.requestApi('DELETE', `crm/customer/${cid}/activity/${aid}`, '')
}
