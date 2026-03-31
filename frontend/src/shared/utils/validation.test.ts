import {
  isEmptyOrWhitespace,
  containsHtmlTags,
  containsSqlInjection,
  isAlphanumericWithSpaces,
  isValidHttpsUrl,
  hasDuplicates,
  validateTextField,
  validateDescriptiveField,
} from './validation'

describe('isEmptyOrWhitespace', () => {
  it('returns true for empty string', () => {
    expect(isEmptyOrWhitespace('')).toBe(true)
  })

  it('returns true for whitespace-only string', () => {
    expect(isEmptyOrWhitespace('   ')).toBe(true)
    expect(isEmptyOrWhitespace('\t\n')).toBe(true)
  })

  it('returns false for non-empty string', () => {
    expect(isEmptyOrWhitespace('hello')).toBe(false)
    expect(isEmptyOrWhitespace(' a ')).toBe(false)
  })
})

describe('containsHtmlTags', () => {
  it('detects HTML tags', () => {
    expect(containsHtmlTags('<script>alert("xss")</script>')).toBe(true)
    expect(containsHtmlTags('<div>content</div>')).toBe(true)
    expect(containsHtmlTags('text <b>bold</b> text')).toBe(true)
    expect(containsHtmlTags('<img src="x" onerror="alert(1)">')).toBe(true)
  })

  it('returns false for plain text', () => {
    expect(containsHtmlTags('hello world')).toBe(false)
    expect(containsHtmlTags('5 > 3')).toBe(false)
    expect(containsHtmlTags('a < b')).toBe(false)
    expect(containsHtmlTags('normal text 123')).toBe(false)
  })
})

describe('containsSqlInjection', () => {
  it('detects SQL keywords', () => {
    expect(containsSqlInjection("'; DROP TABLE users")).toBe(true)
    expect(containsSqlInjection('SELECT * FROM users')).toBe(true)
    expect(containsSqlInjection('value; DELETE FROM table')).toBe(true)
    expect(containsSqlInjection("' OR '1'='1")).toBe(true)
    expect(containsSqlInjection('UNION SELECT password')).toBe(true)
    expect(containsSqlInjection('test -- comment')).toBe(true)
  })

  it('returns false for normal text', () => {
    expect(containsSqlInjection('Meter replaced')).toBe(false)
    expect(containsSqlInjection('Normal reason 123')).toBe(false)
    expect(containsSqlInjection('Water supply issue')).toBe(false)
  })
})

describe('isAlphanumericWithSpaces', () => {
  it('returns true for alphanumeric with spaces', () => {
    expect(isAlphanumericWithSpaces('Hello World')).toBe(true)
    expect(isAlphanumericWithSpaces('Meter123')).toBe(true)
    expect(isAlphanumericWithSpaces('abc')).toBe(true)
    expect(isAlphanumericWithSpaces('123')).toBe(true)
  })

  it('returns false for special characters', () => {
    expect(isAlphanumericWithSpaces('hello-world')).toBe(false)
    expect(isAlphanumericWithSpaces('test@email')).toBe(false)
    expect(isAlphanumericWithSpaces('value!')).toBe(false)
    expect(isAlphanumericWithSpaces('a,b')).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(isAlphanumericWithSpaces('')).toBe(false)
  })
})

describe('isValidHttpsUrl', () => {
  it('returns true for valid HTTPS URLs', () => {
    expect(isValidHttpsUrl('https://example.com')).toBe(true)
    expect(isValidHttpsUrl('https://api.example.com/v1')).toBe(true)
    expect(isValidHttpsUrl('https://example.com:8080/path')).toBe(true)
  })

  it('returns false for non-HTTPS URLs', () => {
    expect(isValidHttpsUrl('http://example.com')).toBe(false)
    expect(isValidHttpsUrl('ftp://example.com')).toBe(false)
  })

  it('returns false for invalid URLs', () => {
    expect(isValidHttpsUrl('not a url')).toBe(false)
    expect(isValidHttpsUrl('')).toBe(false)
    expect(isValidHttpsUrl('example.com')).toBe(false)
  })
})

describe('hasDuplicates', () => {
  it('detects duplicates (case-insensitive)', () => {
    expect(hasDuplicates(['Meter', 'meter'])).toBe(true)
    expect(hasDuplicates(['abc', 'def', 'ABC'])).toBe(true)
    expect(hasDuplicates(['a', 'b', 'a'])).toBe(true)
  })

  it('returns false when no duplicates', () => {
    expect(hasDuplicates(['a', 'b', 'c'])).toBe(false)
    expect(hasDuplicates(['Meter', 'Pump', 'Valve'])).toBe(false)
    expect(hasDuplicates([])).toBe(false)
    expect(hasDuplicates(['single'])).toBe(false)
  })

  it('trims values before comparing', () => {
    expect(hasDuplicates([' abc', 'abc '])).toBe(true)
  })
})

describe('validateTextField', () => {
  it('returns null for valid text', () => {
    expect(validateTextField('Normal text')).toBeNull()
    expect(validateTextField('Value 123')).toBeNull()
  })

  it('returns containsHtmlTags for HTML', () => {
    expect(validateTextField('<script>alert(1)</script>')).toBe('containsHtmlTags')
  })

  it('returns containsSqlInjection for SQL patterns', () => {
    expect(validateTextField("'; DROP TABLE")).toBe('containsSqlInjection')
  })

  it('prioritizes HTML check over SQL check', () => {
    expect(validateTextField('<script>SELECT * FROM</script>')).toBe('containsHtmlTags')
  })
})

describe('validateDescriptiveField', () => {
  it('returns null for valid descriptive text', () => {
    expect(validateDescriptiveField('Meter replaced')).toBeNull()
    expect(validateDescriptiveField('Reason 123')).toBeNull()
  })

  it('returns emptyOrWhitespace for empty/whitespace', () => {
    expect(validateDescriptiveField('')).toBe('emptyOrWhitespace')
    expect(validateDescriptiveField('   ')).toBe('emptyOrWhitespace')
  })

  it('returns containsHtmlTags for HTML', () => {
    expect(validateDescriptiveField('<div>test</div>')).toBe('containsHtmlTags')
  })

  it('returns containsSqlInjection for SQL', () => {
    expect(validateDescriptiveField("test'; DROP TABLE")).toBe('containsSqlInjection')
  })

  it('returns alphanumericOnly for special characters', () => {
    expect(validateDescriptiveField('hello-world')).toBe('alphanumericOnly')
    expect(validateDescriptiveField('test@value')).toBe('alphanumericOnly')
  })
})
