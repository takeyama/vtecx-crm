'use client'

import React, { useRef, useState } from 'react'
import {
  Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, LinearProgress, Paper, Table, TableBody, TableCell, TableHead,
  TableRow, Typography,
} from '@mui/material'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import DownloadIcon from '@mui/icons-material/Download'
import { CustomerEntity } from '@/typings/crm'
import { bulkCreateCustomers } from './fetcher'
import * as browserutil from '@/utils/browserutil'

// ---------- 定数 ----------

const COLUMN_MAP: Record<string, keyof CustomerEntity> = {
  '顧客名': 'name',
  '顧客名カナ': 'name_kana',
  '業種': 'industry',
  '企業規模': 'company_size',
  '電話番号': 'phone',
  'FAX': 'fax',
  '郵便番号': 'postal_code',
  '住所': 'address',
  'Webサイト': 'website',
  'ステータス': 'status',
  '獲得経路': 'source',
  '年間売上': 'annual_revenue',
  'メモ': 'memo',
}

const STATUS_MAP: Record<string, string> = {
  '見込み': 'prospect', '取引中': 'active', '休眠': 'dormant', '失注': 'lost',
  'prospect': 'prospect', 'active': 'active', 'dormant': 'dormant', 'lost': 'lost',
}

const COMPANY_SIZE_MAP: Record<string, string> = {
  '大企業': 'large', '中規模': 'medium', '中小企業': 'small', 'スタートアップ': 'startup',
  'large': 'large', 'medium': 'medium', 'small': 'small', 'startup': 'startup',
}

// BOM付きUTF-8 / Shift-JIS対応テンプレート
const TEMPLATE_CSV =
  '顧客名,顧客名カナ,業種,企業規模,電話番号,FAX,郵便番号,住所,Webサイト,ステータス,獲得経路,年間売上,メモ\n' +
  '株式会社サンプル,カブシキガイシャサンプル,IT,大企業,03-1234-5678,,100-0001,東京都千代田区1-1,https://example.com,見込み,web,,初回コンタクト済み\n'

// ---------- CSV パーサー ----------

const parseCSVLine = (line: string): string[] => {
  const result: string[] = []
  let cur = ''
  let inQ = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++ }
      else inQ = !inQ
    } else if (ch === ',' && !inQ) {
      result.push(cur.trim()); cur = ''
    } else {
      cur += ch
    }
  }
  result.push(cur.trim())
  return result
}

interface ParseError { row: number; message: string }
interface ParseResult { rows: CustomerEntity[]; errors: ParseError[] }

const parseCSV = (text: string): ParseResult => {
  const lines = text.replace(/^﻿/, '').replace(/\r/g, '').split('\n').filter(Boolean)
  if (lines.length < 2) return { rows: [], errors: [{ row: 0, message: 'データ行がありません' }] }

  const headers = parseCSVLine(lines[0])
  const rows: CustomerEntity[] = []
  const errors: ParseError[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    const entry: Record<string, any> = {}

    headers.forEach((header, idx) => {
      const field = COLUMN_MAP[header]
      if (!field) return
      const raw = (values[idx] ?? '').trim()
      if (!raw) return

      if (field === 'status') {
        entry[field] = STATUS_MAP[raw] ?? 'prospect'
      } else if (field === 'company_size') {
        entry[field] = COMPANY_SIZE_MAP[raw] ?? raw
      } else if (field === 'annual_revenue') {
        const n = parseInt(raw.replace(/,/g, ''), 10)
        if (!isNaN(n)) entry[field] = n
      } else {
        entry[field] = raw
      }
    })

    if (!entry.name) {
      errors.push({ row: i + 1, message: `${i + 1}行目: 顧客名が空のためスキップ` })
      continue
    }
    if (!entry.status) entry.status = 'prospect'
    rows.push(entry as CustomerEntity)
  }

  return { rows, errors }
}

// ---------- コンポーネント ----------

interface Props {
  open: boolean
  onClose: () => void
  onComplete: () => void
}

interface ImportResult {
  success: number
  failed: { row: number; name: string; message: string }[]
}

