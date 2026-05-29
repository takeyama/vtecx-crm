'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogContent,
  DialogTitle, Divider, Grid, IconButton, Paper, Stack, Tab, Tabs,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Typography, FormControl, InputLabel, Select, MenuItem,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import {
  CrmEntry, ContactEntity, ActivityEntity,
  CUSTOMER_STATUS_LABEL, CustomerStatus,
  ACTIVITY_TYPE, ACTIVITY_TYPE_LABEL, ActivityType,
  DEAL_STAGE_LABEL, DealStage,
  extractIdFromUri,
} from '@/typings/crm'
import {
  fetchCustomer, deleteCustomer,
  fetchContacts, createContact, updateContact, deleteContact,
  fetchActivities, createActivity, updateActivity, deleteActivity,
  fetchMembers, addMember, removeMember,
} from '../fetcher'
import { fetchDealsByCustomer } from '@/app/(page)/deal/fetcher'
import { fetchUsers, UserRow } from '@/app/(page)/admin/users/fetcher'
import { useAuthContext } from '@/contexts/AuthContext'
import * as browserutil from '@/utils/browserutil'
import Loader from '@/components/loader'
import MainLayout from '@/components/MainLayout'

interface TabPanelProps { children?: React.ReactNode; value: number; index: number }
const TabPanel = ({ children, value, index }: TabPanelProps) => (
  <div hidden={value !== index}>{value === index && <Box pt={2}>{children}</Box>}</div>
)

const emptyContact: ContactEntity = {}
const emptyActivity: ActivityEntity = { activity_type: 'call' }

