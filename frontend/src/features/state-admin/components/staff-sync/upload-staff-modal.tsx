import { useState } from 'react'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import { ToastContainer, UploadFileModal } from '@/shared/components/common'
import type { ValidationFieldError } from '@/shared/components/common'
import { useToast } from '@/shared/hooks/use-toast'
import { useUploadPumpOperatorsMutation } from '../../services/query/use-state-admin-queries'
import { useAuthStore } from '@/app/store/auth-store'

interface UploadStaffModalProps {
  isOpen: boolean
  onClose: () => void
}

interface ValidationErrorResponse {
  fieldErrors?: ValidationFieldError[]
}

export function UploadStaffModal({ isOpen, onClose }: UploadStaffModalProps) {
  const { t } = useTranslation('state-admin')
  const toast = useToast()
  const tenantCode = useAuthStore((s) => s.user?.tenantCode ?? '')
  const { mutate: upload, isPending } = useUploadPumpOperatorsMutation()
  const [validationErrors, setValidationErrors] = useState<ValidationFieldError[]>([])

  const handleClose = () => {
    setValidationErrors([])
    onClose()
  }

  const handleSubmit = (file: File) => {
    if (!file || !tenantCode) return
    setValidationErrors([])
    upload(
      { file, tenantCode },
      {
        onSuccess: () => {
          toast.success(t('staffSync.upload.success'))
          handleClose()
        },
        onError: (error: unknown) => {
          if (axios.isAxiosError(error)) {
            const data = error.response?.data as ValidationErrorResponse | undefined
            if (data?.fieldErrors?.length) {
              setValidationErrors(data.fieldErrors)
              return
            }
          }
          toast.error(t('staffSync.upload.error'))
        },
      }
    )
  }

  return (
    <>
      <UploadFileModal
        isOpen={isOpen}
        onClose={handleClose}
        title={t('staffSync.upload.title')}
        description={t('staffSync.upload.description')}
        isPending={isPending}
        onSubmit={handleSubmit}
        submitLabel={t('staffSync.upload.submit')}
        selectFileLabel={t('staffSync.upload.clickToSelect')}
        fileTypesLabel={t('staffSync.upload.fileTypes')}
        closeAriaLabel={t('staffSync.upload.close', 'Close')}
        cancelLabel={t('staffSync.upload.cancel', 'Cancel')}
        validationErrors={validationErrors}
      />
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </>
  )
}
