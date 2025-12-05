/**
 * Intelligent Validation and Auto-Correction Utilities
 * Provides smart suggestions and corrections for user input
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  suggestions: string[];
  correctedData?: any;
}

/**
 * Validate and suggest corrections for client data
 */
export function validateClientData(data: {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  address_line1?: string;
  city?: string;
  state?: string;
  zip_code?: string;
}): ValidationResult {
  const errors: string[] = [];
  const suggestions: string[] = [];
  const correctedData = { ...data };

  // Required fields
  if (!data.first_name?.trim()) {
    errors.push('First name is required');
  }
  if (!data.last_name?.trim()) {
    errors.push('Last name is required');
  }

  // Email validation with suggestions
  if (data.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      errors.push('Invalid email format');

      // Suggest common domain corrections
      const emailParts = data.email.split('@');
      if (emailParts.length === 2) {
        const localPart = emailParts[0];
        const domainPart = emailParts[1];

        const commonDomains = [
          'gmail.com',
          'yahoo.com',
          'hotmail.com',
          'outlook.com',
        ];
        const suggestionsForDomain = commonDomains
          .filter(
            (domain) =>
              domain.includes(domainPart) ||
              domainPart.includes(domain.split('.')[0])
          )
          .map((domain) => `${localPart}@${domain}`);

        if (suggestionsForDomain.length > 0) {
          suggestions.push(`Did you mean: ${suggestionsForDomain.join(', ')}?`);
        }
      }
    }
  }

  // Phone number formatting
  if (data.phone) {
    const cleanPhone = data.phone.replace(/\D/g, '');
    if (cleanPhone.length === 10) {
      // Format as (XXX) XXX-XXXX
      correctedData.phone = `(${cleanPhone.slice(0, 3)}) ${cleanPhone.slice(3, 6)}-${cleanPhone.slice(6)}`;
      if (correctedData.phone !== data.phone) {
        suggestions.push(`Formatted phone number: ${correctedData.phone}`);
      }
    } else if (cleanPhone.length === 11 && cleanPhone.startsWith('1')) {
      // Handle 1-XXX-XXX-XXXX format
      const formatted = `(${cleanPhone.slice(1, 4)}) ${cleanPhone.slice(4, 7)}-${cleanPhone.slice(7)}`;
      correctedData.phone = formatted;
      if (formatted !== data.phone) {
        suggestions.push(`Formatted phone number: ${formatted}`);
      }
    } else if (cleanPhone.length !== 10 && cleanPhone.length !== 11) {
      errors.push('Phone number should be 10 or 11 digits');
    }
  }

  // Address validation
  if (data.address_line1) {
    // Check for common address abbreviations
    const addressCorrections: Record<string, string> = {
      st: 'Street',
      'st.': 'Street',
      ave: 'Avenue',
      'ave.': 'Avenue',
      rd: 'Road',
      'rd.': 'Road',
      ln: 'Lane',
      'ln.': 'Lane',
      dr: 'Drive',
      'dr.': 'Drive',
      blvd: 'Boulevard',
      'blvd.': 'Boulevard',
      ct: 'Court',
      'ct.': 'Court',
      pl: 'Place',
      'pl.': 'Place',
      cir: 'Circle',
      'cir.': 'Circle',
    };

    const words = data.address_line1.split(' ');
    const correctedWords = words.map((word) => {
      const lowerWord = word.toLowerCase().replace(/[.,]$/, '');
      return addressCorrections[lowerWord] || word;
    });

    const correctedAddress = correctedWords.join(' ');
    if (correctedAddress !== data.address_line1) {
      correctedData.address_line1 = correctedAddress;
      suggestions.push(`Standardized address: ${correctedAddress}`);
    }
  }

  // State validation
  if (data.state) {
    const stateAbbreviations: Record<string, string> = {
      alabama: 'AL',
      alaska: 'AK',
      arizona: 'AZ',
      arkansas: 'AR',
      california: 'CA',
      colorado: 'CO',
      connecticut: 'CT',
      delaware: 'DE',
      florida: 'FL',
      georgia: 'GA',
      hawaii: 'HI',
      idaho: 'ID',
      illinois: 'IL',
      indiana: 'IN',
      iowa: 'IA',
      kansas: 'KS',
      kentucky: 'KY',
      louisiana: 'LA',
      maine: 'ME',
      maryland: 'MD',
      massachusetts: 'MA',
      michigan: 'MI',
      minnesota: 'MN',
      mississippi: 'MS',
      missouri: 'MO',
      montana: 'MT',
      nebraska: 'NE',
      nevada: 'NV',
      'new hampshire': 'NH',
      'new jersey': 'NJ',
      'new mexico': 'NM',
      'new york': 'NY',
      'north carolina': 'NC',
      'north dakota': 'ND',
      ohio: 'OH',
      oklahoma: 'OK',
      oregon: 'OR',
      pennsylvania: 'PA',
      'rhode island': 'RI',
      'south carolina': 'SC',
      'south dakota': 'SD',
      tennessee: 'TN',
      texas: 'TX',
      utah: 'UT',
      vermont: 'VT',
      virginia: 'VA',
      washington: 'WA',
      'west virginia': 'WV',
      wisconsin: 'WI',
      wyoming: 'WY',
    };

    const lowerState = data.state.toLowerCase().trim();
    if (stateAbbreviations[lowerState]) {
      correctedData.state = stateAbbreviations[lowerState];
      suggestions.push(`Standardized state: ${correctedData.state}`);
    } else if (data.state.length === 2) {
      // Already abbreviated, check if valid
      const validAbbrev = Object.values(stateAbbreviations).includes(
        data.state.toUpperCase()
      );
      if (!validAbbrev) {
        errors.push('Invalid state abbreviation');
      } else {
        correctedData.state = data.state.toUpperCase();
      }
    } else if (data.state.length > 2) {
      // Full state name, check if valid
      const validState = Object.keys(stateAbbreviations).includes(lowerState);
      if (!validState) {
        errors.push('Invalid state name');
      }
    }
  }

  // ZIP code validation
  if (data.zip_code) {
    const cleanZip = data.zip_code.replace(/\D/g, '');
    if (cleanZip.length === 5) {
      correctedData.zip_code = cleanZip;
    } else if (cleanZip.length === 9) {
      correctedData.zip_code = `${cleanZip.slice(0, 5)}-${cleanZip.slice(5)}`;
      suggestions.push(`Formatted ZIP code: ${correctedData.zip_code}`);
    } else {
      errors.push('ZIP code should be 5 or 9 digits');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    suggestions,
    correctedData:
      Object.keys(correctedData).length > 0 ? correctedData : undefined,
  };
}

