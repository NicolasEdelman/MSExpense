import type { ZodError } from "zod";

export class ValidationError extends Error {
  title: string;
  detail: string;
  errors?: {
    field: string;
    message: string;
    code?: string;
  }[];

  constructor(error: ZodError, title = "Validation Error") {
    super(title);
    const structure = this.prettifyZodErrors(error, title);
    this.title = title;
    this.detail = structure.detail;
    this.errors = structure.errors;
  }

  prettifyZodErrors(error: ZodError, title = "Validation Error") {
    // Extract all the validation errors from the ZodError
    const formattedErrors = error.errors.map((err) => {
      // Format the path as a string (e.g., "user.address.street")
      const field = err.path.join(".");

      // Use the error message or create a default one
      const message = err.message || `Invalid value for ${field}`;

      // Include error code if available
      const errorObject: {
        field: string;
        message: string;
        code?: string;
      } = {
        field,
        message,
      };

      // Add code if it exists in the error
      if (err.code) {
        errorObject.code = err.code;
      }

      return errorObject;
    });

    // Create a readable overview of all errors
    const errorSummary = formattedErrors
      .map((err) => `${err.field}: ${err.message}`)
      .join("; ");

    // Return the standardized error format
    return {
      title: title,
      detail:
        formattedErrors.length > 1
          ? `Multiple validation errors occurred: ${errorSummary}`
          : errorSummary,
      errors: formattedErrors,
    };
  }
}
