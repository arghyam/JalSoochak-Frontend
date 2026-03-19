import { useRef, useState } from 'react'
import {
  Box,
  Button,
  Flex,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  Text,
} from '@chakra-ui/react'
import { FiUpload, FiX } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'
import { ToastContainer } from '@/shared/components/common'
import { useToast } from '@/shared/hooks/use-toast'
import { useUploadPumpOperatorsMutation } from '../../services/query/use-state-admin-queries'
import { useAuthStore } from '@/app/store/auth-store'

interface UploadStaffModalProps {
  isOpen: boolean
  onClose: () => void
}

export function UploadStaffModal({ isOpen, onClose }: UploadStaffModalProps) {
  const { t } = useTranslation(['state-admin', 'common'])
  const toast = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const tenantCode = useAuthStore((s) => s.user?.tenantCode ?? '')
  const { mutate: upload, isPending } = useUploadPumpOperatorsMutation()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setSelectedFile(file)
  }

  const handleClose = () => {
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    onClose()
  }

  const handleSubmit = () => {
    if (!selectedFile) return
    upload(
      { file: selectedFile, tenantCode },
      {
        onSuccess: () => {
          toast.success(t('staffSync.upload.success'))
          handleClose()
        },
        onError: () => {
          toast.error(t('staffSync.upload.error'))
        },
      }
    )
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} isCentered>
        <ModalOverlay bg="blackAlpha.600" />
        <ModalContent maxW="448px" borderRadius="12px" p={6}>
          <ModalBody p={0}>
            <Flex justify="space-between" align="center" mb={5}>
              <Text textStyle="h6" fontWeight="600">
                {t('staffSync.upload.title')}
              </Text>
              <Button
                variant="ghost"
                size="sm"
                p={1}
                minW="auto"
                h="auto"
                onClick={handleClose}
                aria-label={t('common:close')}
              >
                <FiX size={18} />
              </Button>
            </Flex>

            <Text textStyle="h10" color="neutral.500" mb={4}>
              {t('staffSync.upload.description')}
            </Text>

            <Box
              border="1.5px dashed"
              borderColor={selectedFile ? 'primary.500' : 'neutral.300'}
              borderRadius="8px"
              p={6}
              textAlign="center"
              bg={selectedFile ? 'primary.50' : 'neutral.50'}
              cursor="pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                style={{ display: 'none' }}
                onChange={handleFileChange}
                aria-label={t('staffSync.upload.selectFile')}
              />
              <FiUpload
                size={24}
                style={{ margin: '0 auto 8px', color: selectedFile ? '#3291D1' : '#9CA3AF' }}
              />
              {selectedFile ? (
                <Text textStyle="h10" fontWeight="500" color="primary.600" noOfLines={1}>
                  {selectedFile.name}
                </Text>
              ) : (
                <>
                  <Text textStyle="h10" fontWeight="500" color="neutral.600">
                    {t('staffSync.upload.clickToSelect')}
                  </Text>
                  <Text textStyle="h11" color="neutral.400" mt={1}>
                    {t('staffSync.upload.fileTypes')}
                  </Text>
                </>
              )}
            </Box>

            <Flex gap={3} mt={6} justify="flex-end">
              <Button variant="secondary" size="sm" onClick={handleClose} isDisabled={isPending}>
                {t('common:cancel')}
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={isPending}
                isDisabled={!selectedFile}
                onClick={handleSubmit}
              >
                {t('staffSync.upload.submit')}
              </Button>
            </Flex>
          </ModalBody>
        </ModalContent>
      </Modal>

      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </>
  )
}
