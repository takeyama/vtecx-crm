import * as browserutil from '@/utils/browserutil'
import { UserProfileEntity } from '@/typings/crm'

export interface MyInfo {
  uid: string
  isAdmin: boolean
  isSales: boolean
  isViewer: boolean
  display_name?: string
}

export const fetchMyInfo = async (): Promise<MyInfo> => {
  const data = await browserutil.requestApi('GET', 'crm/user/me', '')
  const rights = JSON.parse(data?.rights ?? data?.feed?.entry?.[0]?.rights ?? '{}')
  const userprofile = data?.userprofile ?? data?.feed?.entry?.[0]?.userprofile
  return {
    uid: rights.uid ?? '',
    isAdmin: rights.isAdmin ?? false,
    isSales: rights.isSales ?? false,
    isViewer: rights.isViewer ?? false,
    display_name: userprofile?.display_name,
  }
}

export const saveMyProfile = async (profile: UserProfileEntity): Promise<void> => {
  await browserutil.requestApi(
    'PUT',
    'crm/user/me',
    '',
    JSON.stringify({ userprofile: profile }),
    { 'Content-Type': 'application/json' }
  )
}
