const LEGACY_BASE =
  process.env.LEGACY_PHP_BASE_URL ||
  "https://moeezshakir56portfolio.kesug.com/fyp-rrh-backend-folder/legacy-backend";

function buildUrl(endpoint, reqUrl) {
  const incoming = new URL(reqUrl);
  const target = new URL(`${LEGACY_BASE}/${endpoint}`);
  incoming.searchParams.forEach((value, key) => {
    target.searchParams.append(key, value);
  });
  return target.toString();
}

async function forward(req, context, method) {
  const endpoint = context.params.endpoint;
  const url = buildUrl(endpoint, req.url);

  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("content-length");

  const contentType = req.headers.get("content-type") || "";
  let body;

  if (method !== "GET") {
    if (contentType.includes("multipart/form-data")) {
      body = await req.formData();
      headers.delete("content-type");
    } else if (contentType.includes("application/json")) {
      body = JSON.stringify(await req.json());
      headers.set("content-type", "application/json");
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      body = new URLSearchParams(await req.text());
      headers.delete("content-type");
    } else {
      body = await req.text();
    }
  }

  const response = await fetch(url, {
    method,
    headers,
    body,
    cache: "no-store",
  });

  const responseHeaders = new Headers(response.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");

  const responseBody = await response.arrayBuffer();

  return new Response(responseBody, {
    status: response.status,
    headers: responseHeaders,
  });
}

export async function GET(req, context) {
  return forward(req, context, "GET");
}

export async function POST(req, context) {
  return forward(req, context, "POST");
}

export async function PUT(req, context) {
  return forward(req, context, "PUT");
}

export async function DELETE(req, context) {
  return forward(req, context, "DELETE");
}
