'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box, Button, Chip, CircularProgress, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Typography, Alert,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { CrmEntry, CUSTOMER_STATUS_LABEL, CustomerStatus, extractIdFromUri } from '@/typings/crm'
import { fetchCustomers } from './fetcher'
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
  const [customers, setCustomers] = useState<CrmEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()

  useEffect(() => {
    ;(async () => {
      try {
        const data = await fetchCustomers(1)
        setCustomers(data.filter((c) => !c.customer?.is_deleted))
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
        <Typography variant="h5">顧客一覧</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => router.push('/customer/new')}
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
                <TableCell>顧客名</TableCell>
                <TableCell>業種</TableCell>
                <TableCell>電話番号</TableCell>
                <TableCell>ステータス</TableCell>
                <TableCell>担当者UID</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">データがありません</TableCell>
                </TableRow>
              ) : (
                customers.map((entry) => {
                  const c = entry.customer!
                  const cid = extractIdFromUri(entry.link?.find((l) => l.___rel === 'self')?.___href)
                  return (
                    <TableRow
                      key={cid}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => router.push(`/customer/${cid}`)}
                    >
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
                      <TableCell>{c.assigned_uid ?? '—'}</TableCell>
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

export default function CustomerListPage() {
  return (
    <MainLayout>
      <CustomerListContent />
    </MainLayout>
  )
}
