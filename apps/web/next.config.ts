import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      // ── CORS: allow the demo client (and production SDK consumers) ──────────
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          {
            key: "Access-Control-Allow-Origin",
            value: process.env.ALLOWED_ORIGIN ?? "http://localhost:5173",
          },
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization",
          },
        ],
      },
      // ── Security headers: applied to every route ────────────────────────────
      {
        source: "/:path*",
        headers: [
          // Prevent clickjacking — no iframes allowed
          { key: "X-Frame-Options", value: "DENY" },
          // Prevent MIME-type sniffing attacks
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Don't leak the full URL in the Referer header to third parties
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Force HTTPS for 1 year (only meaningful in production)
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          // Disable access to powerful browser features we don't use
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
