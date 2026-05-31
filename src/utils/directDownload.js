const sanitizeFilename = (value, fallback = "download") => {
  const raw = String(value || "").trim();
  const sanitized = raw.replace(/[\\/:*?"<>|]/g, "_");
  return sanitized || fallback;
};

const fileNameFromDisposition = (headerValue) => {
  if (!headerValue) return "";
  const utfMatch = /filename\*=UTF-8''([^;]+)/i.exec(headerValue);
  if (utfMatch && utfMatch[1]) {
    try {
      return decodeURIComponent(utfMatch[1]);
    } catch (e) {
      return utfMatch[1];
    }
  }
  const plainMatch = /filename="?([^"]+)"?/i.exec(headerValue);
  return plainMatch?.[1] || "";
};

export const directDownload = async (url, preferredName = "download") => {
  if (!url) throw new Error("No download URL provided.");

  const response = await fetch(url, { method: "GET" });
  if (!response.ok) {
    throw new Error(`Download failed (HTTP ${response.status})`);
  }

  const blob = await response.blob();
  const dispositionName = fileNameFromDisposition(response.headers.get("content-disposition"));
  const outputName = sanitizeFilename(dispositionName || preferredName, "download");

  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = outputName;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
};

export const openPdfReader = async (url) => {
  if (!url) throw new Error("No PDF URL provided.");

  const popup = window.open("", "_blank", "noopener,noreferrer");
  const readerSuffix = "#toolbar=1&navpanes=0&view=FitH";

  try {
    const response = await fetch(url, { method: "GET" });
    if (!response.ok) {
      throw new Error(`Read failed (HTTP ${response.status})`);
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const readerUrl = `${objectUrl}${readerSuffix}`;

    if (popup && !popup.closed) {
      popup.location.href = readerUrl;
    } else {
      window.open(readerUrl, "_blank", "noopener,noreferrer");
    }

    // Keep object URL alive long enough for browser PDF viewer sessions.
    setTimeout(() => URL.revokeObjectURL(objectUrl), 10 * 60 * 1000);
  } catch (error) {
    const fallbackUrl = `${url}${readerSuffix}`;
    if (popup && !popup.closed) {
      popup.location.href = fallbackUrl;
    } else {
      window.open(fallbackUrl, "_blank", "noopener,noreferrer");
    }
  }
};

export { sanitizeFilename };
