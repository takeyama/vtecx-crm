'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  Alert, Box, Button, Chip, CircularProgress, Grid, IconButton,
  Paper, Typography,
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { CrmEntry, DEAL_STAGE_LABEL, DealStage, extractIdFromUri } from '@/typings/crm'
import { fetchDeal, deleteDeal } from '../fetcher'
import * as browserutil from '@/utils/browserutil'
import Loader from '@/components/loader'

export default function DealDetailPage() {
  const router = useRouter()
  const { did } = useParams<{ did: string }>()

  const [deal, setDeal] = useState<CrmEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()

  const load = useCallback(async () => {
    try {
      setDeal(await fetchDeal(did))
    } catch (e: any) {
      setError(browserutil.handleError(e).error.message)
    } finally {
      setLoading(false)
    }
  }, [did])

  useEffect(() => { load() }, [load])

  const handleDelete = async () => {
    if (!confirm('この商談を削除しますか？')) return
    try {
      await deleteDeal(did)
      router.push('/deal')
    } catch (e: any) {
      setError(browserutil.handleError(e).error.message)
    }
  }

  if (loading) return <Box display="flex" justifyContent="center" mt={8}><CircularProgress /></Box>

  const d = deal?.deal
  const customerCid = extractIdFromUri(d?.customer_uri)

  return (
    <Loader>
      <Box p={3}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <IconButton onClick={() => router.push('/deal')}><ArrowBackIcon /></IconButton>
          <Typography variant="h5" flex={1}>{d?.name ?? '—'}</Typography>
          <Button startIcon={<EditIcon />} onClick={() => router.push(`/deal/${did}/edit`)}>
            編集
          </Button>
          <Button color="error" startIcon={<DeleteIcon />} onClick={handleDelete}>
            削除
          </Button>
        </Box>

        <Paper sx={{ p: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary">フェーズ</Typography>
              <Box>
                <Chip
                  size="small"
                  label={DEAL_STAGE_LABEL[d?.stage as DealStage] ?? d?.stage ?? '—'}
                />
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary">金額</Typography>
              <Typography>
                {d?.amount != null ? `¥${d.amount.toLocaleString()}` : '—'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary">受注確度</Typography>
              <Typography>{d?.probability != null ? `${d.probability}%` : '—'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary">予定クローズ日</Typography>
              <Typography>{d?.expected_close_date ?? '—'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary">担当者UID</Typography>
              <Typography>{d?.assigned_uid ?? '—'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary">顧客</Typography>
              <Typography>
                {customerCid ? (
                  <Button
                    variant="text"
                    size="small"
                    sx={{ p: 0, minWidth: 0 }}
                    onClick={() => router.push(`/customer/${customerCid}`)}
                  >
                    {d?.customer_uri}
                  </Button>
                ) : '—'}
              </Typography>
            </Grid>
            {d?.memo && (
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">メモ</Typography>
                <Typography style={{ whiteSpace: 'pre-wrap' }}>{d.memo}</Typography>
              </Grid>
            )}
          </Grid>
        </Paper>
      </Box>
    </Loader>
  )
}
