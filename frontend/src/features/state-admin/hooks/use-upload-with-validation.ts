import { useState } from 'react'
import axios from 'axios'
import type { UseMutationResult } from '@tanstack/react-query'
import { useToast } from '@/shared/hooks/use-toast'
import { extractUploadValidationErrors } from '../utils/extract-upload-validation-errors'
import type { ValidationFieldError } from '@/shared/components/common'

interface UseUploadWithValidationOptions<TVariables = File> {
  mutation: Pick<UseMutationResult<unknown, unknown, TVariables>, 'mutate'>
  onSuccess?: () => void
  successMessage: string
  errorMessage: string
}

interface UseUploadWithValidationReturn<TVariables = File> {
  validationErrors: ValidationFieldError[]
  handleUpload: (variables: TVariables) => void
  clearErrors: () => void
  toast: ReturnType<typeof useToast>
}

export function useUploadWithValidation<TVariables = File>(
  options: UseUploadWithValidationOptions<TVariables>
): UseUploadWithValidationReturn<TVariables> {
  const toast = useToast()
  const [validationErrors, setValidationErrors] = useState<ValidationFieldError[]>([])

  const handleUpload = (variables: TVariables) => {
    options.mutation.mutate(variables, {
      onSuccess: () => {
        toast.success(options.successMessage)
        options.onSuccess?.()
      },
      onError: (error: unknown) => {
        if (axios.isAxiosError(error)) {
          const errors = extractUploadValidationErrors(error.response?.data)
          if (errors.length > 0) {
            setValidationErrors(errors)
            return
          }
        }
        toast.error(options.errorMessage)
      },
    })
  }

  const clearErrors = () => setValidationErrors([])

  return { validationErrors, handleUpload, clearErrors, toast }
}
