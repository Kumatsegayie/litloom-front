const CONFIGURED_STRAPI_PORT = String(process.env.REACT_APP_STRAPI_PORT || "").trim();
const LOCAL_OR_PRIVATE_HOST_RE =
  /^(localhost|127\.0\.0\.1|::1|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})$/i;
const LOOPBACK_HOST_RE = /^(localhost|127\.0\.0\.1|::1)$/i;

function shouldUseLocalApiPort(hostname, port) {
  const host = String(hostname || "").trim();
  const p = String(port || "").trim();
  if (!LOCAL_OR_PRIVATE_HOST_RE.test(host)) return false;
  // Browsers report empty port on default HTTP/HTTPS (80/443). For local/LAN setups,
  // still prefer the Strapi API port unless we're already on 1337.
  if (!p) return true;
  return p !== "1337";
}

function rewriteLoopbackAbsoluteUrl(raw) {
  if (typeof window === "undefined" || !window.location) return raw;
  try {
    const parsed = new URL(raw);
    if (!LOOPBACK_HOST_RE.test(String(parsed.hostname || "").trim())) return raw;

    const runtimeHost = String(window.location.hostname || "").trim();
    if (!runtimeHost || LOOPBACK_HOST_RE.test(runtimeHost)) return raw;

    parsed.hostname = runtimeHost;
    return parsed.toString();
  } catch {
    return raw;
  }
}

function cleanAbsoluteHttpUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (!/^https?:\/\//i.test(raw)) return "";
  return raw.replace(/\/$/, "");
}

function normalizeBaseUrl(value) {
  const cleaned = cleanAbsoluteHttpUrl(value);
  if (!cleaned) return "";

  try {
    const parsed = new URL(cleaned);
    let pathname = String(parsed.pathname || "").replace(/\/+$/, "");

    // Guard against common misconfiguration:
    // REACT_APP_STRAPI_URL=http://host:1337/api (or /admin)
    if (/^\/(api|admin)$/i.test(pathname)) {
      pathname = "";
    }

    return `${parsed.origin}${pathname}`;
  } catch {
    return cleaned.replace(/\/(api|admin)\/?$/i, "");
  }
}

function fromWindowLocation() {
  if (typeof window === "undefined" || !window.location) return "";
  const protocol = window.location.protocol || "http:";
  const hostname = window.location.hostname || "";
  const currentPort = String(window.location.port || "").trim();

  if (CONFIGURED_STRAPI_PORT) {
    if (!hostname) return "";
    return `${protocol}//${hostname}:${CONFIGURED_STRAPI_PORT}`;
  }

  // Local/LAN fallback: frontend often runs on :3000 while Strapi runs on :1337.
  if (hostname && shouldUseLocalApiPort(hostname, currentPort)) {
    return `${protocol}//${hostname}:1337`;
  }

  return window.location.origin || "";
}

const envBaseUrl = normalizeBaseUrl(process.env.REACT_APP_STRAPI_URL);
const useRelativeProxyBase =
  process.env.NODE_ENV === "development" && !envBaseUrl && !CONFIGURED_STRAPI_PORT;

export const STRAPI_URL = useRelativeProxyBase
  ? ""
  : envBaseUrl || normalizeBaseUrl(fromWindowLocation()) || "";

export function toAbsoluteStrapiUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw.startsWith("data:") || raw.startsWith("blob:")) {
    return raw;
  }
  if (/^https?:\/\//i.test(raw)) {
    return rewriteLoopbackAbsoluteUrl(raw);
  }
  if (/^\/\//.test(raw)) {
    if (typeof window === "undefined" || !window.location) return raw;
    return rewriteLoopbackAbsoluteUrl(`${window.location.protocol}${raw}`);
  }
  if (!raw.startsWith("/")) return STRAPI_URL ? `${STRAPI_URL}/${raw}` : `/${raw}`;
  return STRAPI_URL ? `${STRAPI_URL}${raw}` : raw;
}
