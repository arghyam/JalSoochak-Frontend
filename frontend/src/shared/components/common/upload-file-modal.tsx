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

export interface UploadFileModalProps {
  isOpen: boolean
  onClose: () => void
  /** Modal heading */
  title: string
  /** Subtitle/description rendered below the heading */
  description: string
  /** Whether the upload mutation is in-flight */
  isPending: boolean
  /** Called with the selected File when the user confirms upload */
  onSubmit: (file: File) => void
  /** Label for the primary submit button (default: "Upload") */
  submitLabel?: string
  /** Label shown inside the drop zone when no file is selected */
  selectFileLabel?: string
  /** Secondary hint below selectFileLabel (e.g. file type restrictions) */
  fileTypesLabel?: string
  /** Accessible label for the close button */
  closeAriaLabel?: string
  /** Label for the cancel button */
  cancelLabel?: string
}

export function UploadFileModal({
  isOpen,
  onClose,
  title,
  description,
  isPending,
  onSubmit,
  submitLabel = 'Upload',
  selectFileLabel = 'Click to select a file',
  fileTypesLabel = '.xlsx or .xls only',
  closeAriaLabel = 'Close',
  cancelLabel = 'Cancel',
}: UploadFileModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const resetFileState = () => {
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isPending) return
    const file = e.target.files?.[0] ?? null
    setSelectedFile(file)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (isPending) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      fileInputRef.current?.click()
    }
  }

  const handleClose = () => {
    if (isPending) return
    onClose()
  }

  const handleSubmit = () => {
    if (isPending || !selectedFile) return
    onSubmit(selectedFile)
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} onCloseComplete={resetFileState} isCentered>
      <ModalOverlay bg="blackAlpha.600" />
      <ModalContent maxW="448px" borderRadius="12px" p={6}>
        <ModalBody p={0}>
          <Flex justify="space-between" align="center" mb={5}>
            <Text textStyle="h6" fontWeight="600">
              {title}
            </Text>
            <Button
              variant="ghost"
              size="sm"
              p={1}
              minW="auto"
              h="auto"
              onClick={handleClose}
              aria-label={closeAriaLabel}
              isDisabled={isPending}
            >
              <FiX size={18} />
            </Button>
          </Flex>

          <Text textStyle="h10" color="neutral.500" mb={4}>
            {description}
          </Text>

          <Box
            border="1.5px dashed"
            borderColor={selectedFile ? 'primary.500' : 'neutral.300'}
            borderRadius="8px"
            p={6}
            textAlign="center"
            bg={selectedFile ? 'primary.50' : 'neutral.50'}
            cursor={isPending ? 'not-allowed' : 'pointer'}
            onClick={() => {
              if (!isPending) fileInputRef.current?.click()
            }}
            tabIndex={0}
            role="button"
            aria-label={selectedFile ? `${selectFileLabel}: ${selectedFile.name}` : selectFileLabel}
            aria-disabled={isPending}
            onKeyDown={handleKeyDown}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              style={{ display: 'none' }}
              onChange={handleFileChange}
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
                  {selectFileLabel}
                </Text>
                <Text textStyle="h11" color="neutral.400" mt={1}>
                  {fileTypesLabel}
                </Text>
              </>
            )}
          </Box>

          <Flex gap={3} mt={6} justify="flex-end">
            <Button variant="secondary" size="sm" onClick={handleClose} isDisabled={isPending}>
              {cancelLabel}
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isPending}
              isDisabled={!selectedFile}
              onClick={handleSubmit}
            >
              {submitLabel}
            </Button>
          </Flex>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
