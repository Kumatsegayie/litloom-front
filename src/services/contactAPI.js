import { STRAPI_URL } from "./strapiBaseURL";

const cleanName = (value) => String(value || "").trim();
const cleanEmail = (value) => String(value || "").trim().toLowerCase();
const cleanMessage = (value) => String(value || "").trim();

async function safeFetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let json = {};

  try {
    json = text ? JSON.parse(text) : {};
  } catch (error) {
    json = {};
  }

  if (!response.ok) {
    const message = json?.error?.message || json?.message || text || `HTTP ${response.status}`;
    throw new Error(message);
  }

  return json;
}

export async function submitContactMessage({ name, email, message }) {
  const cleanContactName = cleanName(name);
  const cleanContactEmail = cleanEmail(email);
  const cleanContactMessage = cleanMessage(message);

  if (!cleanContactName || !cleanContactEmail || !cleanContactMessage) {
    throw new Error("Name, email and message are required");
  }

  const url = `${STRAPI_URL.replace(/\/$/, "")}/api/contact-messages/submit`;
  const response = await safeFetchJson(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name: cleanContactName,
      email: cleanContactEmail,
      message: cleanContactMessage
    })
  });

  return {
    message: response?.message || "Message sent successfully.",
    data: response?.data || null
  };
}

const contactAPI = {
  submitContactMessage
};

export default contactAPI;
