'use client'

import React from 'react'
import { Box, Button, Typography } from '@mui/material'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'

interface Props {
  currentPage: number
  lastPageNumber: number
  hasNext: boolean
  onPrev: () => void
  onNext: () => void
  disabled?: boolean
}

export default function Pagination({ currentPage, lastPageNumber, hasNext, onPrev, onNext, disabled }: Props) {
  const isFirst = currentPage <= 1
  const isLast = currentPage >= lastPageNumber && !hasNext

  if (lastPageNumber <= 1 && !hasNext) return null

  return (
    <Box display="flex" alignItems="center" justifyContent="center" gap={2} mt={2}>
      <Button
        size="small"
        variant="outlined"
        startIcon={<NavigateBeforeIcon />}
        onClick={onPrev}
        disabled={isFirst || disabled}
      >
        前へ
      </Button>
      <Typography variant="body2" color="text.secondary">
        {currentPage} / {hasNext ? `${lastPageNumber}+` : lastPageNumber} ページ
      </Typography>
      <Button
        size="small"
        variant="outlined"
        endIcon={<NavigateNextIcon />}
        onClick={onNext}
        disabled={isLast || disabled}
      >
        次へ
      </Button>
    </Box>
  )
}