function CustomerDetailContent() {
  const router = useRouter()
  const { cid } = useParams<{ cid: string }>()
  const { info } = useAuthContext()
  const canWrite = info?.isAdmin || info?.isSales

  const [customer, setCustomer] = useState<CrmEntry | null>(null)
  const [contacts, setContacts] = useState<CrmEntry[]>([])
  const [activities, setActivities] = useState<CrmEntry[]>([])
  const [deals, setDeals] = useState<CrmEntry[]>([])
  const [members, setMembers] = useState<CrmEntry[]>([])
  const [addingMember, setAddingMember] = useState(false)
  const [selectedMemberUid, setSelectedMemberUid] = useState('')
  const [memberSaving, setMemberSaving] = useState(false)
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [tab, setTab] = useState(0)


  const [contactDialog, setContactDialog] = useState<{ open: boolean; entry?: CrmEntry }>({ open: false })
  const [contactForm, setContactForm] = useState<ContactEntity>(emptyContact)
  const [selectedContactUid, setSelectedContactUid] = useState('')
  const [activityDialog, setActivityDialog] = useState<{ open: boolean; entry?: CrmEntry }>({ open: false })
  const [activityForm, setActivityForm] = useState<ActivityEntity>(emptyActivity)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      const [c, ct, ac, dl, mb, userList] = await Promise.all([
        fetchCustomer(cid),
        fetchContacts(cid),
        fetchActivities(cid),
        fetchDealsByCustomer(cid),
        fetchMembers(cid),
        fetchUsers(),
      ])
      setCustomer(c)
      setContacts(ct)
      setActivities(ac)
      setDeals(dl)
      setMembers(mb)
      setUsers(userList)
    } catch (e: any) {
      setError(browserutil.handleError(e).error.message)
    } finally {
      setLoading(false)
    }
  }, [cid])

  useEffect(() => { load() }, [load])

  const handleAddMember = async () => {
    if (!selectedMemberUid) return
    setMemberSaving(true)
    try {
      await addMember(cid, selectedMemberUid)
      setMembers(await fetchMembers(cid))
      setAddingMember(false)
      setSelectedMemberUid('')
    } catch (e: any) {
      setError(browserutil.handleError(e).error.message)
    } finally {
      setMemberSaving(false)
    }
  }

  const handleRemoveMember = async (uid: string) => {
    if (!confirm('この担当営業を外しますか？')) return
    try {
      await removeMember(cid, uid)
      setMembers(await fetchMembers(cid))
    } catch (e: any) {
      setError(browserutil.handleError(e).error.message)
    }
  }

  const handleDeleteCustomer = async () => {
    if (!confirm('この顧客を削除しますか？')) return
    try {
      await deleteCustomer(cid)
      router.push('/customer')
    } catch (e: any) {
      setError(browserutil.handleError(e).error.message)
    }
  }

  const handleContactUserSelect = (uid: string) => {
    setSelectedContactUid(uid)
    const user = users.find((u) => u.uid === uid)
    if (!user) return
    setContactForm((p) => ({
      ...p,
      family_name: user.family_name ?? '',
      given_name: user.given_name ?? '',
      family_name_kana: user.family_name_kana,
      given_name_kana: user.given_name_kana,
      department: user.department,
      title: user.title,
      email: user.email,
      phone: user.phone,
      mobile: user.mobile,
    }))
  }

  const openContactDialog = (entry?: CrmEntry) => {
    setContactForm(entry?.contact ?? emptyContact)
    setSelectedContactUid('')
    setContactDialog({ open: true, entry })
  }
  const handleSaveContact = async () => {
    setSaving(true)
    try {
      if (contactDialog.entry) {
        const ctid = extractIdFromUri(contactDialog.entry.link?.find((l) => l.___rel === 'self')?.___href)
        await updateContact(cid, ctid, contactForm)
      } else {
        await createContact(cid, contactForm)
      }
      setContactDialog({ open: false })
      const updated = await fetchContacts(cid)
      setContacts(updated)
    } catch (e: any) {
      setError(browserutil.handleError(e).error.message)
    } finally {
      setSaving(false)
    }
  }
  const handleDeleteContact = async (entry: CrmEntry) => {
    if (!confirm('この担当者を削除しますか？')) return
    const ctid = extractIdFromUri(entry.link?.find((l) => l.___rel === 'self')?.___href)
    try {
      await deleteContact(cid, ctid)
      setContacts(await fetchContacts(cid))
    } catch (e: any) {
      setError(browserutil.handleError(e).error.message)
    }
  }

  const openActivityDialog = (entry?: CrmEntry) => {
    setActivityForm(entry?.activity ?? emptyActivity)
    setActivityDialog({ open: true, entry })
  }
  const handleSaveActivity = async () => {
    setSaving(true)
    try {
      if (activityDialog.entry) {
        const aid = extractIdFromUri(activityDialog.entry.link?.find((l) => l.___rel === 'self')?.___href)
        await updateActivity(cid, aid, activityForm)
      } else {
        await createActivity(cid, activityForm)
      }
      setActivityDialog({ open: false })
      setActivities(await fetchActivities(cid))
    } catch (e: any) {
      setError(browserutil.handleError(e).error.message)
    } finally {
      setSaving(false)
    }
  }
  const handleDeleteActivity = async (entry: CrmEntry) => {
    if (!confirm('この対応履歴を削除しますか？')) return
    const aid = extractIdFromUri(entry.link?.find((l) => l.___rel === 'self')?.___href)
    try {
      await deleteActivity(cid, aid)
      setActivities(await fetchActivities(cid))
    } catch (e: any) {
      setError(browserutil.handleError(e).error.message)
    }
  }

  if (loading) return <Box display="flex" justifyContent="center" mt={8}><CircularProgress /></Box>

  const c = customer?.customer

  return (
    <Loader>
      <Box p={3}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <IconButton onClick={() => router.push('/customer')}><ArrowBackIcon /></IconButton>
          <Typography variant="h5" flex={1}>{c?.name ?? '—'}</Typography>
          {canWrite && (
            <Button startIcon={<AddIcon />} onClick={() => router.push(`/deal/new?customer=${cid}`)}>
              商談登録
            </Button>
          )}
          {canWrite && (
            <Button startIcon={<EditIcon />} onClick={() => router.push(`/customer/${cid}/edit`)}>
              編集
            </Button>
          )}
          {canWrite && (
            <Button color="error" startIcon={<DeleteIcon />} onClick={handleDeleteCustomer}>
              削除
            </Button>
          )}
        </Box>

        {/* 顧客基本情報 */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary">ステータス</Typography>
              <Box>
                <Chip
                  size="small"
                  label={CUSTOMER_STATUS_LABEL[c?.status as CustomerStatus] ?? c?.status ?? '—'}
                />
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary">業種</Typography>
              <Typography>{c?.industry ?? '—'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary">電話番号</Typography>
              <Typography>{c?.phone ?? '—'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary">住所</Typography>
              <Typography>{c?.address ?? '—'}</Typography>
            </Grid>
            {c?.memo && (
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">メモ</Typography>
                <Typography style={{ whiteSpace: 'pre-wrap' }}>{c.memo}</Typography>
              </Grid>
            )}
          </Grid>
        </Paper>

        {/* 担当営業 */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
            <Typography variant="subtitle2" color="text.secondary">担当営業</Typography>
            {canWrite && !addingMember && (
              <Button size="small" startIcon={<AddIcon />} onClick={() => { setAddingMember(true); setSelectedMemberUid('') }}>
                追加
              </Button>
            )}
          </Box>
          <Box display="flex" flexWrap="wrap" gap={1} alignItems="center">
            {members.map((entry) => {
              const uid = entry.member?.uid ?? ''
              const displayName = users.find((u) => u.uid === uid)?.display_name ?? uid
              return (
                <Chip
                  key={uid}
                  label={displayName}
                  size="small"
                  color="primary"
                  variant="outlined"
                  onDelete={canWrite ? () => handleRemoveMember(uid) : undefined}
                />
              )
            })}
            {members.length === 0 && !addingMember && (
              <Typography variant="body2" color="text.secondary">未設定</Typography>
            )}
            {addingMember && (
              <Box display="flex" gap={1} alignItems="center">
                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <Select
                    value={selectedMemberUid}
                    onChange={(e) => setSelectedMemberUid(e.target.value)}
                    displayEmpty
                  >
                    <MenuItem value="">選択してください</MenuItem>
                    {users
                      .filter((u) => !members.some((m) => m.member?.uid === u.uid))
                      .map((u) => (
                        <MenuItem key={u.uid} value={u.uid}>{u.display_name ?? u.uid}</MenuItem>
                      ))}
                  </Select>
                </FormControl>
                <Button size="small" variant="contained" onClick={handleAddMember} disabled={!selectedMemberUid || memberSaving}>
                  {memberSaving ? '追加中' : '追加'}
                </Button>
                <Button size="small" onClick={() => setAddingMember(false)}>取消</Button>
              </Box>
            )}
          </Box>
        </Paper>

        {/* タブ */}
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label={`担当者 (${contacts.length})`} />
          <Tab label={`対応履歴 (${activities.length})`} />
          <Tab label={`商談 (${deals.length})`} />
        </Tabs>
        <Divider />

        {/* 担当者タブ */}
        <TabPanel value={tab} index={0}>
          {canWrite && (
            <Box display="flex" justifyContent="flex-end" mb={1}>
              <Button startIcon={<AddIcon />} size="small" onClick={() => openContactDialog()}>
                担当者追加
              </Button>
            </Box>
          )}
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>氏名</TableCell>
                  <TableCell>部署・役職</TableCell>
                  <TableCell>メール</TableCell>
                  <TableCell>電話</TableCell>
                  <TableCell align="right">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {contacts.length === 0 ? (
                  <TableRow><TableCell colSpan={5} align="center">担当者がいません</TableCell></TableRow>
                ) : contacts.map((entry) => {
                  const ct = entry.contact!
                  return (
                    <TableRow key={entry.id}>
                      <TableCell>
                        {ct.family_name} {ct.given_name}
                        {ct.is_primary && <Chip size="small" label="メイン" sx={{ ml: 1 }} />}
                      </TableCell>
                      <TableCell>{[ct.department, ct.title].filter(Boolean).join(' / ') || '—'}</TableCell>
                      <TableCell>{ct.email ?? '—'}</TableCell>
                      <TableCell>{ct.phone ?? ct.mobile ?? '—'}</TableCell>
                      {canWrite && (
                        <TableCell align="right">
                          <IconButton size="small" onClick={() => openContactDialog(entry)}><EditIcon fontSize="small" /></IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDeleteContact(entry)}><DeleteIcon fontSize="small" /></IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* 対応履歴タブ */}
        <TabPanel value={tab} index={1}>
          {canWrite && (
            <Box display="flex" justifyContent="flex-end" mb={1}>
              <Button startIcon={<AddIcon />} size="small" onClick={() => openActivityDialog()}>
                対応履歴追加
              </Button>
            </Box>
          )}
          <Stack spacing={1}>
            {activities.length === 0 ? (
              <Typography color="text.secondary" align="center">対応履歴がありません</Typography>
            ) : activities.map((entry) => {
              const ac = entry.activity!
              return (
                <Paper key={entry.id} sx={{ p: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Box display="flex" gap={1} alignItems="center" mb={0.5}>
                        <Chip size="small" label={ACTIVITY_TYPE_LABEL[ac.activity_type as ActivityType] ?? ac.activity_type} />
                        <Typography variant="caption" color="text.secondary">{ac.activity_date}</Typography>
                      </Box>
                      <Typography fontWeight="bold">{ac.subject}</Typography>
                      {ac.description && <Typography variant="body2" color="text.secondary" mt={0.5}>{ac.description}</Typography>}
                      {ac.next_action && (
                        <Box display="flex" alignItems="center" gap={1} mt={0.5} flexWrap="wrap">
                          <Typography variant="body2">
                            <strong>次のアクション:</strong> {ac.next_action}
                          </Typography>
                          {ac.next_action_date && (
                            <Chip size="small" label={ac.next_action_date} color="warning" sx={{ fontSize: '0.7rem' }} />
                          )}
                        </Box>
                      )}
                    </Box>
                    {canWrite && (
                      <Box>
                        <IconButton size="small" onClick={() => openActivityDialog(entry)}><EditIcon fontSize="small" /></IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDeleteActivity(entry)}><DeleteIcon fontSize="small" /></IconButton>
                      </Box>
                    )}
                  </Box>
                </Paper>
              )
            })}
          </Stack>
        </TabPanel>

        {/* 商談タブ */}
        <TabPanel value={tab} index={2}>
          {canWrite && (
            <Box display="flex" justifyContent="flex-end" mb={1}>
              <Button startIcon={<AddIcon />} size="small" onClick={() => router.push(`/deal/new?customer=${cid}`)}>
                商談登録
              </Button>
            </Box>
          )}
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>商談名</TableCell>
                  <TableCell>フェーズ</TableCell>
                  <TableCell align="right">金額（円）</TableCell>
                  <TableCell>予定クローズ日</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {deals.length === 0 ? (
                  <TableRow><TableCell colSpan={4} align="center">商談がありません</TableCell></TableRow>
                ) : deals.map((entry) => {
                  const d = entry.deal!
                  const did = extractIdFromUri(entry.link?.find((l) => l.___rel === 'self')?.___href)
                  return (
                    <TableRow key={entry.id} hover sx={{ cursor: 'pointer' }} onClick={() => router.push(`/deal/${did}`)}>
                      <TableCell>{d.name}</TableCell>
                      <TableCell>
                        <Chip size="small" label={DEAL_STAGE_LABEL[d.stage as DealStage] ?? d.stage} />
                      </TableCell>
                      <TableCell align="right">{d.amount != null ? d.amount.toLocaleString() : '—'}</TableCell>
                      <TableCell>{d.expected_close_date ?? '—'}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* 担当者ダイアログ */}
        <Dialog open={contactDialog.open} onClose={() => setContactDialog({ open: false })} maxWidth="sm" fullWidth>
          <DialogTitle>{contactDialog.entry ? '担当者編集' : '担当者追加'}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} mt={1}>
              {!contactDialog.entry && (
                <FormControl fullWidth required>
                  <InputLabel>ユーザー</InputLabel>
                  <Select
                    value={selectedContactUid}
                    label="ユーザー"
                    onChange={(e) => handleContactUserSelect(e.target.value)}
                  >
                    <MenuItem value="">選択してください</MenuItem>
                    {users.map((u) => (
                      <MenuItem key={u.uid} value={u.uid}>{u.display_name ?? u.uid}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
              <Box display="flex" gap={2}>
                <TextField label="姓" required value={contactForm.family_name ?? ''} onChange={(e) => setContactForm((p) => ({ ...p, family_name: e.target.value }))} fullWidth />
                <TextField label="名" required value={contactForm.given_name ?? ''} onChange={(e) => setContactForm((p) => ({ ...p, given_name: e.target.value }))} fullWidth />
              </Box>
              <TextField label="部署" value={contactForm.department ?? ''} onChange={(e) => setContactForm((p) => ({ ...p, department: e.target.value }))} fullWidth />
              <TextField label="役職" value={contactForm.title ?? ''} onChange={(e) => setContactForm((p) => ({ ...p, title: e.target.value }))} fullWidth />
              <TextField label="メール" type="email" value={contactForm.email ?? ''} onChange={(e) => setContactForm((p) => ({ ...p, email: e.target.value }))} fullWidth />
              <TextField label="電話" value={contactForm.phone ?? ''} onChange={(e) => setContactForm((p) => ({ ...p, phone: e.target.value }))} fullWidth />
              <TextField label="メモ" multiline rows={2} value={contactForm.memo ?? ''} onChange={(e) => setContactForm((p) => ({ ...p, memo: e.target.value }))} fullWidth />
              <Box display="flex" gap={2}>
                <Button variant="contained" onClick={handleSaveContact} disabled={saving}>{saving ? '保存中...' : '保存'}</Button>
                <Button onClick={() => setContactDialog({ open: false })}>キャンセル</Button>
              </Box>
            </Stack>
          </DialogContent>
        </Dialog>

        {/* 対応履歴ダイアログ */}
        <Dialog open={activityDialog.open} onClose={() => setActivityDialog({ open: false })} maxWidth="sm" fullWidth>
          <DialogTitle>{activityDialog.entry ? '対応履歴編集' : '対応履歴追加'}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} mt={1}>
              <FormControl fullWidth>
                <InputLabel>種別</InputLabel>
                <Select value={activityForm.activity_type ?? 'call'} label="種別" onChange={(e) => setActivityForm((p) => ({ ...p, activity_type: e.target.value }))}>
                  {ACTIVITY_TYPE.map((t) => <MenuItem key={t} value={t}>{ACTIVITY_TYPE_LABEL[t]}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField label="件名" required value={activityForm.subject ?? ''} onChange={(e) => setActivityForm((p) => ({ ...p, subject: e.target.value }))} fullWidth />
              <TextField label="実施日" type="date" required value={activityForm.activity_date ?? ''} onChange={(e) => setActivityForm((p) => ({ ...p, activity_date: e.target.value }))} fullWidth slotProps={{ inputLabel: { shrink: true } }} />
              <TextField label="内容詳細" multiline rows={3} value={activityForm.description ?? ''} onChange={(e) => setActivityForm((p) => ({ ...p, description: e.target.value }))} fullWidth />
              <TextField label="結果・成果" value={activityForm.outcome ?? ''} onChange={(e) => setActivityForm((p) => ({ ...p, outcome: e.target.value }))} fullWidth />
              <TextField label="次のアクション" value={activityForm.next_action ?? ''} onChange={(e) => setActivityForm((p) => ({ ...p, next_action: e.target.value }))} fullWidth />
              <TextField label="次アクション日" type="date" value={activityForm.next_action_date ?? ''} onChange={(e) => setActivityForm((p) => ({ ...p, next_action_date: e.target.value || undefined }))} fullWidth slotProps={{ inputLabel: { shrink: true } }} />
              <Box display="flex" gap={2}>
                <Button variant="contained" onClick={handleSaveActivity} disabled={saving}>{saving ? '保存中...' : '保存'}</Button>
                <Button onClick={() => setActivityDialog({ open: false })}>キャンセル</Button>
              </Box>
            </Stack>
          </DialogContent>
        </Dialog>
      </Box>
    </Loader>
  )
}

export default function CustomerDetailPage() {
  return (
    <MainLayout>
      <CustomerDetailContent />
    </MainLayout>
  )
}
