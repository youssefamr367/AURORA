async function parseJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

export async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const data = await parseJson(response);

  if (!response.ok) {
    const error = new Error(
      data.message || data.error || `Request failed with status ${response.status}`
    );
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export function getJson(url) {
  return requestJson(url);
}

export function postJson(url, body) {
  return requestJson(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function putJson(url, body) {
  return requestJson(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function deleteJson(url) {
  return requestJson(url, { method: "DELETE" });
}
