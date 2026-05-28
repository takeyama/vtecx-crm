'use client'

import React, { useEffect, useState } from 'react'
import {
  Alert, Box, Button, Chip, CircularProgress, Divider,
  Paper, Stack, TextField, Typography,
} from '@mui/material'
import MainLayout from '@/components/MainLayout'
import { fetchMyInfo, saveMyProfile, MyInfo } from './fetcher'
import * as browserutil from '@/utils/browserutil'

const ROLE_LABEL: Record<string, string> = {
  isAdmin: '管理者',
  isSales: '営業担当者',
  isViewer: '閲覧者',
}

function SettingsContent() {
  const [info, setInfo] = useState<MyInfo | null>(null)
  const [form, setForm] = useState({
    display_name: '',
    family_name: '',
    given_name: '',
    family_name_kana: '',
    given_name_kana: '',
    department: '',
    title: '',
    phone: '',
    mobile: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string>()

  useEffect(() => {
    ;(async () => {
      try {
        const data = await fetchMyInfo()
        setInfo(data)
        setForm({
          display_name: data.display_name ?? '',
          family_name: data.family_name ?? '',
          given_name: data.given_name ?? '',
          family_name_kana: data.family_name_kana ?? '',
          given_name_kana: data.given_name_kana ?? '',
          department: data.department ?? '',
          title: data.title ?? '',
          phone: data.phone ?? '',
          mobile: data.mobile ?? '',
        })
      } catch (e: any) {
        setError(browserutil.handleError(e).error.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const set = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleSave = async () => {
    setSaving(true)
    setSuccess(false)
    setError(undefined)
    try {
      await saveMyProfile({
        display_name: form.display_name,
        family_name: form.family_name || undefined,
        given_name: form.given_name || undefined,
        family_name_kana: form.family_name_kana || undefined,
        given_name_kana: form.given_name_kana || undefined,
        department: form.department || undefined,
        title: form.title || undefined,
        phone: form.phone || undefined,
        mobile: form.mobile || undefined,
        email: info?.email || undefined,
      })
      setSuccess(true)
    } catch (e: any) {
      setError(browserutil.handleError(e).error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={8}>
        <CircularProgress />
      </Box>
    )
  }

  const roles = ['isAdmin', 'isSales', 'isViewer'].filter((r) => info?.[r as keyof MyInfo])

  return (
    <Box p={3} maxWidth={500}>
      <Typography variant="h5" mb={3}>ユーザー設定</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>保存しました</Alert>}

      <Paper sx={{ p: 3 }}>
        {/* アカウント情報 */}
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          アカウント情報
        </Typography>
        <Stack spacing={1} mb={2}>
          <Box>
            <Typography variant="caption" color="text.secondary">UID</Typography>
            <Typography fontFamily="monospace">{info?.uid ?? '—'}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">メールアドレス</Typography>
            <Typography>{info?.email ?? '—'}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">権限</Typography>
            <Box display="flex" gap={1} mt={0.5} flexWrap="wrap">
              {roles.length > 0 ? (
                roles.map((r) => (
                  <Chip key={r} size="small" label={ROLE_LABEL[r]} color="primary" />
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">未割り当て</Typography>
              )}
            </Box>
          </Box>
        </Stack>

        <Divider sx={{ my: 2 }} />

        {/* プロフィール */}
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          プロフィール
        </Typography>
        <Stack spacing={2}>
          <TextField
            label="表示名"
            required
            value={form.display_name}
            onChange={(e) => set('display_name', e.target.value)}
            fullWidth
            helperText="顧客詳細や商談画面に表示される名前です"
          />
          <Box display="flex" gap={2}>
            <TextField label="姓" value={form.family_name} onChange={(e) => set('family_name', e.target.value)} fullWidth />
            <TextField label="名" value={form.given_name} onChange={(e) => set('given_name', e.target.value)} fullWidth />
          </Box>
          <Box display="flex" gap={2}>
            <TextField label="姓カナ" value={form.family_name_kana} onChange={(e) => set('family_name_kana', e.target.value)} fullWidth />
            <TextField label="名カナ" value={form.given_name_kana} onChange={(e) => set('given_name_kana', e.target.value)} fullWidth />
          </Box>
          <TextField label="部署" value={form.department} onChange={(e) => set('department', e.target.value)} fullWidth />
          <TextField label="役職" value={form.title} onChange={(e) => set('title', e.target.value)} fullWidth />
          <TextField label="電話番号" value={form.phone} onChange={(e) => set('phone', e.target.value)} fullWidth />
          <TextField label="携帯番号" value={form.mobile} onChange={(e) => set('mobile', e.target.value)} fullWidth />
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || !form.display_name.trim()}
          >
            {saving ? '保存中...' : '保存'}
          </Button>
        </Stack>
      </Paper>
    </Box>
  )
}

export default function SettingsPage() {
  return (
    <MainLayout>
      <SettingsContent />
    </MainLayout>
  )
}
