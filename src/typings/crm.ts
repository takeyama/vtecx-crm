// CRM entity types
// Note: Once you run `pnpm upload:template && pnpm download:typings`,
// these types will be generated into index.d.ts and this file can be removed.

export interface CustomerEntity {
  name?: string
  name_kana?: string
  industry?: string
  company_size?: string
  phone?: string
  fax?: string
  postal_code?: string
  address?: string
  website?: string
  status?: string
  source?: string
  annual_revenue?: number
  assigned_uid?: string
  memo?: string
  is_deleted?: boolean
}

export interface ContactEntity {
  family_name?: string
  given_name?: string
  family_name_kana?: string
  given_name_kana?: string
  department?: string
  title?: string
  email?: string
  phone?: string
  mobile?: string
  is_primary?: boolean
  memo?: string
  is_deleted?: boolean
}

export interface DealEntity {
  name?: string
  customer_uri?: string
  amount?: number
  probability?: number
  stage?: string
  expected_close_date?: string
  actual_close_date?: string
  contact_uri?: string
  assigned_uid?: string
  memo?: string
  is_deleted?: boolean
}

export interface ActivityEntity {
  activity_type?: string
  subject?: string
  activity_date?: string
  deal_uri?: string
  description?: string
  outcome?: string
  next_action?: string
  contact_uri?: string
  created_uid?: string
  is_deleted?: boolean
}

export interface UserProfileEntity {
  display_name?: string
}

export interface CrmEntry {
  userprofile?: UserProfileEntity
  id?: string
  link?: { ___href?: string; ___rel?: string }[]
  contributor?: { uri?: string; email?: string }[]
  customer?: CustomerEntity
  contact?: ContactEntity
  deal?: DealEntity
  activity?: ActivityEntity
}

// Status options
export const CUSTOMER_STATUS = ['prospect', 'active', 'dormant', 'lost'] as const
export const DEAL_STAGE = ['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'] as const
export const ACTIVITY_TYPE = ['call', 'email', 'meeting', 'demo', 'proposal', 'other'] as const
export const COMPANY_SIZE = ['large', 'medium', 'small', 'startup'] as const

export type CustomerStatus = typeof CUSTOMER_STATUS[number]
export type DealStage = typeof DEAL_STAGE[number]
export type ActivityType = typeof ACTIVITY_TYPE[number]

export const CUSTOMER_STATUS_LABEL: Record<CustomerStatus, string> = {
  prospect: '見込み',
  active: '取引中',
  dormant: '休眠',
  lost: '失注',
}

export const DEAL_STAGE_LABEL: Record<DealStage, string> = {
  lead: 'リード',
  qualified: '商談化',
  proposal: '提案中',
  negotiation: '交渉中',
  closed_won: '受注',
  closed_lost: '失注',
}

export const ACTIVITY_TYPE_LABEL: Record<ActivityType, string> = {
  call: '電話',
  email: 'メール',
  meeting: '商談・訪問',
  demo: 'デモ',
  proposal: '提案',
  other: 'その他',
}

export const COMPANY_SIZE_LABEL: Record<string, string> = {
  large: '大企業',
  medium: '中規模',
  small: '中小企業',
  startup: 'スタートアップ',
}

/** entry.idからパス部分のみ取り出す */
export const extractPath = (entryId?: string): string => {
  if (!entryId) return ''
  return entryId.split(',')[0]
}

/** URIの最後のセグメントをIDとして取り出す */
export const extractIdFromUri = (uri?: string): string => {
  if (!uri) return ''
  const parts = uri.split('/')
  return parts[parts.length - 1]
}

/** エントリのselfリンクを取得 */
export const getSelfHref = (entry: CrmEntry): string => {
  return entry.link?.find((l) => l.___rel === 'self')?.___href ?? ''
}

/** Entry配列の正規化（1件はオブジェクト、2件以上は配列） */
export const normalizeEntries = (entry: any): CrmEntry[] => {
  if (!entry) return []
  return Array.isArray(entry) ? entry : [entry]
}
