const BASE = "http://127.0.0.1:8000";

async function errorMessage(res, path) {
  try {
    const data = await res.json();
    const detail = data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      return detail.map((d) => `${(d.loc || []).slice(1).join(".")}: ${d.msg}`).join("; ");
    }
  } catch {
    // response body wasn't JSON; fall through to the generic message
  }
  return `${path} → ${res.status}`;
}

async function get(path) {
  const res = await fetch(BASE + path);
  if (!res.ok) throw new Error(await errorMessage(res, path));
  return res.json();
}

async function post(path, body) {
  const res = await fetch(BASE + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await errorMessage(res, path));
  return res.json();
}

export const api = {
  featureRanges: () => get("/api/feature-ranges"),
  predict: (values) => post("/api/predict", values),
};
