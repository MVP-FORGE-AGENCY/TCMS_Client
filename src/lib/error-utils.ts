/**
 * Utility functions for handling API errors
 */

export interface ValidationError {
    field: string
    message: string
}

export interface ApiErrorResponse {
    error: {
        code: string
        message: string
        details?: {
            errors?: ValidationError[]
        }
    }
}

/**
 * Parses API error response and returns user-friendly message
 */
export function parseApiError(error: any): string {
    // Check for axios error with response
    const data = error?.response?.data as ApiErrorResponse | undefined

    if (!data?.error) {
        return error?.message || "An unexpected error occurred"
    }

    const { code, message, details } = data.error

    // Handle validation errors specially
    if (code === "VALIDATION_ERROR" && details?.errors && details.errors.length > 0) {
        const fieldErrors = details.errors
            .map(e => `• ${formatFieldName(e.field)}: ${formatValidationMessage(e.message)}`)
            .join("\n")
        return `Validation failed:\n${fieldErrors}`
    }

    // Return the error message for other error types
    return message || "An error occurred"
}

/**
 * Formats field name for display (e.g., "frequencyMonths" -> "Frequency Months")
 */
function formatFieldName(field: string): string {
    return field
        .replace(/([A-Z])/g, " $1") // Add space before capitals
        .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
        .trim()
}

/**
 * Cleans up Joi validation messages for user display
 */
function formatValidationMessage(message: string): string {
    // Remove field name quotes from Joi messages
    return message
        .replace(/^"[^"]*"\s*/, "") // Remove leading quoted field name
        .replace(/must be/i, "Must be")
        .trim()
}

/**
 * Gets validation errors as an array for form display
 */
export function getValidationErrors(error: any): ValidationError[] {
    const data = error?.response?.data as ApiErrorResponse | undefined
    
    if (data?.error?.code === "VALIDATION_ERROR" && data.error.details?.errors) {
        return data.error.details.errors
    }
    
    return []
}
