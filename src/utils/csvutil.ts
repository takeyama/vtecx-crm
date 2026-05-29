/**
 * CSV 変換・ダウンロードユーティリティ
 * BOM 付き UTF-8 で出力するため Excel でそのまま開ける
 */

const escapeCell = (value: string): string => {
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export const toCsv = (headers: string[], rows: string[][]): string => {
  const lines = [headers, ...rows].map((row) => row.map(escapeCell).join(','))
  return '﻿' + lines.join('\r\n')
}

export const downloadCsv = (csv: string, filename: string): void => {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
