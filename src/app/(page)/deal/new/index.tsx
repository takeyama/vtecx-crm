'use client'

import React, { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Alert } from '@mui/material'
import Loader from '@/components/loader'
import DealForm from '../DealForm'
import { createDeal } from '../fetcher'
import { DealEntity, extractIdFromUri } from '@/typings/crm'
import * as browserutil from '@/utils/browserutil'

export default function DealNewPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultCustomerUri = searchParams.get('customer')
    ? `/crm/customer/${searchParams.get('customer')}`
    : ''
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()

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

  return (
    <Loader>
      {error && <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>}
      <DealForm
        title="商談登録"
        defaultCustomerUri={defaultCustomerUri}
        onSubmit={handleSubmit}
        onCancel={() => router.push('/deal')}
        loading={loading}
      />
    </Loader>
  )
}
