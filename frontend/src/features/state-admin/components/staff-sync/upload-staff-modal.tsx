import { useTranslation } from 'react-i18next'
import { ToastContainer, UploadFileModal } from '@/shared/components/common'
import { useToast } from '@/shared/hooks/use-toast'
import { useUploadPumpOperatorsMutation } from '../../services/query/use-state-admin-queries'
import { useAuthStore } from '@/app/store/auth-store'

interface UploadStaffModalProps {
  isOpen: boolean
  onClose: () => void
}

export function UploadStaffModal({ isOpen, onClose }: UploadStaffModalProps) {
  const { t } = useTranslation('state-admin')
  const toast = useToast()
  const tenantCode = useAuthStore((s) => s.user?.tenantCode ?? '')
  const { mutate: upload, isPending } = useUploadPumpOperatorsMutation()

  const handleSubmit = (file: File) => {
    upload(
      { file, tenantCode },
      {
        onSuccess: () => {
          toast.success(t('staffSync.upload.success'))
          onClose()
        },
        onError: () => {
          toast.error(t('staffSync.upload.error'))
        },
      }
    )
  }

  return (
    <>
      <UploadFileModal
        isOpen={isOpen}
        onClose={onClose}
        title={t('staffSync.upload.title')}
        description={t('staffSync.upload.description')}
        isPending={isPending}
        onSubmit={handleSubmit}
        submitLabel={t('staffSync.upload.submit')}
        selectFileLabel={t('staffSync.upload.clickToSelect')}
        fileTypesLabel={t('staffSync.upload.fileTypes')}
        closeAriaLabel={t('staffSync.upload.close', 'Close')}
        cancelLabel={t('staffSync.upload.cancel', 'Cancel')}
      />
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </>
  )
}
