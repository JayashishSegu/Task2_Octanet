import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://website-roast.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/history`, changeFrequency: "weekly", priority: 0.5 },
    { url: `${siteUrl}/leaderboard`, changeFrequency: "weekly", priority: 0.5 },
  ];
}
