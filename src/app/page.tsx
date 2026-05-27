'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box, Button, Card, CardContent, Chip, CircularProgress,
  Grid, Paper, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Typography,
} from '@mui/material'
import PeopleIcon from '@mui/icons-material/People'
import HandshakeIcon from '@mui/icons-material/Handshake'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import MainLayout from '@/components/MainLayout'
import { fetchCustomers } from './(page)/customer/fetcher'
import { fetchDeals } from './(page)/deal/fetcher'
import {
  CrmEntry, DEAL_STAGE_LABEL, DealStage,
  extractIdFromUri,
} from '@/typings/crm'
import * as browserutil from '@/utils/browserutil'

function DashboardContent() {
  const router = useRouter()
  const [customers, setCustomers] = useState<CrmEntry[]>([])
  const [deals, setDeals] = useState<CrmEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const [c, d] = await Promise.all([fetchCustomers(1), fetchDeals(1)])
        setCustomers(c.filter((x) => !x.customer?.is_deleted))
        setDeals(d.filter((x) => !x.deal?.is_deleted))
      } catch (e: any) {
        browserutil.handleError(e)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const activeCustomers = customers.filter((c) => c.customer?.status === 'active').length
  const openDeals = deals.filter((d) => !['closed_won', 'closed_lost'].includes(d.deal?.stage ?? '')).length
  const totalAmount = deals
    .filter((d) => !['closed_won', 'closed_lost'].includes(d.deal?.stage ?? ''))
    .reduce((sum, d) => sum + (d.deal?.amount ?? 0), 0)

  const recentDeals = [...deals]
    .sort((a, b) => (b.deal?.expected_close_date ?? '').localeCompare(a.deal?.expected_close_date ?? ''))
    .slice(0, 5)

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={8}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box p={3}>
      <Typography variant="h5" mb={3}>ダッシュボード</Typography>

      {/* サマリーカード */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <PeopleIcon color="primary" />
                <Typography variant="h6">{activeCustomers}</Typography>
              </Box>
              <Typography color="text.secondary">取引中顧客</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <HandshakeIcon color="warning" />
                <Typography variant="h6">{openDeals}</Typography>
              </Box>
              <Typography color="text.secondary">進行中商談</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <TrendingUpIcon color="success" />
                <Typography variant="h6">¥{totalAmount.toLocaleString()}</Typography>
              </Box>
              <Typography color="text.secondary">進行中商談 合計金額</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* クイックアクション */}
      <Stack direction="row" spacing={2} mb={3}>
        <Button variant="outlined" onClick={() => router.push('/customer')}>顧客一覧</Button>
        <Button variant="outlined" onClick={() => router.push('/customer/new')}>顧客登録</Button>
        <Button variant="outlined" onClick={() => router.push('/deal')}>商談一覧</Button>
        <Button variant="outlined" onClick={() => router.push('/deal/new')}>商談登録</Button>
      </Stack>

      {/* 直近商談 */}
      <Typography variant="h6" mb={1}>進行中商談（クローズ予定日順）</Typography>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>商談名</TableCell>
              <TableCell>フェーズ</TableCell>
              <TableCell align="right">金額</TableCell>
              <TableCell>予定クローズ日</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {recentDeals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">商談がありません</TableCell>
              </TableRow>
            ) : (
              recentDeals.map((entry) => {
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
                      />
                    </TableCell>
                    <TableCell align="right">
                      {d.amount != null ? `¥${d.amount.toLocaleString()}` : '—'}
                    </TableCell>
                    <TableCell>{d.expected_close_date ?? '—'}</TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

export default function DashboardPage() {
  return (
    <MainLayout>
      <DashboardContent />
    </MainLayout>
  )
}
