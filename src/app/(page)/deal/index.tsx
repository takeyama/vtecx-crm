'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Alert, Box, Button, Chip, CircularProgress, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { CrmEntry, DEAL_STAGE_LABEL, DealStage, extractIdFromUri } from '@/typings/crm'
import { fetchDeals } from './fetcher'
import * as browserutil from '@/utils/browserutil'
import MainLayout from '@/components/MainLayout'

const stageColor: Record<DealStage, 'default' | 'primary' | 'info' | 'warning' | 'success' | 'error'> = {
  lead: 'default',
  qualified: 'info',
  proposal: 'primary',
  negotiation: 'warning',
  closed_won: 'success',
  closed_lost: 'error',
}

function DealListContent() {
  const router = useRouter()
  const [deals, setDeals] = useState<CrmEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()

  useEffect(() => {
    ;(async () => {
      try {
        const data = await fetchDeals(1)
        setDeals(data.filter((d) => !d.deal?.is_deleted))
      } catch (e: any) {
        setError(browserutil.handleError(e).error.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">商談一覧</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => router.push('/deal/new')}
        >
          新規登録
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>商談名</TableCell>
                <TableCell>フェーズ</TableCell>
                <TableCell align="right">金額（円）</TableCell>
                <TableCell align="right">確度</TableCell>
                <TableCell>予定クローズ日</TableCell>
                <TableCell>担当者UID</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {deals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">データがありません</TableCell>
                </TableRow>
              ) : (
                deals.map((entry) => {
                  const d = entry.deal!
                  const did = extractIdFromUri(entry.link?.find((l) => l.___rel === 'self')?.___href)
                  return (
                    <TableRow
                      key={did}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => router.push(`/deal/${did}`)}
                    >
                      <TableCell>{d.name}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={DEAL_STAGE_LABEL[d.stage as DealStage] ?? d.stage}
                          color={stageColor[d.stage as DealStage] ?? 'default'}
                        />
                      </TableCell>
                      <TableCell align="right">
                        {d.amount != null ? d.amount.toLocaleString() : '—'}
                      </TableCell>
                      <TableCell align="right">
                        {d.probability != null ? `${d.probability}%` : '—'}
                      </TableCell>
                      <TableCell>{d.expected_close_date ?? '—'}</TableCell>
                      <TableCell>{d.assigned_uid ?? '—'}</TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  )
}

export default function DealListPage() {
  return (
    <MainLayout>
      <DealListContent />
    </MainLayout>
  )
}