export default function CsvImport({ open, onClose, onComplete }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [parsed, setParsed] = useState<ParseResult | null>(null)
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<ImportResult | null>(null)

  const reset = () => {
    setParsed(null)
    setImporting(false)
    setProgress(0)
    setResult(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleClose = () => { if (!importing) { reset(); onClose() } }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const buffer = ev.target?.result as ArrayBuffer
      // UTF-8 で試みて置換文字（�）が含まれる場合のみ Shift-JIS にフォールバック
      const utf8Text = new TextDecoder('utf-8').decode(buffer)
      const text = utf8Text.includes('�')
        ? new TextDecoder('shift-jis').decode(buffer)
        : utf8Text
      setParsed(parseCSV(text))
      setResult(null)
    }
    reader.readAsArrayBuffer(file)
  }

  const handleImport = async () => {
    if (!parsed || parsed.rows.length === 0) return
    setImporting(true)
    setProgress(0)

    try {
      setProgress(50)
      const count = await bulkCreateCustomers(parsed.rows)
      setProgress(100)
      setResult({ success: count, failed: [] })
      if (count > 0) onComplete()
    } catch (e: any) {
      setProgress(100)
      const message = browserutil.handleError(e).error.message
      setResult({ success: 0, failed: [{ row: 0, name: '', message }] })
    } finally {
      setImporting(false)
    }
  }

  const downloadTemplate = () => {
    const blob = new Blob(['﻿' + TEMPLATE_CSV], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'customer_template.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const preview = parsed?.rows.slice(0, 5) ?? []

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>顧客 CSV インポート</DialogTitle>
      <DialogContent>
        {/* ヘッダー */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="body2" color="text.secondary">
            UTF-8 / Shift-JIS の CSV ファイルに対応しています。
          </Typography>
          <Button size="small" startIcon={<DownloadIcon />} onClick={downloadTemplate}>
            テンプレートをダウンロード
          </Button>
        </Box>

        {/* ファイル選択エリア */}
        <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleFile} />
        <Box
          sx={{
            border: '2px dashed', borderColor: 'divider', borderRadius: 1, p: 3,
            textAlign: 'center', cursor: 'pointer', mb: 2,
            '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
          }}
          onClick={() => fileRef.current?.click()}
        >
          <UploadFileIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 0.5 }} />
          <Typography color="text.secondary">クリックして CSV ファイルを選択</Typography>
        </Box>

        {/* パースエラー */}
        {!!parsed?.errors.length && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {parsed.errors.map((e, i) => <div key={i}>{e.message}</div>)}
          </Alert>
        )}

        {/* プレビュー */}
        {!result && parsed && parsed.rows.length > 0 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              プレビュー（{parsed.rows.length} 件）{parsed.rows.length > 5 && ' — 先頭 5 件を表示'}
            </Typography>
            <Paper variant="outlined" sx={{ overflow: 'auto', maxHeight: 220 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>顧客名</TableCell>
                    <TableCell>業種</TableCell>
                    <TableCell>電話番号</TableCell>
                    <TableCell>ステータス</TableCell>
                    <TableCell>メモ</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {preview.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.industry ?? '—'}</TableCell>
                      <TableCell>{row.phone ?? '—'}</TableCell>
                      <TableCell>{row.status}</TableCell>
                      <TableCell sx={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {row.memo ?? '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          </Box>
        )}

        {/* プログレス */}
        {importing && (
          <Box mt={2}>
            <Typography variant="body2" gutterBottom>
              {progress}% 完了（{Math.round(parsed!.rows.length * progress / 100)} / {parsed!.rows.length} 件）
            </Typography>
            <LinearProgress variant="determinate" value={progress} />
          </Box>
        )}

        {/* インポート結果 */}
        {result && (
          <Box mt={2}>
            <Alert severity={result.failed.length === 0 ? 'success' : 'warning'}>
              インポート完了 — 成功 <strong>{result.success}</strong> 件
              {result.failed.length > 0 && `、失敗 ${result.failed.length} 件`}
            </Alert>
            {result.failed.length > 0 && (
              <Box mt={1}>
                {result.failed.map((f, i) => (
                  <Typography key={i} variant="body2" color="error">
                    {f.message}
                  </Typography>
                ))}
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={importing}>閉じる</Button>
        {parsed && parsed.rows.length > 0 && !result && (
          <Button
            variant="contained"
            onClick={handleImport}
            disabled={importing}
            startIcon={importing ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {importing ? 'インポート中...' : `${parsed.rows.length} 件をインポート`}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}
