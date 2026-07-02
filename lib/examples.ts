export interface ExampleSite {
  url: string;
  label: string;
}

export const EXAMPLE_SITES: ExampleSite[] = [
  { url: "https://stripe.com", label: "stripe.com" },
  { url: "https://vercel.com", label: "vercel.com" },
  { url: "https://news.ycombinator.com", label: "news.ycombinator.com" },
  { url: "https://craigslist.org", label: "craigslist.org" },
  { url: "https://linear.app", label: "linear.app" },
  { url: "https://wikipedia.org", label: "wikipedia.org" },
];

export const RANDOM_ROAST_POOL: string[] = [
  ...EXAMPLE_SITES.map((s) => s.url),
  "https://example.com",
  "https://berkshirehathaway.com",
  "https://spacejam.com/1996/",
  "https://nasa.gov",
  "https://github.com",
  "https://notion.so",
];
