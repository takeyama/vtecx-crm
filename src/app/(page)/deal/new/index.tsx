'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Alert, Box, CircularProgress } from '@mui/material'
import Loader from '@/components/loader'
import DealForm from '../DealForm'
import { createDeal } from '../fetcher'
import { CrmEntry, DealEntity, extractIdFromUri } from '@/typings/crm'
import { fetchAllCustomers } from '@/app/(page)/customer/fetcher'
import * as browserutil from '@/utils/browserutil'

export default function DealNewPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const cidParam = searchParams.get('customer')
  const lockedCustomerUri = cidParam ? `/crm/customer/${cidParam}` : undefined

  const [customers, setCustomers] = useState<CrmEntry[]>([])
  const [customersLoading, setCustomersLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()

  useEffect(() => {
    fetchAllCustomers().then(setCustomers).finally(() => setCustomersLoading(false))
  }, [])

  const handleSubmit = async (data: DealEntity) => {
    setLoading(true)
    setError(undefined)
    try {
      const uri = await createDeal(data)
      const did = extractIdFromUri(uri)
      router.push(`/deal/${did}`)
    } catch (e: any) {
      setError(browserutil.handleError(e).error.message)
      setLoading(false)
    }
  }

  if (customersLoading) {
    return <Box display="flex" justifyContent="center" mt={8}><CircularProgress /></Box>
  }

  return (
    <Loader>
      {error && <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>}
      <DealForm
        title="商談登録"
        customers={customers}
        lockedCustomerUri={lockedCustomerUri}
        onSubmit={handleSubmit}
        onCancel={() => router.push(cidParam ? `/customer/${cidParam}` : '/deal')}
        loading={loading}
      />
    </Loader>
  )
}
