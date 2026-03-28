// Simple validation helpers
const validate = (rules, data) => {
  for (const [field, rule] of Object.entries(rules)) {
    const val = data[field];
    if (rule.required && (val === undefined || val === null || String(val).trim() === '')) {
      return { error: { code: 'VALIDATION_ERROR', message: `${field} is required`, field } };
    }
    if (val !== undefined && val !== null) {
      const str = String(val).trim();
      if (rule.min && str.length < rule.min)
        return { error: { code: 'VALIDATION_ERROR', message: `${field} must be at least ${rule.min} chars`, field } };
      if (rule.max && str.length > rule.max)
        return { error: { code: 'VALIDATION_ERROR', message: `${field} must be at most ${rule.max} chars`, field } };
      if (rule.url) {
        try { new URL(val); } catch {
          return { error: { code: 'VALIDATION_ERROR', message: `${field} must be a valid URL`, field } };
        }
      }
      if (rule.enum && !rule.enum.includes(val))
        return { error: { code: 'VALIDATION_ERROR', message: `${field} must be one of: ${rule.enum.join(', ')}`, field } };
    }
  }
  return null;
};

module.exports = validate;