/**
 * Validate and suggest corrections for job data
 */
export function validateJobData(data: {
  title?: string;
  description?: string;
  service_date?: string;
  scheduled_time?: string;
  total?: number;
}): ValidationResult {
  const errors: string[] = [];
  const suggestions: string[] = [];
  const correctedData = { ...data };

  // Title validation
  if (!data.title?.trim()) {
    errors.push('Job title is required');
  } else if (data.title.length < 3) {
    errors.push('Job title should be at least 3 characters');
  }

  // Service date validation
  if (data.service_date) {
    const serviceDate = new Date(data.service_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (serviceDate < today) {
      errors.push('Service date cannot be in the past');
    }

    // Suggest scheduling within reasonable timeframe
    const daysDiff = Math.ceil(
      (serviceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysDiff > 90) {
      suggestions.push(
        'Consider scheduling within the next 3 months for better planning'
      );
    }
  }

  // Total amount validation
  if (data.total !== undefined) {
    if (data.total < 0) {
      errors.push('Total amount cannot be negative');
    } else if (data.total > 50000) {
      suggestions.push(
        'Large job amount detected - consider breaking into phases'
      );
    } else if (data.total === 0) {
      suggestions.push('Job total is $0 - add line items to calculate pricing');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    suggestions,
    correctedData:
      Object.keys(correctedData).length > 0 ? correctedData : undefined,
  };
}

/**
 * Validate and suggest corrections for estimate data
 */
export function validateEstimateData(data: {
  title?: string;
  valid_until?: string;
  subtotal?: number;
  tax_rate?: number;
  total?: number;
}): ValidationResult {
  const errors: string[] = [];
  const suggestions: string[] = [];
  const correctedData = { ...data };

  // Title validation
  if (!data.title?.trim()) {
    errors.push('Estimate title is required');
  }

  // Valid until date validation
  if (data.valid_until) {
    const validDate = new Date(data.valid_until);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (validDate <= today) {
      errors.push('Valid until date must be in the future');
    }

    const daysDiff = Math.ceil(
      (validDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysDiff > 90) {
      suggestions.push(
        'Consider a shorter validity period (30-60 days) for better urgency'
      );
    } else if (daysDiff < 7) {
      suggestions.push(
        'Very short validity period - consider extending to give clients more time'
      );
    }
  }

  // Tax rate validation
  if (data.tax_rate !== undefined) {
    if (data.tax_rate < 0 || data.tax_rate > 50) {
      errors.push('Tax rate should be between 0% and 50%');
    } else if (data.tax_rate === 0) {
      suggestions.push(
        'Tax rate is 0% - verify if this is correct for your location'
      );
    }
  }

  // Pricing validation
  if (data.subtotal !== undefined && data.total !== undefined) {
    const calculatedTotal = data.subtotal * (1 + (data.tax_rate || 0) / 100);
    const difference = Math.abs(calculatedTotal - data.total);

    if (difference > 0.01) {
      // Allow for small rounding differences
      suggestions.push(
        `Total amount doesn't match calculation. Expected: $${calculatedTotal.toFixed(2)}`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    suggestions,
    correctedData:
      Object.keys(correctedData).length > 0 ? correctedData : undefined,
  };
}

/**
 * Get smart suggestions for duplicate detection
 */
export function detectDuplicates(data: any, existingData: any[]): string[] {
  const suggestions: string[] = [];

  // Check for similar client names
  if (data.first_name && data.last_name) {
    const fullName = `${data.first_name} ${data.last_name}`.toLowerCase();
    const similarClients = existingData.filter((client) => {
      const existingName =
        `${client.first_name} ${client.last_name}`.toLowerCase();
      return existingName.includes(fullName) || fullName.includes(existingName);
    });

    if (similarClients.length > 0) {
      suggestions.push(
        `Similar client found: ${similarClients[0].first_name} ${similarClients[0].last_name}`
      );
    }
  }

  // Check for similar email addresses
  if (data.email) {
    const similarEmails = existingData.filter(
      (client) =>
        client.email &&
        (client.email.toLowerCase().includes(data.email.toLowerCase()) ||
          data.email.toLowerCase().includes(client.email.toLowerCase()))
    );

    if (similarEmails.length > 0) {
      suggestions.push(`Similar email found: ${similarEmails[0].email}`);
    }
  }

  // Check for similar phone numbers
  if (data.phone) {
    const cleanPhone = data.phone.replace(/\D/g, '');
    const similarPhones = existingData.filter((client) => {
      if (!client.phone) return false;
      const cleanExisting = client.phone.replace(/\D/g, '');
      return (
        cleanExisting.includes(cleanPhone) || cleanPhone.includes(cleanExisting)
      );
    });

    if (similarPhones.length > 0) {
      suggestions.push(`Similar phone found: ${similarPhones[0].phone}`);
    }
  }

  return suggestions;
}
