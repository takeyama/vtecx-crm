'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Alert } from '@mui/material'
import Loader from '@/components/loader'
import CustomerForm from '../CustomerForm'
import { createCustomer } from '../fetcher'
import { CustomerEntity, extractIdFromUri } from '@/typings/crm'
import * as browserutil from '@/utils/browserutil'

export default function CustomerNewPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()

  const handleSubmit = async (data: CustomerEntity) => {
    setLoading(true)
    setError(undefined)
    try {
      const uri = await createCustomer(data)
      const cid = extractIdFromUri(uri)
      router.push(`/customer/${cid}`)
    } catch (e: any) {
      setError(browserutil.handleError(e).error.message)
      setLoading(false)
    }
  }

  return (
    <Loader>
      {error && <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>}
      <CustomerForm
        title="顧客登録"
        onSubmit={handleSubmit}
        onCancel={() => router.push('/customer')}
        loading={loading}
      />
    </Loader>
  )
}
