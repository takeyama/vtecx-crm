'use client'

import React, { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  AppBar, Box, CircularProgress, CssBaseline, Divider, Drawer, IconButton,
  List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Toolbar, Typography,
} from '@mui/material'
import DashboardIcon from '@mui/icons-material/Dashboard'
import PeopleIcon from '@mui/icons-material/People'
import HandshakeIcon from '@mui/icons-material/Handshake'
import SettingsIcon from '@mui/icons-material/Settings'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import MenuIcon from '@mui/icons-material/Menu'
import useLoader from '@/hooks/useLoader'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { AuthProvider } from '@/contexts/AuthContext'

const DRAWER_WIDTH = 220

const NAV_ITEMS = [
  { label: 'ダッシュボード', icon: <DashboardIcon />, path: '/' },
  { label: '顧客一覧', icon: <PeopleIcon />, path: '/customer' },
  { label: '商談一覧', icon: <HandshakeIcon />, path: '/deal' },
]

interface Props {
  children: React.ReactNode
  title?: string
}

export default function MainLayout({ children, title }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { loader } = useLoader(false)
  const { state, info } = useAuthGuard()

  const isActive = (path: string) =>
    path === '/' ? pathname === '/' : pathname.startsWith(path)

  if (state !== 'ok') {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    )
  }

  const bottomItems = [
    ...(info?.isAdmin
      ? [{ label: 'ユーザー管理', icon: <AdminPanelSettingsIcon />, path: '/admin/users' }]
      : []),
    { label: '設定', icon: <SettingsIcon />, path: '/settings' },
  ]

  const drawer = (
    <Box display="flex" flexDirection="column" height="100%">
      <Toolbar>
        <Typography variant="subtitle1" fontWeight="bold" noWrap>CRM</Typography>
      </Toolbar>
      <Divider />
      <List dense>
        {NAV_ITEMS.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              selected={isActive(item.path)}
              onClick={() => { router.push(item.path); setMobileOpen(false) }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Box flex={1} />
      <Divider />
      <List dense>
        {bottomItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              selected={isActive(item.path)}
              onClick={() => { router.push(item.path); setMobileOpen(false) }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  )

  return (
    <AuthProvider value={{ info }}>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <AppBar
          position="fixed"
          sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, display: { sm: 'none' } }}
        >
          <Toolbar>
            <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(!mobileOpen)} sx={{ mr: 1 }}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap>{title ?? 'CRM'}</Typography>
          </Toolbar>
        </AppBar>

        {/* デスクトップ: 固定サイドバー */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
          }}
          open
        >
          {drawer}
        </Drawer>

        {/* モバイル: 一時的サイドバー */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH },
          }}
        >
          {drawer}
        </Drawer>

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            minWidth: 0,
            mt: { xs: 7, sm: 0 },
          }}
        >
          {children}
          {loader && (
            <Box position="fixed" top={0} left={0} width="100%" height="100vh" zIndex={10000}
              display="flex" alignItems="center" justifyContent="center">
              <CircularProgress />
            </Box>
          )}
        </Box>
      </Box>
    </AuthProvider>
  )
}
