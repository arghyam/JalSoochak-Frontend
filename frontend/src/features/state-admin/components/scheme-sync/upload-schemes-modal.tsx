import { useTranslation } from 'react-i18next'
import { ToastContainer, UploadFileModal } from '@/shared/components/common'
import schemeTemplateUrl from '@/assets/templates/scheme-upload-template.xlsx?url'
import { useUploadSchemesMutation } from '../../services/query/use-state-admin-queries'
import { useAuthStore } from '@/app/store/auth-store'
import { useUploadWithValidation } from '../../hooks/use-upload-with-validation'

interface UploadSchemesModalProps {
  isOpen: boolean
  onClose: () => void
}

export function UploadSchemesModal({ isOpen, onClose }: UploadSchemesModalProps) {
  const { t } = useTranslation('state-admin')
  const tenantCode = useAuthStore((s) => s.user?.tenantCode ?? '')
  const uploadMutation = useUploadSchemesMutation()

  const { validationErrors, handleUpload, clearErrors, toast } = useUploadWithValidation<{
    file: File
    tenantCode: string
  }>({
    mutation: uploadMutation,
    onSuccess: onClose,
    successMessage: t('schemeSync.upload.success'),
    errorMessage: t('schemeSync.upload.error'),
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
        title={t('schemeSync.upload.title')}
        description={t('schemeSync.upload.description')}
        isPending={uploadMutation.isPending}
        onSubmit={handleSubmit}
        submitLabel={t('schemeSync.upload.submit')}
        selectFileLabel={t('schemeSync.upload.clickToSelect')}
        fileTypesLabel={t('schemeSync.upload.fileTypes')}
        closeAriaLabel={t('schemeSync.upload.close')}
        cancelLabel={t('schemeSync.upload.cancel')}
        validationErrors={validationErrors}
        templateDownloadHref={schemeTemplateUrl}
      />
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </>
  )
}
