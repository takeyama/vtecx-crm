'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Alert, CircularProgress, Box } from '@mui/material'
import Loader from '@/components/loader'
import CustomerForm from '../../CustomerForm'
import { fetchCustomer, updateCustomer } from '../../fetcher'
import { CustomerEntity } from '@/typings/crm'
import * as browserutil from '@/utils/browserutil'

export default function CustomerEditPage() {
  const router = useRouter()
  const { cid } = useParams<{ cid: string }>()
  const [initial, setInitial] = useState<CustomerEntity>()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>()

  useEffect(() => {
    ;(async () => {
      try {
        const entry = await fetchCustomer(cid)
        setInitial(entry?.customer ?? {})
      } catch (e: any) {
        setError(browserutil.handleError(e).error.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [cid])

  const handleSubmit = async (data: CustomerEntity) => {
    setSaving(true)
    setError(undefined)
    try {
      await updateCustomer(cid, data)
      router.push(`/customer/${cid}`)
    } catch (e: any) {
      setError(browserutil.handleError(e).error.message)
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={8}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Loader>
      {error && <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>}
      {initial !== undefined && (
        <CustomerForm
          title="顧客編集"
          initial={initial}
          onSubmit={handleSubmit}
          onCancel={() => router.push(`/customer/${cid}`)}
          loading={saving}
        />
      )}
    </Loader>
  )
}
