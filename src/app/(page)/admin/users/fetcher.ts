import * as browserutil from '@/utils/browserutil'
import { normalizeEntries } from '@/typings/crm'

export interface UserRow {
  uid: string
  display_name?: string
  isSales: boolean
  isViewer: boolean
}

export const fetchUsers = async (): Promise<UserRow[]> => {
  const [profileData, groupData] = await Promise.all([
    browserutil.requestApi('GET', 'crm/user', '').catch(() => null),
    browserutil.requestApi('GET', 'admin/groups', '').catch(() => null),
  ])

  const entries = profileData ? normalizeEntries(profileData) : []
  const rights = JSON.parse(
    groupData?.rights ?? groupData?.feed?.entry?.[0]?.rights ?? '{}'
  )
  const salesUids: string[] = rights.sales ?? []
  const viewerUids: string[] = rights.viewer ?? []

  return entries.map((e) => {
    const uid: string = e.link?.find((l: any) => l.___rel === 'self')?.___href?.split('/').pop() ?? ''
    return {
      uid,
      display_name: e.userprofile?.display_name,
      isSales: salesUids.includes(uid),
      isViewer: viewerUids.includes(uid),
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
