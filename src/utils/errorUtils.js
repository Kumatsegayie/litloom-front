export const DEFAULT_ERROR_CODE = "ERR_UNKNOWN";

export const createAppError = (message, options = {}) => {
  const err = new Error(message || "Unexpected error");
  if (options.code) err.code = options.code;
  if (typeof options.status === "number") err.status = options.status;
  if (options.cause) err.cause = options.cause;
  return err;
};

export const isAppError = (value) => {
  return Boolean(value && typeof value === "object" && (value.code || value.status));
};

export const getErrorCode = (error, fallback = DEFAULT_ERROR_CODE) => {
  if (!error) return fallback;
  if (typeof error === "string") {
    const match = error.match(/\b(ERR_[A-Z0-9_]+)\b/);
    return match ? match[1] : fallback;
  }
  if (error.code && typeof error.code === "string") return error.code;
  if (typeof error.status === "number") return `ERR_HTTP_${error.status}`;
  return fallback;
};

export const getErrorMessage = (error, fallback = "Unexpected error") => {
  if (!error) return fallback;
  if (typeof error === "string") return error;
  if (typeof error.message === "string" && error.message.trim()) return error.message.trim();
  return fallback;
};

export const formatErrorWithCode = (
  error,
  {
    fallbackMessage = "Something went wrong.",
    fallbackCode = DEFAULT_ERROR_CODE
  } = {}
) => {
  const code = getErrorCode(error, fallbackCode);
  const message = getErrorMessage(error, fallbackMessage);
  if (message.includes(code) || message.includes("ERR_CODE")) return message;
  return `${message} (ERR_CODE: ${code})`;
};

export const buildConnectionErrorMessage = (pageName, error) => {
  const safePage = String(pageName || "page");
  const code = getErrorCode(error, DEFAULT_ERROR_CODE);
  const httpMatch = /^ERR_HTTP_(\d+)$/.exec(code);
  const displayCode = httpMatch ? httpMatch[1] : code;
  return `Unexpected error connecting to "${safePage}".\nERR_CODE: ${displayCode}`;
};
