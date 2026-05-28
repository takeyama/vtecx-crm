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
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string>()

  useEffect(() => {
    ;(async () => {
      try {
        const data = await fetchMyInfo()
        setInfo(data)
        setDisplayName(data.display_name ?? '')
      } catch (e: any) {
        setError(browserutil.handleError(e).error.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setSuccess(false)
    setError(undefined)
    try {
      await saveMyProfile({ display_name: displayName })
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

        {/* 表示名設定 */}
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          プロフィール
        </Typography>
        <Stack spacing={2}>
          <TextField
            label="表示名"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            fullWidth
            helperText="顧客詳細や商談画面に表示される名前です"
          />
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || !displayName.trim()}
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
