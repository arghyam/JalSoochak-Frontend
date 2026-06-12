import { useTranslation } from 'react-i18next'
import { ToastContainer, UploadFileModal } from '@/shared/components/common'
import pumpOperatorsTemplateUrl from '@/assets/templates/staff-upload-template.xlsx?url'
import { useUploadPumpOperatorsMutation } from '../../services/query/use-state-admin-queries'
import { useAuthStore } from '@/app/store/auth-store'
import { useUploadWithValidation } from '../../hooks/use-upload-with-validation'

interface UploadStaffModalProps {
  isOpen: boolean
  onClose: () => void
}

export function UploadStaffModal({ isOpen, onClose }: UploadStaffModalProps) {
  const { t } = useTranslation('state-admin')
  const tenantCode = useAuthStore((s) => s.user?.tenantCode ?? '')
  const uploadMutation = useUploadPumpOperatorsMutation()

  const { validationErrors, handleUpload, clearErrors, toast } = useUploadWithValidation<{
    file: File
    tenantCode: string
  }>({
    mutation: uploadMutation,
    onSuccess: onClose,
    successMessage: t('staffSync.upload.success'),
    errorMessage: t('staffSync.upload.error'),
  })

  const handleClose = () => {
    clearErrors()
    onClose()
  }

  const handleSubmit = (file: File) => {
    if (!file || !tenantCode) return
    clearErrors()
    handleUpload({ file, tenantCode })
  }

  return (
    <>
      <UploadFileModal
        isOpen={isOpen}
        onClose={handleClose}
        title={t('staffSync.upload.title')}
        description={t('staffSync.upload.description')}
        isPending={uploadMutation.isPending}
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
