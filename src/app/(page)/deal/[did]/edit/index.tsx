'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Alert, CircularProgress, Box } from '@mui/material'
import Loader from '@/components/loader'
import DealForm from '../../DealForm'
import { fetchDeal, updateDeal } from '../../fetcher'
import { DealEntity } from '@/typings/crm'
import * as browserutil from '@/utils/browserutil'

export default function DealEditPage() {
  const router = useRouter()
  const { did } = useParams<{ did: string }>()
  const [initial, setInitial] = useState<DealEntity>()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>()

  useEffect(() => {
    ;(async () => {
      try {
        const entry = await fetchDeal(did)
        setInitial(entry?.deal ?? {})
      } catch (e: any) {
        setError(browserutil.handleError(e).error.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [did])

  const handleSubmit = async (data: DealEntity) => {
    setSaving(true)
    setError(undefined)
    try {
      await updateDeal(did, data)
      router.push(`/deal/${did}`)
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
        <DealForm
          title="商談編集"
          initial={initial}
          onSubmit={handleSubmit}
          onCancel={() => router.push(`/deal/${did}`)}
          loading={saving}
        />
      )}
    </Loader>
  )
}
