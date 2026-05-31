const RETRYABLE_STATUS = new Set([404, 405, 502, 503, 504]);
const STRAPI_PORT = String(process.env.REACT_APP_STRAPI_PORT || "").trim();
const STRAPI_ORIGIN = String(process.env.REACT_APP_STRAPI_URL || "").trim().replace(/\/$/, "");
const LOCAL_OR_PRIVATE_HOST_RE =
  /^(localhost|127\.0\.0\.1|::1|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})$/i;

function normalizeOrigin(rawValue = "") {
  const raw = String(rawValue || "").trim();
  if (!raw || !/^https?:\/\//i.test(raw)) return "";

  try {
    const parsed = new URL(raw);
    let pathname = String(parsed.pathname || "").replace(/\/+$/, "");
    if (/^\/(api|admin)$/i.test(pathname)) {
      pathname = "";
    }
    return `${parsed.origin}${pathname}`;
  } catch {
    return raw.replace(/\/(api|admin)\/?$/i, "");
  }
}

function isApiOrUploadPath(pathname = "") {
  return pathname.startsWith("/api/") || pathname.startsWith("/uploads/");
}

function resolveRetryUrl(targetUrl, backendOrigin) {
  if (!isApiOrUploadPath(targetUrl.pathname)) return null;
  const currentOrigin = window.location.origin;

  if (targetUrl.origin === currentOrigin) {
    return `${backendOrigin}${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`;
  }

  if (targetUrl.origin === backendOrigin) {
    return `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`;
  }

  return null;
}

function inferLocalBackendOrigin() {
  const protocol = window.location.protocol || "http:";
  const hostname = String(window.location.hostname || "").trim();
  const port = String(window.location.port || "").trim();
  if (!hostname || !LOCAL_OR_PRIVATE_HOST_RE.test(hostname)) return "";
  // Empty port means default 80/443 in browser; still prefer local Strapi port.
  if (port === "1337") return "";
  return `${protocol}//${hostname}:1337`;
}

export function installFetchFallback() {
  if (typeof window === "undefined" || typeof window.fetch !== "function") return;
  if (window.__litloomFetchFallbackInstalled) return;

  const nativeFetch = window.fetch.bind(window);
  const backendOrigin =
    normalizeOrigin(STRAPI_ORIGIN) ||
    (STRAPI_PORT
      ? `${window.location.protocol}//${window.location.hostname}:${STRAPI_PORT}`
      : inferLocalBackendOrigin() || window.location.origin);

  window.fetch = async (input, init) => {
    const canRetry = typeof input === "string" || input instanceof URL;
    if (!canRetry) return nativeFetch(input, init);

    let primaryUrl;
    try {
      primaryUrl = new URL(String(input), window.location.origin);
    } catch {
      return nativeFetch(input, init);
    }

    const retryUrl = resolveRetryUrl(primaryUrl, backendOrigin);
    if (!retryUrl || retryUrl === String(input)) {
      return nativeFetch(input, init);
    }

    try {
      const response = await nativeFetch(input, init);
      if (!RETRYABLE_STATUS.has(response.status)) {
        return response;
      }
      return nativeFetch(retryUrl, init);
    } catch (error) {
      try {
        return await nativeFetch(retryUrl, init);
      } catch {
        throw error;
      }
    }
  };

  window.__litloomFetchFallbackInstalled = true;
}
