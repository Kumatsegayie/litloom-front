import { STRAPI_URL } from "./strapiBaseURL";

const cleanName = (value) => String(value || "").trim();
const cleanEmail = (value) => String(value || "").trim().toLowerCase();

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

export async function subscribeEmail({ name, email }) {
  const cleanSubscriberName = cleanName(name);
  const clean = cleanEmail(email);

  if (!cleanSubscriberName) {
    throw new Error("Name is required");
  }

  if (!clean) {
    throw new Error("Email is required");
  }

  const url = `${STRAPI_URL.replace(/\/$/, "")}/api/emails/subscribe`;
  const response = await safeFetchJson(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name: cleanSubscriberName,
      email: clean
    })
  });

  return {
    alreadySubscribed: Boolean(response?.alreadySubscribed),
    warning: Boolean(response?.warning),
    message:
      response?.message ||
      (response?.alreadySubscribed
        ? "This email is already subscribed."
        : "Subscription successful."),
    data: response?.data || null
  };
}

const subscriptionsAPI = {
  subscribeEmail
};

export default subscriptionsAPI;
