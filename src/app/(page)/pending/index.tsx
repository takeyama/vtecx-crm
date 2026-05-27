'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Box, Button, CircularProgress, Paper, Typography } from '@mui/material'
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'
import { fetchMyInfo } from '@/app/(page)/settings/fetcher'

const POLL_INTERVAL_MS = 10_000

export default function PendingPage() {
  const router = useRouter()
  const [countdown, setCountdown] = useState(POLL_INTERVAL_MS / 1000)
  const [checking, setChecking] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const check = async () => {
    setChecking(true)
    try {
      const info = await fetchMyInfo()
      if (!info.display_name?.trim()) {
        router.replace('/setup')
        return
      }
      const hasRole = info.isAdmin || info.isSales || info.isViewer
      if (hasRole) {
        router.replace('/')
        return
      }
    } catch {
      // ignore — keep waiting
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    check()

    const countdownTimer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          check()
          return POLL_INTERVAL_MS / 1000
        }
        return prev - 1
      })
    }, 1000)

    timerRef.current = countdownTimer
    return () => clearInterval(countdownTimer)
  }, [])

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      height="100vh"
      bgcolor="grey.100"
    >
      <Paper sx={{ p: 4, width: '100%', maxWidth: 440, textAlign: 'center' }}>
        <HourglassEmptyIcon sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />

        <Typography variant="h6" fontWeight="bold" gutterBottom>
          権限付与をお待ちください
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          このアカウントにはまだ権限が割り当てられていません。
          <br />
          管理者に権限付与を依頼してください。
        </Typography>

        <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={3}>
          {checking ? (
            <CircularProgress size={16} />
          ) : (
            <Typography variant="caption" color="text.secondary">
              {countdown}秒後に自動確認します
            </Typography>
          )}
        </Box>

        <Button
          variant="outlined"
          onClick={() => {
            setCountdown(POLL_INTERVAL_MS / 1000)
            check()
          }}
          disabled={checking}
          size="small"
        >
          今すぐ確認する
        </Button>
      </Paper>
    </Box>
  )
}
