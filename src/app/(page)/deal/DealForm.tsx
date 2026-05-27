'use client'

import React from 'react'
import {
  Box, Button, FormControl, InputLabel, MenuItem, Select,
  TextField, Typography, Stack,
} from '@mui/material'
import { DealEntity, DEAL_STAGE, DEAL_STAGE_LABEL } from '@/typings/crm'

interface Props {
  initial?: DealEntity
  onSubmit: (data: DealEntity) => Promise<void>
  onCancel: () => void
  loading?: boolean
  title: string
  defaultCustomerUri?: string
}

export default function DealForm({ initial = {}, onSubmit, onCancel, loading, title, defaultCustomerUri }: Props) {
  const [form, setForm] = React.useState<DealEntity>({
    stage: 'lead',
    customer_uri: defaultCustomerUri ?? '',
    ...initial,
  })

  const set = (key: keyof DealEntity, value: any) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(form)
  }

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
          <TextField
            label="顧客URI"
            required
            value={form.customer_uri ?? ''}
            onChange={(e) => set('customer_uri', e.target.value)}
            fullWidth
            helperText="例: /crm/customer/0000000000001"
          />
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
            label="担当者UID"
            value={form.assigned_uid ?? ''}
            onChange={(e) => set('assigned_uid', e.target.value)}
            fullWidth
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
