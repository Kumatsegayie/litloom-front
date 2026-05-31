import { createAppError, isAppError } from "../utils/errorUtils";
import { STRAPI_URL } from "./strapiBaseURL";
export { STRAPI_URL };

const toHttpCode = (status) => `ERR_HTTP_${status}`;

async function parseErrorBody(res) {
  try {
    const text = await res.text();
    if (!text) return "";
    try {
      const json = JSON.parse(text);
      return json?.error?.message || json?.message || text;
    } catch {
      return text;
    }
  } catch {
    return "";
  }
}

async function handleResponse(res) {
  if (!res.ok) {
    const text = await parseErrorBody(res);
    throw createAppError(text || `Request failed with status ${res.status}`, {
      code: toHttpCode(res.status),
      status: res.status
    });
  }
  return res.json();
}

function mapBook(item) {
  if (!item) return null;
  return {
    ...item,
    id: item.documentId || item.id,
    slug: item.slug || ""
  };
}

async function tryFetchBySlug(slug) {
  const safeSlug = String(slug || "").trim();
  if (!safeSlug) return null;
  const url =
    `${STRAPI_URL}/api/books?` +
    `filters[slug][$eq]=${encodeURIComponent(safeSlug)}` +
    `&populate[]=cover&populate[]=images&populate[]=pdf&populate[]=category&populate[]=tags&pagination[limit]=1`;
  const res = await fetch(url, { method: "GET" });
  const data = await handleResponse(res);
  const row = Array.isArray(data?.data) ? data.data[0] : null;
  return row ? mapBook(row) : null;
}

export async function getBook(id) {
  if (!id) {
    throw createAppError("Book ID is required", { code: "ERR_BAD_REQUEST" });
  }
  // Strapi v5 public REST: GET /api/books/:documentId?populate[]=cover&populate[]=images&populate[]=pdf&populate[]=category&populate[]=tags
  const docId = String(id || "").trim();
  const url = `${STRAPI_URL}/api/books/${docId}?populate[]=cover&populate[]=images&populate[]=pdf&populate[]=category&populate[]=tags`;
  try {
    const res = await fetch(url, { method: "GET" });
    const data = await handleResponse(res);
    if (data && data.data) {
      return mapBook(data.data);
    }
    const fallback = await tryFetchBySlug(docId);
    if (fallback) return fallback;
    throw createAppError("Book payload is empty", { code: "ERR_EMPTY_PAYLOAD" });
  } catch (error) {
    const fallback = await tryFetchBySlug(docId);
    if (fallback) return fallback;
    if (isAppError(error)) throw error;
    throw createAppError("Could not connect to books service", {
      code: "ERR_NETWORK",
      cause: error
    });
  }
}

export async function getBooks() {
  const url = `${STRAPI_URL}/api/books?populate[]=cover&populate[]=images&populate[]=pdf&populate[]=category&populate[]=tags`;
  try {
    const res = await fetch(url, { method: 'GET' });
    const data = await handleResponse(res);
    if (data && data.data) {
      return data.data.map((item) => mapBook(item)).filter(Boolean);
    }
    throw createAppError("Books payload is empty", { code: "ERR_EMPTY_PAYLOAD" });
  } catch (error) {
    if (isAppError(error)) throw error;
    throw createAppError("Could not connect to books service", {
      code: "ERR_NETWORK",
      cause: error
    });
  }
}

export async function createBookSubmission(formData) {
  const url = `${STRAPI_URL}/api/book-submissions/submit`;
  const res = await fetch(url, {
    method: 'POST',
    body: formData
  });
  return handleResponse(res);
}

const booksAPI = { getBook, getBooks, createBookSubmission };

export default booksAPI;
