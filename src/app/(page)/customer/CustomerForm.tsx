'use client'

import React from 'react'
import {
  Box, Button, FormControl, InputLabel, MenuItem, Select,
  TextField, Typography, Stack,
} from '@mui/material'
import { CustomerEntity, CUSTOMER_STATUS, CUSTOMER_STATUS_LABEL, COMPANY_SIZE, COMPANY_SIZE_LABEL } from '@/typings/crm'

interface Props {
  initial?: CustomerEntity
  onSubmit: (data: CustomerEntity) => Promise<void>
  onCancel: () => void
  loading?: boolean
  title: string
}

export default function CustomerForm({ initial = {}, onSubmit, onCancel, loading, title }: Props) {
  const [form, setForm] = React.useState<CustomerEntity>({ status: 'prospect', ...initial })

  const set = (key: keyof CustomerEntity, value: any) =>
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
            label="顧客名"
            required
            value={form.name ?? ''}
            onChange={(e) => set('name', e.target.value)}
            fullWidth
          />
          <TextField
            label="顧客名カナ"
            value={form.name_kana ?? ''}
            onChange={(e) => set('name_kana', e.target.value)}
            fullWidth
          />
          <FormControl fullWidth>
            <InputLabel>ステータス</InputLabel>
            <Select
              value={form.status ?? 'prospect'}
              label="ステータス"
              onChange={(e) => set('status', e.target.value)}
            >
              {CUSTOMER_STATUS.map((s) => (
                <MenuItem key={s} value={s}>{CUSTOMER_STATUS_LABEL[s]}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="業種"
            value={form.industry ?? ''}
            onChange={(e) => set('industry', e.target.value)}
            fullWidth
          />
          <FormControl fullWidth>
            <InputLabel>企業規模</InputLabel>
            <Select
              value={form.company_size ?? ''}
              label="企業規模"
              onChange={(e) => set('company_size', e.target.value)}
            >
              <MenuItem value="">未設定</MenuItem>
              {COMPANY_SIZE.map((s) => (
                <MenuItem key={s} value={s}>{COMPANY_SIZE_LABEL[s]}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="電話番号"
            value={form.phone ?? ''}
            onChange={(e) => set('phone', e.target.value)}
            fullWidth
          />
          <TextField
            label="メールアドレス（代表）"
            type="email"
            value={form.website ?? ''}
            onChange={(e) => set('website', e.target.value)}
            fullWidth
          />
          <TextField
            label="住所"
            value={form.address ?? ''}
            onChange={(e) => set('address', e.target.value)}
            fullWidth
            multiline
            rows={2}
          />
          <TextField
            label="獲得経路"
            value={form.source ?? ''}
            onChange={(e) => set('source', e.target.value)}
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
