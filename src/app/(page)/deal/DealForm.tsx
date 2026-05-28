'use client'

import React from 'react'
import {
  Box, Button, FormControl, InputLabel, MenuItem, Select,
  TextField, Typography, Stack,
} from '@mui/material'
import { CrmEntry, DealEntity, DEAL_STAGE, DEAL_STAGE_LABEL, extractIdFromUri, getSelfHref } from '@/typings/crm'
import { fetchContacts } from '@/app/(page)/customer/fetcher'

interface Props {
  initial?: DealEntity
  onSubmit: (data: DealEntity) => Promise<void>
  onCancel: () => void
  loading?: boolean
  title: string
  customers: CrmEntry[]
  lockedCustomerUri?: string
}

export default function DealForm({ initial = {}, onSubmit, onCancel, loading, title, customers, lockedCustomerUri }: Props) {
  const [form, setForm] = React.useState<DealEntity>({
    stage: 'lead',
    customer_uri: lockedCustomerUri ?? '',
    ...initial,
  })
  const [contacts, setContacts] = React.useState<CrmEntry[]>([])
  const [contactsLoading, setContactsLoading] = React.useState(false)
  const isFirstLoad = React.useRef(true)

  const set = (key: keyof DealEntity, value: any) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  React.useEffect(() => {
    const cid = extractIdFromUri(form.customer_uri)
    if (!cid) {
      setContacts([])
      return
    }
    if (!isFirstLoad.current) {
      setForm((prev) => ({ ...prev, contact_uri: undefined }))
    }
    isFirstLoad.current = false
    setContactsLoading(true)
    fetchContacts(cid).then(setContacts).finally(() => setContactsLoading(false))
  }, [form.customer_uri])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(form)
  }

  const lockedCustomerName = lockedCustomerUri
    ? (customers.find((e) => getSelfHref(e) === lockedCustomerUri)?.customer?.name ?? lockedCustomerUri)
    : ''

  const contactDisabled = !form.customer_uri || contactsLoading

  return (
    <Box p={3} maxWidth={600}>
      <Typography variant="h5" mb={3}>{title}</Typography>
      <form onSubmit={handleSubmit}>
        <Stack spacing={2}>
          <TextField
            label="商談名"
            required
            value={form.name ?? ''}
            onChange={(e) => set('name', e.target.value)}
            fullWidth
          />

          {lockedCustomerUri ? (
            <TextField
              label="顧客"
              value={lockedCustomerName}
              disabled
              fullWidth
            />
          ) : (
            <FormControl fullWidth required>
              <InputLabel>顧客</InputLabel>
              <Select
                value={form.customer_uri ?? ''}
                label="顧客"
                onChange={(e) => set('customer_uri', e.target.value)}
              >
                {customers.map((entry) => {
                  const href = getSelfHref(entry)
                  return (
                    <MenuItem key={href} value={href}>
                      {entry.customer?.name ?? href}
                    </MenuItem>
                  )
                })}
              </Select>
            </FormControl>
          )}

          <FormControl fullWidth disabled={contactDisabled}>
            <InputLabel>担当者</InputLabel>
            <Select
              value={form.contact_uri ?? ''}
              label="担当者"
              onChange={(e) => set('contact_uri', e.target.value || undefined)}
            >
              <MenuItem value="">（なし）</MenuItem>
              {contacts.map((entry) => {
                const href = getSelfHref(entry)
                const ct = entry.contact
                const name = `${ct?.family_name ?? ''} ${ct?.given_name ?? ''}`.trim()
                return (
                  <MenuItem key={href} value={href}>
                    {name || href}
                  </MenuItem>
                )
              })}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>フェーズ</InputLabel>
            <Select
              value={form.stage ?? 'lead'}
              label="フェーズ"
              onChange={(e) => set('stage', e.target.value)}
            >
              {DEAL_STAGE.map((s) => (
                <MenuItem key={s} value={s}>{DEAL_STAGE_LABEL[s]}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="金額（円）"
            type="number"
            value={form.amount ?? ''}
            onChange={(e) => set('amount', e.target.value ? Number(e.target.value) : undefined)}
            fullWidth
          />
          <TextField
            label="受注確度（%）"
            type="number"
            inputProps={{ min: 0, max: 100 }}
            value={form.probability ?? ''}
            onChange={(e) => set('probability', e.target.value ? Number(e.target.value) : undefined)}
            fullWidth
          />
          <TextField
            label="予定クローズ日"
            type="date"
            value={form.expected_close_date ?? ''}
            onChange={(e) => set('expected_close_date', e.target.value)}
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label="メモ"
            value={form.memo ?? ''}
            onChange={(e) => set('memo', e.target.value)}
            fullWidth
            multiline
            rows={3}
          />
          <Box display="flex" gap={2} mt={1}>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? '保存中...' : '保存'}
            </Button>
            <Button variant="outlined" onClick={onCancel} disabled={loading}>
              キャンセル
            </Button>
          </Box>
        </Stack>
      </form>
    </Box>
  )
}
