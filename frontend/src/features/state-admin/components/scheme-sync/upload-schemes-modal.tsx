import { useState } from 'react'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import { ToastContainer, UploadFileModal } from '@/shared/components/common'
import type { ValidationFieldError } from '@/shared/components/common'
import { useToast } from '@/shared/hooks/use-toast'
import { useUploadSchemesMutation } from '../../services/query/use-state-admin-queries'
import { useAuthStore } from '@/app/store/auth-store'
import { extractUploadValidationErrors } from '../../utils/extract-upload-validation-errors'

interface UploadSchemesModalProps {
  isOpen: boolean
  onClose: () => void
}

export function UploadSchemesModal({ isOpen, onClose }: UploadSchemesModalProps) {
  const { t } = useTranslation('state-admin')
  const toast = useToast()
  const tenantCode = useAuthStore((s) => s.user?.tenantCode ?? '')
  const { mutate: upload, isPending } = useUploadSchemesMutation()
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
          toast.success(t('schemeSync.upload.success'))
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
          toast.error(t('schemeSync.upload.error'))
        },
      }
    )
  }
  console.log('validationErrors', validationErrors)

  return (
    <>
      <UploadFileModal
        isOpen={isOpen}
        onClose={handleClose}
        title={t('schemeSync.upload.title')}
        description={t('schemeSync.upload.description')}
        isPending={isPending}
        onSubmit={handleSubmit}
        submitLabel={t('schemeSync.upload.submit')}
        selectFileLabel={t('schemeSync.upload.clickToSelect')}
        fileTypesLabel={t('schemeSync.upload.fileTypes')}
        closeAriaLabel={t('schemeSync.upload.close')}
        cancelLabel={t('schemeSync.upload.cancel')}
        validationErrors={validationErrors}
      />
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </>
  )
}
