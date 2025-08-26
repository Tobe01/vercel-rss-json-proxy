# vercel-rss-json-proxy

Turn any RSS or Atom feed into a small JSON API on Vercel. Honors origin ETag and Cache-Control for real HTTP caching.

## Endpoints

- `GET /api/rss?url=<encoded_feed_url>`

Example:
/api/rss?url=https%3A%2F%2Fhnrss.org%2Ffrontpage

bash
Copy
Edit

## Response

```json
{
  "title": "Feed title",
  "link": "https://example.com",
  "lastBuildDate": "2025-08-24T10:00:00.000Z",
  "items": [
    { "title": "Post", "link": "https://...", "pubDate": "2025-08-23T08:00:00.000Z", "description": "..." }
  ]
}
Caching
Passes through ETag from the origin.

Forwards client If-None-Match to the origin.

Sets Cache-Control from the origin if present. Falls back to public, max-age=300, stale-while-revalidate=60.

Browsers and the Vercel CDN can cache responses. If the feed is unchanged, the origin may return 304 Not Modified.

Local dev
bash
Copy
Edit
npm i
npx vercel dev
# open http://localhost:3000/api/rss?url=https%3A%2F%2Fhnrss.org%2Ffrontpage
Deploy
bash
Copy
Edit
npx vercel
Security
Whitelist feed hosts if needed. For example, allow only your own feeds.

Consider adding a simple HMAC signature for approved clients.

Notes
No persistence used. Add Vercel KV if you need global rate limiting.

Parser: fast-xml-parser with minimal config.