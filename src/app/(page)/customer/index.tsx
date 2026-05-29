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
import UploadFileIcon from '@mui/icons-material/UploadFile'
import {
  CrmEntry, CUSTOMER_STATUS, CUSTOMER_STATUS_LABEL, COMPANY_SIZE_LABEL, CustomerStatus, extractIdFromUri,
} from '@/typings/crm'
import { toCsv, downloadCsv } from '@/utils/csvutil'
import { fetchCustomers, fetchCustomersByMember, CustomerFilter } from './fetcher'
import { fetchUsers, UserRow } from '@/app/(page)/admin/users/fetcher'
import CsvImport from './CsvImport'
import { useAuthContext } from '@/contexts/AuthContext'
import Pagination from '@/components/Pagination'
import * as browserutil from '@/utils/browserutil'
import MainLayout from '@/components/MainLayout'

const statusColor: Record<CustomerStatus, 'default' | 'primary' | 'success' | 'error'> = {
  prospect: 'primary',
  active: 'success',
  dormant: 'default',
  lost: 'error',
}

function CustomerListContent() {
  const router = useRouter()
  const { info } = useAuthContext()
  const canWrite = info?.isAdmin || info?.isSales
  const [customers, setCustomers] = useState<CrmEntry[]>([])
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [currentPage, setCurrentPage] = useState(1)
  const [lastPageNumber, setLastPageNumber] = useState(0)
  const [hasNext, setHasNext] = useState(false)

  const [filterQ, setFilterQ] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterMemberUid, setFilterMemberUid] = useState('')
  const [appliedFilter, setAppliedFilter] = useState<CustomerFilter>({})
  const [csvOpen, setCsvOpen] = useState(false)

  const load = async (filter: CustomerFilter, page = 1) => {
    setLoading(true)
    setError(undefined)
    try {
      if (filter.memberUid) {
        // 担当営業フィルタ → エイリアス横断検索（ページング・フィルタ対応）
        const { entries, lastPageNumber: lp, hasNext: hn } = await fetchCustomersByMember(
          filter.memberUid,
          page,
          { status: filter.status, q: filter.q }
        )
        setCustomers(entries)
        setCurrentPage(page)
        if (page === 1) { setLastPageNumber(lp); setHasNext(hn) }
      } else {
        const { entries, lastPageNumber: lp, hasNext: hn } = await fetchCustomers(page, filter)
        setCustomers(entries)
        setCurrentPage(page)
        if (page === 1) { setLastPageNumber(lp); setHasNext(hn) }
      }
    } catch (e: any) {
      setError(browserutil.handleError(e).error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers().then(setUsers)
    load({})
  }, [])

  const handleSearch = () => {
    const filter: CustomerFilter = {
      memberUid: filterMemberUid || undefined,
      q: filterQ.trim() || undefined,
      status: !filterQ.trim() ? (filterStatus || undefined) : undefined,
    }
    setAppliedFilter(filter)
    load(filter, 1)
  }

  const handleReset = () => {
    setFilterQ('')
    setFilterStatus('')
    setFilterMemberUid('')
    setAppliedFilter({})
    load({}, 1)
  }

  const handleExport = () => {
    const headers = ['顧客名', '顧客名カナ', '業種', '企業規模', '電話番号', 'FAX', '郵便番号', '住所', 'Webサイト', 'ステータス', '獲得経路', '年間売上', 'メモ']
    const rows = customers.map((entry) => {
      const c = entry.customer!
      return [
        c.name ?? '',
        c.name_kana ?? '',
        c.industry ?? '',
        COMPANY_SIZE_LABEL[c.company_size ?? ''] ?? c.company_size ?? '',
        c.phone ?? '',
        c.fax ?? '',
        c.postal_code ?? '',
        c.address ?? '',
        c.website ?? '',
        CUSTOMER_STATUS_LABEL[c.status as CustomerStatus] ?? c.status ?? '',
        c.source ?? '',
        c.annual_revenue != null ? String(c.annual_revenue) : '',
        c.memo ?? '',
      ]
    })
    const today = new Date().toISOString().slice(0, 10)
    downloadCsv(toCsv(headers, rows), `customers_${today}.csv`)
  }

  const isFiltered = appliedFilter.q || appliedFilter.status || appliedFilter.memberUid

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">顧客一覧</Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            disabled={customers.length === 0}
          >
            CSVエクスポート
          </Button>
          {canWrite && (
            <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={() => setCsvOpen(true)}>
              CSVインポート
            </Button>
          )}
          {canWrite && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => router.push('/customer/new')}>
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
            label="顧客名検索"
            value={filterQ}
            onChange={(e) => setFilterQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            sx={{ minWidth: 180 }}
            placeholder="顧客名で絞り込み"
          />
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>ステータス</InputLabel>
            <Select value={filterStatus} label="ステータス" onChange={(e) => setFilterStatus(e.target.value)}>
              <MenuItem value="">すべて</MenuItem>
              {CUSTOMER_STATUS.map((s) => (
                <MenuItem key={s} value={s}>{CUSTOMER_STATUS_LABEL[s]}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>担当営業</InputLabel>
            <Select
              value={filterMemberUid}
              label="担当営業"
              onChange={(e) => setFilterMemberUid(e.target.value)}
            >
              <MenuItem value="">すべて</MenuItem>
              {users.map((u) => (
                <MenuItem key={u.uid} value={u.uid}>{u.display_name ?? u.uid}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button variant="contained" size="small" startIcon={<SearchIcon />} onClick={handleSearch}>
            絞り込み
          </Button>
          {isFiltered && <Button size="small" onClick={handleReset}>リセット</Button>}
        </Box>
        {appliedFilter.memberUid && (
          <Typography variant="caption" color="primary" sx={{ mt: 1, display: 'block' }}>
            担当営業フィルタ適用中（エイリアス横断検索 — ステータス・顧客名フィルタ・ページング併用可）
          </Typography>
        )}
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>顧客名</TableCell>
                <TableCell>業種</TableCell>
                <TableCell>電話番号</TableCell>
                <TableCell>ステータス</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">データがありません</TableCell>
                </TableRow>
              ) : customers.map((entry) => {
                const c = entry.customer!
                const cid = extractIdFromUri(entry.link?.find((l) => l.___rel === 'self')?.___href)
                return (
                  <TableRow key={cid} hover sx={{ cursor: 'pointer' }} onClick={() => router.push(`/customer/${cid}`)}>
                    <TableCell>{c.name}</TableCell>
                    <TableCell>{c.industry ?? '—'}</TableCell>
                    <TableCell>{c.phone ?? '—'}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={CUSTOMER_STATUS_LABEL[c.status as CustomerStatus] ?? c.status}
                        color={statusColor[c.status as CustomerStatus] ?? 'default'}
                      />
                    </TableCell>
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

      <CsvImport
        open={csvOpen}
        onClose={() => setCsvOpen(false)}
        onComplete={() => { setCsvOpen(false); load(appliedFilter, 1) }}
      />
    </Box>
  )
}

export default function CustomerListPage() {
  return (
    <MainLayout>
      <CustomerListContent />
    </MainLayout>
  )
}
