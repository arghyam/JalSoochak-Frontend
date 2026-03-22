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
import { FiUpload, FiX, FiAlertCircle } from 'react-icons/fi'

export interface ValidationFieldError {
  row: number
  field: string
  message: string
}

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
  /** Validation field errors returned by the server on a 400 response */
  validationErrors?: ValidationFieldError[]
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
  validationErrors,
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

  const hasValidationErrors = validationErrors && validationErrors.length > 0

  return (
    <Modal isOpen={isOpen} onClose={handleClose} onCloseComplete={resetFileState} isCentered>
      <ModalOverlay bg="blackAlpha.600" />
      <ModalContent maxW="640px" borderRadius="12px" p={6}>
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

          {hasValidationErrors && (
            <Box
              mt={4}
              borderRadius="8px"
              overflow="hidden"
              border="1px solid"
              borderColor="red.200"
            >
              <Flex
                align="center"
                gap={2}
                px={4}
                py={2.5}
                bg="red.50"
                borderBottom="1px solid"
                borderColor="red.200"
              >
                <FiAlertCircle size={15} color="#C53030" />
                <Text fontSize="sm" fontWeight="600" color="red.700">
                  {validationErrors.length} validation error
                  {validationErrors.length > 1 ? 's' : ''} found — fix and re-upload
                </Text>
              </Flex>

              {/* Header row */}
              <Flex
                px={4}
                py={2}
                gap={4}
                bg="red.50"
                borderBottom="1px solid"
                borderColor="red.100"
              >
                <Text
                  fontSize="xs"
                  fontWeight="700"
                  color="red.600"
                  textTransform="uppercase"
                  letterSpacing="wider"
                  w="52px"
                  flexShrink={0}
                >
                  Row
                </Text>
                <Text
                  fontSize="xs"
                  fontWeight="700"
                  color="red.600"
                  textTransform="uppercase"
                  letterSpacing="wider"
                  w="160px"
                  flexShrink={0}
                >
                  Field
                </Text>
                <Text
                  fontSize="xs"
                  fontWeight="700"
                  color="red.600"
                  textTransform="uppercase"
                  letterSpacing="wider"
                  flex={1}
                >
                  Error
                </Text>
              </Flex>

              {/* Error rows */}
              <Box maxH="220px" overflowY="auto" bg="white">
                {validationErrors.map((err, idx) => (
                  <Flex
                    key={idx}
                    px={4}
                    py={2.5}
                    gap={4}
                    align="flex-start"
                    borderTop={idx === 0 ? 'none' : '1px solid'}
                    borderColor="red.50"
                    _hover={{ bg: 'red.50' }}
                  >
                    <Text
                      fontSize="sm"
                      fontWeight="500"
                      color="neutral.500"
                      w="52px"
                      flexShrink={0}
                    >
                      {err.row}
                    </Text>
                    <Text
                      fontSize="sm"
                      fontWeight="500"
                      color="neutral.700"
                      w="160px"
                      flexShrink={0}
                      fontFamily="mono"
                      wordBreak="break-all"
                    >
                      {err.field}
                    </Text>
                    <Text fontSize="sm" color="red.700" flex={1}>
                      {err.message}
                    </Text>
                  </Flex>
                ))}
              </Box>
            </Box>
          )}

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
