import { describe, expect, it } from '@jest/globals'
import { extractUploadValidationErrors } from './extract-upload-validation-errors'

describe('extractUploadValidationErrors', () => {
  it('returns empty array for non-object input', () => {
    expect(extractUploadValidationErrors(null)).toEqual([])
    expect(extractUploadValidationErrors(undefined)).toEqual([])
    expect(extractUploadValidationErrors('x')).toEqual([])
  })

  it('maps fieldErrors shape with numeric row', () => {
    const result = extractUploadValidationErrors({
      fieldErrors: [{ row: 2, field: 'email', message: 'invalid' }],
    })
    expect(result).toEqual([{ row: 2, field: 'email', message: 'invalid' }])
  })

  it('maps errors shape with rowNumber string and coerces row', () => {
    const result = extractUploadValidationErrors({
      errors: [{ rowNumber: '5', field: 'name', message: 'too long' }],
    })
    expect(result).toEqual([{ row: 5, field: 'name', message: 'too long' }])
  })

  it('drops invalid items and NaN rows', () => {
    expect(
      extractUploadValidationErrors({
        fieldErrors: [
          { row: 'abc', field: 'f', message: 'm' },
          { row: 1, field: 'ok', message: 'fine' },
          { row: 2, field: 1, message: 'bad field type' },
        ],
      })
    ).toEqual([{ row: 1, field: 'ok', message: 'fine' }])
  })
})
