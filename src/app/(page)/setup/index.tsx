'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Alert, Box, Button, CircularProgress, Paper, TextField, Typography,
} from '@mui/material'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import { fetchMyInfo, saveMyProfile } from '@/app/(page)/settings/fetcher'
import * as browserutil from '@/utils/browserutil'

export default function SetupPage() {
  const router = useRouter()
  const [displayName, setDisplayName] = useState('')
  const [saving, setSaving] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState<string>()

  useEffect(() => {
    ;(async () => {
      try {
        const info = await fetchMyInfo()
        if (info.display_name?.trim()) {
          // Already set up — go to appropriate page
          const hasRole = info.isAdmin || info.isSales || info.isViewer
          router.replace(hasRole ? '/' : '/pending')
          return
        }
      } catch {
        // ignore
      } finally {
        setChecking(false)
      }
    })()
  }, [])

  const handleSave = async () => {
    if (!displayName.trim()) return
    setSaving(true)
    setError(undefined)
    try {
      await saveMyProfile({ display_name: displayName.trim() })
      const info = await fetchMyInfo()
      const hasRole = info.isAdmin || info.isSales || info.isViewer
      router.replace(hasRole ? '/' : '/pending')
    } catch (e: any) {
      setError(browserutil.handleError(e).error.message)
      setSaving(false)
    }
  }

  if (checking) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      height="100vh"
      bgcolor="grey.100"
    >
      <Paper sx={{ p: 4, width: '100%', maxWidth: 400 }}>
        <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
          <AccountCircleIcon sx={{ fontSize: 56, color: 'primary.main', mb: 1 }} />
          <Typography variant="h6" fontWeight="bold">プロフィール設定</Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center" mt={1}>
            CRMで使用する表示名を設定してください。
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <TextField
          label="表示名"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          fullWidth
          autoFocus
          helperText="顧客詳細や商談画面に表示される名前です"
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          sx={{ mb: 2 }}
        />
        <Button
          variant="contained"
          fullWidth
          size="large"
          onClick={handleSave}
          disabled={saving || !displayName.trim()}
        >
          {saving ? '保存中...' : '次へ'}
        </Button>
      </Paper>
    </Box>
  )
}
