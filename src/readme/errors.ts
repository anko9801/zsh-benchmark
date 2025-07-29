// Error handling for README generator

export enum ErrorCode {
  FILE_NOT_FOUND = "FILE_NOT_FOUND",
  INVALID_JSON = "INVALID_JSON",
  GITHUB_API_ERROR = "GITHUB_API_ERROR",
  TEMPLATE_ERROR = "TEMPLATE_ERROR",
  WRITE_ERROR = "WRITE_ERROR",
  VALIDATION_ERROR = "VALIDATION_ERROR",
}

export class ReadmeGeneratorError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ReadmeGeneratorError";
  }
}

// Error messages with localization support
const errorMessages = {
  ja: {
    [ErrorCode.FILE_NOT_FOUND]: "ファイルが見つかりません",
    [ErrorCode.INVALID_JSON]: "無効なJSONフォーマットです",
    [ErrorCode.GITHUB_API_ERROR]: "GitHub APIエラーが発生しました",
    [ErrorCode.TEMPLATE_ERROR]: "テンプレートエラーが発生しました",
    [ErrorCode.WRITE_ERROR]: "ファイル書き込みエラーが発生しました",
    [ErrorCode.VALIDATION_ERROR]: "データ検証エラーが発生しました",
  },
  en: {
    [ErrorCode.FILE_NOT_FOUND]: "File not found",
    [ErrorCode.INVALID_JSON]: "Invalid JSON format",
    [ErrorCode.GITHUB_API_ERROR]: "GitHub API error occurred",
    [ErrorCode.TEMPLATE_ERROR]: "Template error occurred",
    [ErrorCode.WRITE_ERROR]: "File write error occurred",
    [ErrorCode.VALIDATION_ERROR]: "Data validation error occurred",
  },
};

export function getErrorMessage(
  code: ErrorCode,
  language: "ja" | "en" = "ja",
): string {
  return errorMessages[language][code] || errorMessages.en[code];
}

// Helper function to create localized error
export function createError(
  code: ErrorCode,
  details?: unknown,
  language: "ja" | "en" = "ja",
): ReadmeGeneratorError {
  const message = getErrorMessage(code, language);
  return new ReadmeGeneratorError(message, code, details);
}

import { logger, LogLevel } from "../logger.ts";

// Error handler for CLI
export function handleError(error: unknown, debug = false): void {
  // Set logger level based on debug flag
  if (debug) {
    logger.level = LogLevel.DEBUG;
  }

  if (error instanceof ReadmeGeneratorError) {
    logger.error(`${error.message} (${error.code})`);
    if (debug && error.details) {
      logger.debug(`Details: ${JSON.stringify(error.details)}`);
    }
  } else if (error instanceof Error) {
    logger.error(`エラー: ${error.message}`, error);
  } else {
    logger.error("予期しないエラーが発生しました");
    if (debug) {
      logger.debug(`Unknown error: ${JSON.stringify(error)}`);
    }
  }
}
