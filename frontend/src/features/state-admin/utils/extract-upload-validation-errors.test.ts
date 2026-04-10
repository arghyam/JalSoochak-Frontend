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

  it('returns empty array for object without errors arrays', () => {
    expect(extractUploadValidationErrors({})).toEqual([])
    expect(extractUploadValidationErrors({ fieldErrors: 'nope' })).toEqual([])
  })

  it('parses errors when fieldErrors is present but not an array', () => {
    expect(
      extractUploadValidationErrors({
        fieldErrors: 'nope',
        errors: [{ rowNumber: 1, field: 'x', message: 'm' }],
      })
    ).toEqual([{ row: 1, field: 'x', message: 'm' }])
  })

  it('prefers fieldErrors when both fieldErrors and errors are arrays', () => {
    expect(
      extractUploadValidationErrors({
        fieldErrors: [{ row: 1, field: 'a', message: 'm' }],
        errors: [{ rowNumber: 2, field: 'b', message: 'x' }],
      })
    ).toEqual([{ row: 1, field: 'a', message: 'm' }])
  })

  it('filters null entries and non-objects in the list', () => {
    expect(
      extractUploadValidationErrors({
        errors: [
          null,
          { rowNumber: 1, field: 'f', message: 'ok' },
          'bad' as unknown as Record<string, unknown>,
        ],
      })
    ).toEqual([{ row: 1, field: 'f', message: 'ok' }])
  })

  it('accepts rowNumber as number', () => {
    expect(
      extractUploadValidationErrors({
        errors: [{ rowNumber: 3, field: 'c', message: 'msg' }],
      })
    ).toEqual([{ row: 3, field: 'c', message: 'msg' }])
  })
})
