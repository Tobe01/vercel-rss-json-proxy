import { XMLParser } from "fast-xml-parser";

export default async function handler(req, res) {
  try {
    const feedUrl = req.query.url;
    if (!feedUrl) {
      res.status(400).json({ error: "Missing url query parameter" });
      return;
    }

    const clientIfNoneMatch = req.headers["if-none-match"] || "";

    const originResp = await fetch(feedUrl, {
      headers: clientIfNoneMatch ? { "If-None-Match": clientIfNoneMatch } : {},
    });

    if (originResp.status === 304) {
      res.status(304).end();
      return;
    }

    if (!originResp.ok) {
      res.status(originResp.status).json({ error: `Upstream error ${originResp.status}` });
      return;
    }

    const etag = originResp.headers.get("etag") || "";
    const cacheControl =
      originResp.headers.get("cache-control") || "public, max-age=300, stale-while-revalidate=60";

    const xml = await originResp.text();

    const parser = new XMLParser({
      ignoreAttributes: true,
      attributeNamePrefix: "",
      trimValues: true,
    });
    const rss = parser.parse(xml);

    const channel = rss?.rss?.channel || rss?.feed;
    if (!channel) {
      res.status(422).json({ error: "Unsupported feed format" });
      return;
    }

    const items =
      (channel.item || channel.entry || []).map((it) => {
        const link =
          typeof it.link === "string"
            ? it.link
            : Array.isArray(it.link)
            ? it.link[0]?.href || it.link[0]
            : it.link?.href || it.link?.["@_href"] || "";

        return {
          title: it.title?.["#text"] || it.title || "",
          link,
          pubDate: it.pubDate || it.updated || it.published || "",
          description: it.description || it.summary || "",
        };
      }) || [];

    const payload = {
      title: channel.title?.["#text"] || channel.title || "",
      link:
        typeof channel.link === "string"
          ? channel.link
          : channel.link?.href || channel.link?.["@_href"] || "",
      lastBuildDate: channel.lastBuildDate || channel.updated || "",
      items,
    };

    if (etag) res.setHeader("ETag", etag);
    res.setHeader("Cache-Control", cacheControl);

    res.status(200).json(payload);
  } catch (err) {
    res.status(500).json({ error: "Server error", detail: String(err?.message || err) });
  }
}