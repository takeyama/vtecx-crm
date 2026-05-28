import * as browserutil from '@/utils/browserutil'
import { UserProfileEntity } from '@/typings/crm'

export interface MyInfo {
  uid: string
  isAdmin: boolean
  isSales: boolean
  isViewer: boolean
  display_name?: string
  email?: string
}

export const fetchMyInfo = async (): Promise<MyInfo> => {
  const data = await browserutil.requestApi('GET', 'crm/user/me', '')
  const userprofile = data?.userprofile ?? data?.feed?.entry?.[0]?.userprofile
  return {
    uid: userprofile?.uid ?? '',
    isAdmin: userprofile?.is_admin ?? false,
    isSales: userprofile?.is_sales ?? false,
    isViewer: userprofile?.is_viewer ?? false,
    display_name: userprofile?.display_name,
    email: userprofile?.email,
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
