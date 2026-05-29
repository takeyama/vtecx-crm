'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Alert, Box, Button, Chip, CircularProgress, FormControl, InputLabel,
  MenuItem, Paper, Select, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DownloadIcon from '@mui/icons-material/Download'
import SearchIcon from '@mui/icons-material/Search'
import { CrmEntry, DEAL_STAGE, DEAL_STAGE_LABEL, DealStage, extractIdFromUri } from '@/typings/crm'
import { toCsv, downloadCsv } from '@/utils/csvutil'
import { fetchDeals, DealFilter } from './fetcher'
import { useAuthContext } from '@/contexts/AuthContext'
import Pagination from '@/components/Pagination'
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
  const { info } = useAuthContext()
  const canWrite = info?.isAdmin || info?.isSales
  const [deals, setDeals] = useState<CrmEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [currentPage, setCurrentPage] = useState(1)
  const [lastPageNumber, setLastPageNumber] = useState(0)
  const [hasNext, setHasNext] = useState(false)

  const [filterQ, setFilterQ] = useState('')
  const [filterStage, setFilterStage] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [appliedFilter, setAppliedFilter] = useState<DealFilter>({})

  const load = async (filter: DealFilter, page = 1) => {
    setLoading(true)
    setError(undefined)
    try {
      const { entries, lastPageNumber: lp, hasNext: hn } = await fetchDeals(page, filter)
      setDeals(entries)
      setCurrentPage(page)
      if (page === 1) { setLastPageNumber(lp); setHasNext(hn) }
    } catch (e: any) {
      setError(browserutil.handleError(e).error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load({}) }, [])

  const handleSearch = () => {
    const filter: DealFilter = {
      q: filterQ.trim() || undefined,
      stage: !filterQ.trim() ? (filterStage || undefined) : undefined,
      dateFrom: !filterQ.trim() ? (filterDateFrom || undefined) : undefined,
      dateTo: !filterQ.trim() ? (filterDateTo || undefined) : undefined,
    }
    setAppliedFilter(filter)
    load(filter, 1)
  }

  const handleReset = () => {
    setFilterQ('')
    setFilterStage('')
    setFilterDateFrom('')
    setFilterDateTo('')
    setAppliedFilter({})
    load({}, 1)
  }

  const handleExport = () => {
    const headers = ['商談名', '顧客URI', 'フェーズ', '金額（円）', '受注確度（%）', '予定クローズ日', '実際のクローズ日', '担当者UID', 'メモ']
    const rows = deals.map((entry) => {
      const d = entry.deal!
      return [
        d.name ?? '',
        d.customer_uri ?? '',
        DEAL_STAGE_LABEL[d.stage as DealStage] ?? d.stage ?? '',
        d.amount != null ? String(d.amount) : '',
        d.probability != null ? String(d.probability) : '',
        d.expected_close_date ?? '',
        d.actual_close_date ?? '',
        d.assigned_uid ?? '',
        d.memo ?? '',
      ]
    })
    const today = new Date().toISOString().slice(0, 10)
    downloadCsv(toCsv(headers, rows), `deals_${today}.csv`)
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">商談一覧</Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            disabled={deals.length === 0}
          >
            CSVエクスポート
          </Button>
          {canWrite && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => router.push('/deal/new')}>
              新規登録
            </Button>
          )}
        </Box>
      </Box>

      {/* フィルタ */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
          <TextField
            size="small"
            label="商談名検索"
            value={filterQ}
            onChange={(e) => setFilterQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            sx={{ minWidth: 180 }}
            placeholder="商談名で絞り込み"
          />
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>フェーズ</InputLabel>
            <Select value={filterStage} label="フェーズ" onChange={(e) => setFilterStage(e.target.value)}>
              <MenuItem value="">すべて</MenuItem>
              {DEAL_STAGE.map((s) => (
                <MenuItem key={s} value={s}>{DEAL_STAGE_LABEL[s]}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            size="small"
            label="クローズ日 From"
            type="date"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
            sx={{ minWidth: 160 }}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            size="small"
            label="クローズ日 To"
            type="date"
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
            sx={{ minWidth: 160 }}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <Button variant="contained" size="small" startIcon={<SearchIcon />} onClick={handleSearch}>
            絞り込み
          </Button>
          {(appliedFilter.q || appliedFilter.stage || appliedFilter.dateFrom || appliedFilter.dateTo) && (
            <Button size="small" onClick={handleReset}>リセット</Button>
          )}
        </Box>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box>
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
              </TableRow>
            </TableHead>
            <TableBody>
              {deals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">データがありません</TableCell>
                </TableRow>
              ) : deals.map((entry) => {
                const d = entry.deal!
                const did = extractIdFromUri(entry.link?.find((l) => l.___rel === 'self')?.___href)
                return (
                  <TableRow key={did} hover sx={{ cursor: 'pointer' }} onClick={() => router.push(`/deal/${did}`)}>
                    <TableCell>{d.name}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={DEAL_STAGE_LABEL[d.stage as DealStage] ?? d.stage}
                        color={stageColor[d.stage as DealStage] ?? 'default'}
                      />
                    </TableCell>
                    <TableCell align="right">{d.amount != null ? d.amount.toLocaleString() : '—'}</TableCell>
                    <TableCell align="right">{d.probability != null ? `${d.probability}%` : '—'}</TableCell>
                    <TableCell>{d.expected_close_date ?? '—'}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <Pagination
        currentPage={currentPage}
        lastPageNumber={lastPageNumber}
        hasNext={hasNext}
        onPrev={() => load(appliedFilter, currentPage - 1)}
        onNext={() => load(appliedFilter, currentPage + 1)}
        disabled={loading}
      />
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
