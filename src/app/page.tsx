'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress,
  Divider, Grid, Paper, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Typography,
} from '@mui/material'
import PeopleIcon from '@mui/icons-material/People'
import HandshakeIcon from '@mui/icons-material/Handshake'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import EventIcon from '@mui/icons-material/Event'
import MainLayout from '@/components/MainLayout'
import { useAuthContext } from '@/contexts/AuthContext'
import { fetchCustomers } from './(page)/customer/fetcher'
import { fetchDeals } from './(page)/deal/fetcher'
import {
  CrmEntry, DEAL_STAGE, DEAL_STAGE_LABEL, DealStage, extractIdFromUri,
} from '@/typings/crm'
import * as browserutil from '@/utils/browserutil'

const stageColor: Record<DealStage, 'default' | 'primary' | 'info' | 'warning' | 'success' | 'error'> = {
  lead: 'default', qualified: 'info', proposal: 'primary',
  negotiation: 'warning', closed_won: 'success', closed_lost: 'error',
}

function DashboardContent() {
  const router = useRouter()
  const { info } = useAuthContext()
  const canWrite = info?.isAdmin || info?.isSales
  const [customers, setCustomers] = useState<CrmEntry[]>([])
  const [deals, setDeals] = useState<CrmEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()

  useEffect(() => {
    ;(async () => {
      try {
        const [{ entries: c }, { entries: d }] = await Promise.all([fetchCustomers(1), fetchDeals(1)])
        setCustomers(c)
        setDeals(d)
      } catch (e: any) {
        setError(browserutil.handleError(e).error.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const activeCustomers = customers.filter((c) => c.customer?.status === 'active').length
  const openDeals = deals.filter((d) => !['closed_won', 'closed_lost'].includes(d.deal?.stage ?? ''))
  const totalAmount = openDeals.reduce((sum, d) => sum + (d.deal?.amount ?? 0), 0)

  // フェーズ別集計（クローズ済み除く）
  const stageStats = DEAL_STAGE
    .filter((s) => !['closed_won', 'closed_lost'].includes(s))
    .map((stage) => {
      const items = openDeals.filter((d) => d.deal?.stage === stage)
      return {
        stage,
        count: items.length,
        amount: items.reduce((sum, d) => sum + (d.deal?.amount ?? 0), 0),
      }
    })
    .filter((s) => s.count > 0)

  // 今週クローズ予定
  const today = new Date().toISOString().slice(0, 10)
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const upcomingDeals = openDeals
    .filter((d) => {
      const date = d.deal?.expected_close_date
      return date && date >= today && date <= nextWeek
    })
    .sort((a, b) => (a.deal?.expected_close_date ?? '').localeCompare(b.deal?.expected_close_date ?? ''))

  // 直近商談（クローズ予定日順 5件）
  const recentDeals = [...openDeals]
    .filter((d) => d.deal?.expected_close_date)
    .sort((a, b) => (a.deal?.expected_close_date ?? '').localeCompare(b.deal?.expected_close_date ?? ''))
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

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

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
                <Typography variant="h6">{openDeals.length}</Typography>
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

      <Grid container spacing={3} mb={3}>
        {/* フェーズ別集計 */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="subtitle1" fontWeight="bold" mb={1}>フェーズ別集計</Typography>
            {stageStats.length === 0 ? (
              <Typography color="text.secondary" variant="body2">進行中の商談がありません</Typography>
            ) : (
              <Stack spacing={1}>
                {stageStats.map(({ stage, count, amount }) => (
                  <Box key={stage}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box display="flex" alignItems="center" gap={1}>
                        <Chip size="small" label={DEAL_STAGE_LABEL[stage as DealStage]} color={stageColor[stage as DealStage]} />
                        <Typography variant="body2">{count} 件</Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {amount > 0 ? `¥${amount.toLocaleString()}` : '—'}
                      </Typography>
                    </Box>
                    {/* プログレスバー的な幅表示 */}
                    <Box
                      sx={{
                        mt: 0.5, height: 4, borderRadius: 1, bgcolor: 'action.hover',
                        '& > div': {
                          height: '100%', borderRadius: 1, bgcolor: 'primary.main',
                          width: `${Math.round((count / Math.max(openDeals.length, 1)) * 100)}%`,
                        },
                      }}
                    >
                      <div />
                    </Box>
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>

        {/* 今週クローズ予定 */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <EventIcon fontSize="small" color="warning" />
              <Typography variant="subtitle1" fontWeight="bold">今週クローズ予定</Typography>
              {upcomingDeals.length > 0 && (
                <Chip size="small" label={`${upcomingDeals.length} 件`} color="warning" />
              )}
            </Box>
            {upcomingDeals.length === 0 ? (
              <Typography color="text.secondary" variant="body2">今週クローズ予定の商談はありません</Typography>
            ) : (
              <Stack spacing={0.5}>
                {upcomingDeals.map((entry) => {
                  const d = entry.deal!
                  const did = extractIdFromUri(entry.link?.find((l) => l.___rel === 'self')?.___href)
                  return (
                    <Box
                      key={did}
                      display="flex" justifyContent="space-between" alignItems="center"
                      sx={{ cursor: 'pointer', p: 0.75, borderRadius: 1, '&:hover': { bgcolor: 'action.hover' } }}
                      onClick={() => router.push(`/deal/${did}`)}
                    >
                      <Box>
                        <Typography variant="body2" fontWeight="medium">{d.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{d.expected_close_date}</Typography>
                      </Box>
                      <Box textAlign="right">
                        <Chip size="small" label={DEAL_STAGE_LABEL[d.stage as DealStage] ?? d.stage} color={stageColor[d.stage as DealStage]} />
                        {d.amount != null && (
                          <Typography variant="caption" display="block" color="text.secondary">
                            ¥{d.amount.toLocaleString()}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  )
                })}
              </Stack>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Divider sx={{ mb: 3 }} />

      {/* クイックアクション */}
      <Stack direction="row" spacing={2} mb={3} flexWrap="wrap">
        <Button variant="outlined" onClick={() => router.push('/customer')}>顧客一覧</Button>
        {canWrite && <Button variant="outlined" onClick={() => router.push('/customer/new')}>顧客登録</Button>}
        <Button variant="outlined" onClick={() => router.push('/deal')}>商談一覧</Button>
        {canWrite && <Button variant="outlined" onClick={() => router.push('/deal/new')}>商談登録</Button>}
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
                  <TableRow key={did} hover sx={{ cursor: 'pointer' }} onClick={() => router.push(`/deal/${did}`)}>
                    <TableCell>{d.name}</TableCell>
                    <TableCell>
                      <Chip size="small" label={DEAL_STAGE_LABEL[d.stage as DealStage] ?? d.stage} color={stageColor[d.stage as DealStage]} />
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
