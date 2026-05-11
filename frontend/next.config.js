/** @type {import('next').NextConfig} */

function normalizeNextPublicApiUrl(value) {
  let s = (value || "").trim();
  if (!s) return "";
  if (s.includes(",")) {
    // eslint-disable-next-line no-console
    console.warn(
      "[next.config] NEXT_PUBLIC_API_URL tiene comas (varias URLs). Solo debe haber UNA. Usando la primera entrada.",
    );
    s = s.split(",")[0].trim();
  }
  return s.replace(/\/+$/, "");
}

const rawApi = normalizeNextPublicApiUrl(process.env.NEXT_PUBLIC_API_URL);

function buildImageRemotePatterns() {
  if (!rawApi) return [];
  try {
    const u = new URL(rawApi);
    const pattern = {
      protocol: u.protocol.replace(":", ""),
      hostname: u.hostname,
    };
    if (u.port) {
      pattern.port = u.port;
    }
    return [pattern];
  } catch {
    return [];
  }
}

const nextConfig = {
  output: "standalone",

  env: {
    NEXT_PUBLIC_API_URL: rawApi,
    NEXT_PUBLIC_APP_NAME:
      process.env.NEXT_PUBLIC_APP_NAME || "OftalmoCRM",
  },

  images: {
    remotePatterns: buildImageRemotePatterns(),
  },

  async rewrites() {
    if (!rawApi) {
      return [];
    }
    return [
      {
        source: "/api/:path*",
        destination: `${rawApi}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
