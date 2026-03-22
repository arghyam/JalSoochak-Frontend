import { useState } from 'react'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import { ToastContainer, UploadFileModal } from '@/shared/components/common'
import type { ValidationFieldError } from '@/shared/components/common'
import { useToast } from '@/shared/hooks/use-toast'
import { useUploadSchemeMappingsMutation } from '../../services/query/use-state-admin-queries'
import { useAuthStore } from '@/app/store/auth-store'
import { extractUploadValidationErrors } from '../../utils/extract-upload-validation-errors'

interface UploadSchemeMappingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function UploadSchemeMappingsModal({ isOpen, onClose }: UploadSchemeMappingsModalProps) {
  const { t } = useTranslation('state-admin')
  const toast = useToast()
  const tenantCode = useAuthStore((s) => s.user?.tenantCode ?? '')
  const { mutate: upload, isPending } = useUploadSchemeMappingsMutation()
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
          toast.success(t('schemeMappingsSync.upload.success'))
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
          toast.error(t('schemeMappingsSync.upload.error'))
        },
      }
    )
  }

  return (
    <>
      <UploadFileModal
        isOpen={isOpen}
        onClose={handleClose}
        title={t('schemeMappingsSync.upload.title')}
        description={t('schemeMappingsSync.upload.description')}
        isPending={isPending}
        onSubmit={handleSubmit}
        submitLabel={t('schemeMappingsSync.upload.submit')}
        selectFileLabel={t('schemeMappingsSync.upload.clickToSelect')}
        fileTypesLabel={t('schemeMappingsSync.upload.fileTypes')}
        closeAriaLabel={t('schemeMappingsSync.upload.close')}
        cancelLabel={t('schemeMappingsSync.upload.cancel')}
        validationErrors={validationErrors}
      />
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </>
  )
}
