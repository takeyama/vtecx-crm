'use client'

import React, { useEffect, useState } from 'react'
import {
  Alert, Box, Chip, CircularProgress, IconButton, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Tooltip, Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import { useRouter } from 'next/navigation'
import MainLayout from '@/components/MainLayout'
import { useAuthContext } from '@/contexts/AuthContext'
import { fetchUsers, updateGroupMembership, UserRow } from './fetcher'
import * as browserutil from '@/utils/browserutil'

type Group = '/_group/sales' | '/_group/viewer'

const GROUP_LABEL: Record<Group, string> = {
  '/_group/sales': '営業担当者',
  '/_group/viewer': '閲覧者',
}

function AdminUsersContent() {
  const router = useRouter()
  const { info } = useAuthContext()
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [updating, setUpdating] = useState<string>()

  useEffect(() => {
    if (info && !info.isAdmin) {
      router.replace('/')
    }
  }, [info])

  const load = async () => {
    try {
      const data = await fetchUsers()
      setUsers(data)
    } catch (e: any) {
      setError(browserutil.handleError(e).error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const toggle = async (uid: string, group: Group, current: boolean) => {
    const key = `${uid}-${group}`
    setUpdating(key)
    setError(undefined)
    try {
      await updateGroupMembership(uid, group, current ? 'remove' : 'add')
      setUsers((prev) =>
        prev.map((u) => {
          if (u.uid !== uid) return u
          return {
            ...u,
            isSales: group === '/_group/sales' ? !current : u.isSales,
            isViewer: group === '/_group/viewer' ? !current : u.isViewer,
          }
        })
      )
    } catch (e: any) {
      setError(browserutil.handleError(e).error.message)
    } finally {
      setUpdating(undefined)
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
    <Box p={3} maxWidth={800}>
      <Typography variant="h5" mb={3}>ユーザー管理</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>UID</TableCell>
              <TableCell>表示名</TableCell>
              <TableCell align="center">営業担当者</TableCell>
              <TableCell align="center">閲覧者</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ color: 'text.secondary' }}>
                  ユーザーが見つかりません
                </TableCell>
              </TableRow>
            )}
            {users.map((user) => (
              <TableRow key={user.uid}>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                  {user.uid}
                </TableCell>
                <TableCell>{user.display_name ?? '—'}</TableCell>
                {(['/_group/sales', '/_group/viewer'] as Group[]).map((group) => {
                  const isMember = group === '/_group/sales' ? user.isSales : user.isViewer
                  const key = `${user.uid}-${group}`
                  const busy = updating === key
                  return (
                    <TableCell key={group} align="center">
                      {isMember ? (
                        <Chip
                          size="small"
                          label={GROUP_LABEL[group]}
                          color="primary"
                          onDelete={busy ? undefined : () => toggle(user.uid, group, true)}
                          deleteIcon={
                            busy ? <CircularProgress size={14} /> : (
                              <Tooltip title="権限を外す">
                                <RemoveIcon fontSize="small" />
                              </Tooltip>
                            )
                          }
                        />
                      ) : (
                        <Tooltip title={`${GROUP_LABEL[group]}権限を付与`}>
                          <span>
                            <IconButton
                              size="small"
                              disabled={busy}
                              onClick={() => toggle(user.uid, group, false)}
                            >
                              {busy ? <CircularProgress size={16} /> : <AddIcon fontSize="small" />}
                            </IconButton>
                          </span>
                        </Tooltip>
                      )}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

export default function AdminUsersPage() {
  return (
    <MainLayout>
      <AdminUsersContent />
    </MainLayout>
  )
}
