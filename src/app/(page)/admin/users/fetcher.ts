import * as browserutil from '@/utils/browserutil'
import { CrmEntry } from '@/typings/crm'

export interface UserRow {
  uid: string
  display_name?: string
  family_name?: string
  given_name?: string
  family_name_kana?: string
  given_name_kana?: string
  department?: string
  title?: string
  email?: string
  phone?: string
  mobile?: string
  isSales: boolean
  isViewer: boolean
}

export const fetchUsers = async (): Promise<UserRow[]> => {
  const [profileData, groupData] = await Promise.all([
    browserutil.requestApi('GET', 'crm/user', '').catch(() => null),
    browserutil.requestApi('GET', 'admin/groups', '').catch(() => null),
  ])

  const entries = Array.isArray(profileData) ? profileData as CrmEntry[] : []
  const groupEntries = Array.isArray(groupData) ? groupData as CrmEntry[] : []
  const salesUids = new Set(
    groupEntries
      .filter((e) => e.groupmembers?.group_name === 'sales')
      .map((e) => e.groupmembers?.uid ?? '')
      .filter(Boolean)
  )
  const viewerUids = new Set(
    groupEntries
      .filter((e) => e.groupmembers?.group_name === 'viewer')
      .map((e) => e.groupmembers?.uid ?? '')
      .filter(Boolean)
  )

  return entries.map((e) => {
    const uid: string = e.link?.find((l: any) => l.___rel === 'self')?.___href?.split('/').pop() ?? ''
    const up = e.userprofile
    return {
      uid,
      display_name: up?.display_name,
      family_name: up?.family_name,
      given_name: up?.given_name,
      family_name_kana: up?.family_name_kana,
      given_name_kana: up?.given_name_kana,
      department: up?.department,
      title: up?.title,
      email: up?.email,
      phone: up?.phone,
      mobile: up?.mobile,
      isSales: salesUids.has(uid),
      isViewer: viewerUids.has(uid),
    }
  })
}

export const updateGroupMembership = async (
  uid: string,
  group: '/_group/sales' | '/_group/viewer',
  action: 'add' | 'remove'
): Promise<void> => {
  await browserutil.requestApi(
    'POST',
    'admin/groups',
    '',
    JSON.stringify({ uid, group, action }),
    { 'Content-Type': 'application/json' }
  )
}
