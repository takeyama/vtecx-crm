import * as browserutil from '@/utils/browserutil'
import { CrmEntry, CustomerEntity, normalizeEntries } from '@/typings/crm'

export const fetchCustomers = async (n = 1): Promise<CrmEntry[]> => {
  try {
    const data = await browserutil.requestApi('GET', 'crm/customer', `n=${n}`)
    return normalizeEntries(data)
  } catch (e: any) {
    if (e?.status === 204) return []
    throw e
  }
}

export const fetchCustomer = async (cid: string): Promise<CrmEntry | null> => {
  try {
    const data = await browserutil.requestApi('GET', `crm/customer/${cid}`, '')
    const entries = normalizeEntries(data)
    return entries[0] ?? null
  } catch (e: any) {
    if (e?.status === 204) return null
    throw e
  }
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

export const deleteCustomer = async (cid: string): Promise<void> => {
  await browserutil.requestApi('DELETE', `crm/customer/${cid}`, '')
}

export const fetchContacts = async (cid: string): Promise<CrmEntry[]> => {
  try {
    const data = await browserutil.requestApi('GET', `crm/customer/${cid}/contact`, '')
    return normalizeEntries(data).filter((e) => !e.contact?.is_deleted)
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
    return normalizeEntries(data).filter((e) => !e.activity?.is_deleted)
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
