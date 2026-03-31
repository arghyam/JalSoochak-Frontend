import { useState } from 'react'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import { ToastContainer, UploadFileModal } from '@/shared/components/common'
import pumpOperatorsTemplateUrl from '@/assets/templates/staff-upload-template.xlsx?url'
import type { ValidationFieldError } from '@/shared/components/common'
import { useToast } from '@/shared/hooks/use-toast'
import { useUploadPumpOperatorsMutation } from '../../services/query/use-state-admin-queries'
import { useAuthStore } from '@/app/store/auth-store'
import { extractUploadValidationErrors } from '../../utils/extract-upload-validation-errors'

interface UploadStaffModalProps {
  isOpen: boolean
  onClose: () => void
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
            const errors = extractUploadValidationErrors(error.response?.data)
            if (errors.length > 0) {
              setValidationErrors(errors)
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
        templateDownloadHref={pumpOperatorsTemplateUrl}
      />
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </>
  )
}
