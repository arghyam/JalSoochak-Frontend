import { Box, Stack } from '@chakra-ui/react'
import { Toast, type ToastType } from './toast'

export interface ToastItem {
  id: string
  message: string
  type: ToastType
}

export type ToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-left-quarter'
  | 'bottom-center'
  | 'bottom-right'

const POSITION_STYLES: Record<
  ToastPosition,
  { top?: number; bottom?: number; left?: number | string; right?: number; transform?: string }
> = {
  'top-left': { top: 28, left: 12 },
  'top-center': { top: 28, left: '50%', transform: 'translateX(-50%)' },
  'top-right': { top: 28, right: 12 },
  'bottom-left': { bottom: 28, left: 12 },
  'bottom-left-quarter': { bottom: 28, left: '25%', transform: 'translateX(-50%)' },
  'bottom-center': { bottom: 28, left: '50%', transform: 'translateX(-50%)' },
  'bottom-right': { bottom: 28, right: 12 },
}

interface ToastContainerProps {
  toasts: ToastItem[]
  onRemove: (id: string) => void
  position?: ToastPosition
}

export function ToastContainer({
  toasts,
  onRemove,
  position = 'bottom-right',
}: ToastContainerProps) {
  const styles = POSITION_STYLES[position]
  return (
    <Box position="fixed" zIndex={50} {...styles}>
      <Stack spacing={2}>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={onRemove}
          />
        ))}
      </Stack>
    </Box>
  )
}
