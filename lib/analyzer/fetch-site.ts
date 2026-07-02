import * as cheerio from "cheerio";
import type { SiteSignals } from "./signals";

const FETCH_TIMEOUT_MS = 15_000;
const MAX_HTML_BYTES = 3_000_000;

const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^0\.0\.0\.0$/,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^169\.254\./,
  /\.local$/i,
  /^\[?::1\]?$/,
  /^\[?f[cd][0-9a-f]{2}:/i,
];

export class AnalyzeError extends Error {}

export function assertPublicUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new AnalyzeError("That doesn't look like a valid URL.");
  }
  if (!/^https?:$/.test(url.protocol)) {
    throw new AnalyzeError("Only http(s) websites can be roasted.");
  }
  // ALLOW_PRIVATE_ROAST=1 lets developers roast localhost apps in local dev.
  // Never enable it on a deployed instance — it opens SSRF to internal hosts.
  if (process.env.ALLOW_PRIVATE_ROAST === "1") {
    return url;
  }
  if (PRIVATE_HOST_PATTERNS.some((p) => p.test(url.hostname))) {
    throw new AnalyzeError(
      "Private or local addresses can't be roasted. Nice try though."
    );
  }
  if (!url.hostname.includes(".")) {
    throw new AnalyzeError("That hostname doesn't look like a public website.");
  }
  return url;
}

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      cache: "no-store",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 WebsiteRoastBot/1.0",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (w.length <= 3) return 1;
  const groups = w
    .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "")
    .match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups ? groups.length : 1);
}

function fleschReadingEase(text: string): {
  score: number | null;
  avgSentenceLength: number | null;
} {
  const sentences = text
    .split(/[.!?]+\s/)
    .map((s) => s.trim())
    .filter((s) => s.split(/\s+/).length > 2);
  const words = text.split(/\s+/).filter((w) => /[a-zA-Z]/.test(w));
  if (sentences.length < 3 || words.length < 60) {
    return { score: null, avgSentenceLength: null };
  }
  const syllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
  const wps = words.length / sentences.length;
  const spw = syllables / words.length;
  const score = 206.835 - 1.015 * wps - 84.6 * spw;
  return {
    score: Math.round(Math.max(0, Math.min(100, score))),
    avgSentenceLength: Math.round(wps),
  };
}

const GENERIC_ANCHORS = new Set([
  "click here",
  "here",
  "read more",
  "learn more",
  "more",
  "link",
  "this",
]);

const CTA_HINTS = [
  "sign up",
  "signup",
  "get started",
  "start free",
  "try free",
  "try it",
  "buy",
  "subscribe",
  "join",
  "download",
  "book",
  "request demo",
  "get demo",
  "contact sales",
  "start now",
  "shop",
  "order",
  "donate",
  "apply",
  "register",
  "get a quote",
];

const DEPRECATED_TAGS = ["marquee", "blink", "center", "font", "frameset", "frame"];

function detectTech($: cheerio.CheerioAPI, html: string): string[] {
  const detected: string[] = [];
  const lower = html.toLowerCase();
  if (lower.includes("/_next/") || $("#__next, #__NEXT_DATA__").length) detected.push("Next.js");
  else if (lower.includes("data-reactroot") || lower.includes("react")) {
    if ($("[data-reactroot]").length || lower.includes("_react")) detected.push("React");
  }
  if (lower.includes("wp-content") || lower.includes("wp-includes")) detected.push("WordPress");
  if (lower.includes("cdn.shopify.com")) detected.push("Shopify");
  if (lower.includes("data-v-app") || lower.includes("__nuxt")) detected.push("Vue/Nuxt");
  if (lower.includes("ng-version")) detected.push("Angular");
  if (lower.includes("wix.com") && lower.includes("wixstatic")) detected.push("Wix");
  if (lower.includes("squarespace")) detected.push("Squarespace");
  if (lower.includes("gatsby")) detected.push("Gatsby");
  if (lower.includes("webflow")) detected.push("Webflow");
  if ($("[data-svelte-h]").length || lower.includes("__sveltekit")) detected.push("SvelteKit");
  if (lower.includes("jquery")) detected.push("jQuery");
  if (lower.includes("bootstrap")) detected.push("Bootstrap");
  if (/class="[^"]*(?:flex|grid|text-\w+|bg-\w+|px-\d)[^"]*"/.test(html)) detected.push("Tailwind CSS (likely)");
  return [...new Set(detected)];
}

function extractColors(html: string, $: cheerio.CheerioAPI): string[] {
  const css =
    $("style")
      .map((_, el) => $(el).text())
      .get()
      .join("\n") +
    "\n" +
    $("[style]")
      .map((_, el) => $(el).attr("style") ?? "")
      .get()
      .join("\n");
  const hexes = css.match(/#(?:[0-9a-fA-F]{3}){1,2}\b/g) ?? [];
  const normalized = hexes.map((h) => {
    const v = h.toLowerCase();
    return v.length === 4 ? `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}` : v;
  });
  return [...new Set(normalized)].slice(0, 24);
}

function extractFonts($: cheerio.CheerioAPI, html: string): {
  families: string[];
  googleCount: number;
} {
  const families = new Set<string>();
  const css = $("style")
    .map((_, el) => $(el).text())
    .get()
    .join("\n");
  const matches = css.match(/font-family\s*:\s*([^;}{]+)/gi) ?? [];
  for (const m of matches) {
    const first = m
      .replace(/font-family\s*:\s*/i, "")
      .split(",")[0]
      .replace(/["']/g, "")
      .trim();
    if (first && !first.startsWith("var(")) families.add(first);
  }
  let googleCount = 0;
  $('link[href*="fonts.googleapis.com"]').each((_, el) => {
    const href = $(el).attr("href") ?? "";
    const fam = href.match(/family=([^&]+)/);
    if (fam) {
      googleCount += fam[1].split(/[|&]/).length;
      fam[1]
        .split("|")
        .map((f) => decodeURIComponent(f.split(":")[0]).replace(/\+/g, " "))
        .forEach((f) => families.add(f));
    }
  });
  if (/fonts\.gstatic\.com/.test(html) && googleCount === 0) googleCount = 1;
  return { families: [...families].slice(0, 12), googleCount };
}

export async function collectSignals(inputUrl: string): Promise<SiteSignals> {
  const url = assertPublicUrl(inputUrl);

  const started = Date.now();
  let res: Response;
  try {
    res = await fetchWithTimeout(url.toString());
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new AnalyzeError(
        `The site took longer than ${FETCH_TIMEOUT_MS / 1000}s to respond. That's a roast in itself, but we need HTML to work with.`
      );
    }
    throw new AnalyzeError(
      "Couldn't reach that website. Check the URL — or maybe the site is as dead as its design trends."
    );
  }
  const responseTimeMs = Date.now() - started;

  if (!res.ok && res.status !== 403 && res.status !== 401) {
    throw new AnalyzeError(
      `The site responded with HTTP ${res.status}. There's nothing to roast but the error page.`
    );
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (contentType && !contentType.includes("html") && !contentType.includes("xml")) {
    throw new AnalyzeError(
      `That URL returns "${contentType.split(";")[0]}", not a web page. We roast websites, not files.`
    );
  }

  const raw = await res.text();
  const html = raw.slice(0, MAX_HTML_BYTES);
  const htmlSizeKb = Math.round(Buffer.byteLength(raw, "utf8") / 1024);
  const finalUrl = res.url || url.toString();
  const finalParsed = new URL(finalUrl);

  const $ = cheerio.load(html);

  const textClone = cheerio.load(html);
  textClone("script, style, noscript, svg, template").remove();
  const bodyText = textClone("body").text().replace(/\s+/g, " ").trim();
  const words = bodyText.split(/\s+/).filter(Boolean);
  const { score: flesch, avgSentenceLength } = fleschReadingEase(bodyText);

  // Headings
  const headingCounts: Record<string, number> = {};
  let skippedHeadingLevels = false;
  const presentLevels: number[] = [];
  for (let i = 1; i <= 6; i++) {
    const count = $(`h${i}`).length;
    headingCounts[`h${i}`] = count;
    if (count > 0) presentLevels.push(i);
  }
  for (let i = 1; i < presentLevels.length; i++) {
    if (presentLevels[i] - presentLevels[i - 1] > 1) skippedHeadingLevels = true;
  }
  if (presentLevels.length > 0 && presentLevels[0] > 1) skippedHeadingLevels = true;

  // Images
  const imgs = $("img");
  const imgCount = imgs.length;
  let imgMissingAlt = 0;
  let imgLazyLoaded = 0;
  imgs.each((_, el) => {
    const alt = $(el).attr("alt");
    if (alt === undefined || alt.trim() === "") imgMissingAlt++;
    if ($(el).attr("loading") === "lazy") imgLazyLoaded++;
  });
  const usesModernImageFormats =
    /\.(webp|avif)(\?|"|'|\s|$)/i.test(html) || $("picture source[type='image/webp'], picture source[type='image/avif']").length > 0;

  // Links
  const anchors = $("a");
  let internalLinks = 0;
  let externalLinks = 0;
  let emptyAnchors = 0;
  const genericAnchorTexts: string[] = [];
  anchors.each((_, el) => {
    const href = ($(el).attr("href") ?? "").trim();
    const text = $(el).text().replace(/\s+/g, " ").trim().toLowerCase();
    const hasAccessibleName =
      text.length > 0 || !!$(el).attr("aria-label") || $(el).find("img[alt]").length > 0;
    if (!hasAccessibleName) emptyAnchors++;
    if (text && GENERIC_ANCHORS.has(text)) genericAnchorTexts.push(text);
    if (!href || href.startsWith("#") || href.startsWith("javascript:")) return;
    try {
      const abs = new URL(href, finalUrl);
      if (abs.hostname === finalParsed.hostname) internalLinks++;
      else externalLinks++;
    } catch {
      /* ignore malformed */
    }
  });

  // Scripts & styles
  const scripts = $("script");
  const externalScripts = $("script[src]");
  const usesAsyncOrDefer =
    $("script[src][async], script[src][defer], script[src][type='module']").length > 0;
  const inlineStyleAttrCount = $("[style]").length;

  // Buttons / CTA
  const buttonTexts: string[] = [];
  $("button, a[class*='btn'], a[class*='button'], input[type='submit'], a[role='button']").each(
    (_, el) => {
      const t =
        ($(el).text() || $(el).attr("value") || $(el).attr("aria-label") || "")
          .replace(/\s+/g, " ")
          .trim();
      if (t && t.length < 60) buttonTexts.push(t);
    }
  );
  const allClickableText = [
    ...buttonTexts,
    ...anchors.map((_, el) => $(el).text().replace(/\s+/g, " ").trim()).get(),
  ];
  const ctaCandidates = [
    ...new Set(
      allClickableText.filter((t) => {
        const lower = t.toLowerCase();
        return t.length < 60 && CTA_HINTS.some((h) => lower.includes(h));
      })
    ),
  ].slice(0, 10);

  // Trust
  const linkTextAndHref = anchors
    .map((_, el) => `${$(el).text().toLowerCase()} ${($(el).attr("href") ?? "").toLowerCase()}`)
    .get()
    .join("\n");
  const socialHosts = ["twitter.com", "x.com", "facebook.com", "instagram.com", "linkedin.com", "youtube.com", "github.com", "tiktok.com"];
  const socialLinkCount = socialHosts.filter((h) => linkTextAndHref.includes(h)).length;
  const copyrightMatch = bodyText.match(/(?:©|&copy;|copyright)\s*(\d{4})/i);

  // A11y
  const inputs = $("input:not([type='hidden']), textarea, select");
  let unlabelledInputs = 0;
  inputs.each((_, el) => {
    const id = $(el).attr("id");
    const hasLabel =
      (!!id && $(`label[for='${id}']`).length > 0) ||
      $(el).parents("label").length > 0 ||
      !!$(el).attr("aria-label") ||
      !!$(el).attr("aria-labelledby") ||
      !!$(el).attr("placeholder");
    if (!hasLabel) unlabelledInputs++;
  });
  const ariaAttributeCount = (html.match(/\saria-[a-z]+=/g) ?? []).length;
  const positiveTabIndexCount = $("[tabindex]").filter((_, el) => {
    const v = parseInt($(el).attr("tabindex") ?? "0", 10);
    return v > 0;
  }).length;
  const hasSkipLink =
    $("a[href^='#']")
      .filter((_, el) => /skip/i.test($(el).text()))
      .length > 0;

  // Mobile
  const viewportContent = $("meta[name='viewport']").attr("content") ?? null;
  const fixedWidthViewport =
    !!viewportContent && /width\s*=\s*\d{3,}/.test(viewportContent);

  // Meta / SEO
  const title = $("head title").first().text().trim() || null;
  const metaDescription =
    $("meta[name='description']").attr("content")?.trim() || null;
  const canonical = $("link[rel='canonical']").attr("href") ?? null;
  const charset =
    $("meta[charset]").attr("charset") ??
    ($("meta[http-equiv='Content-Type']").attr("content")?.match(/charset=([\w-]+)/)?.[1] ?? null);
  const lang = $("html").attr("lang")?.trim() || null;
  const faviconHref =
    $("link[rel='icon'], link[rel='shortcut icon'], link[rel='apple-touch-icon']")
      .first()
      .attr("href") ?? null;
  const faviconUrl = faviconHref ? new URL(faviconHref, finalUrl).toString() : null;
  const robotsMeta = $("meta[name='robots']").attr("content") ?? null;
  const structuredDataBlocks = $("script[type='application/ld+json']").length;

  const deprecatedTags = DEPRECATED_TAGS.filter((t) => $(t).length > 0);
  const fonts = extractFonts($, html);
  const colors = extractColors(html, $);

  return {
    url: url.toString(),
    finalUrl,
    domain: finalParsed.hostname.replace(/^www\./, ""),
    https: finalParsed.protocol === "https:",
    redirected: res.redirected,
    statusCode: res.status,
    responseTimeMs,
    htmlSizeKb,
    headers: {
      contentEncoding: res.headers.get("content-encoding"),
      cacheControl: res.headers.get("cache-control"),
      hsts: res.headers.has("strict-transport-security"),
      contentSecurityPolicy: res.headers.has("content-security-policy"),
      xFrameOptions:
        res.headers.has("x-frame-options") ||
        (res.headers.get("content-security-policy") ?? "").includes("frame-ancestors"),
      server: res.headers.get("server"),
    },
    title,
    titleLength: title?.length ?? 0,
    metaDescription,
    metaDescriptionLength: metaDescription?.length ?? 0,
    canonical,
    charset,
    lang,
    faviconUrl,
    robotsMeta,
    og: {
      title: $("meta[property='og:title']").attr("content") ?? null,
      description: $("meta[property='og:description']").attr("content") ?? null,
      image: $("meta[property='og:image']").attr("content") ?? null,
    },
    twitterCard: $("meta[name='twitter:card']").attr("content") ?? null,
    structuredDataBlocks,
    h1Count: headingCounts.h1,
    h1Text: $("h1").first().text().replace(/\s+/g, " ").trim() || null,
    headingCounts,
    skippedHeadingLevels,
    wordCount: words.length,
    fleschReadingEase: flesch,
    avgSentenceLength,
    imgCount,
    imgMissingAlt,
    imgLazyLoaded,
    usesModernImageFormats,
    linkCount: anchors.length,
    internalLinks,
    externalLinks,
    emptyAnchors,
    genericAnchorTexts: [...new Set(genericAnchorTexts)],
    scriptCount: scripts.length,
    externalScriptCount: externalScripts.length,
    stylesheetCount: $("link[rel='stylesheet']").length,
    inlineStyleAttrCount,
    usesAsyncOrDefer,
    fontFamilies: fonts.families,
    googleFontFamilies: fonts.googleCount,
    colorPalette: colors,
    distinctColorCount: colors.length,
    buttonTexts: [...new Set(buttonTexts)].slice(0, 15),
    ctaCandidates,
    formCount: $("form").length,
    hasSearch:
      $("input[type='search'], form[role='search'], [class*='search'] input").length > 0,
    trust: {
      hasContactLink: /contact/.test(linkTextAndHref),
      hasPrivacyLink: /privacy/.test(linkTextAndHref),
      hasTermsLink: /terms|conditions/.test(linkTextAndHref),
      hasAboutLink: /about/.test(linkTextAndHref),
      socialLinkCount,
      copyrightYearFound: copyrightMatch ? parseInt(copyrightMatch[1], 10) : null,
    },
    a11y: {
      imgAltCoveragePct:
        imgCount > 0 ? Math.round(((imgCount - imgMissingAlt) / imgCount) * 100) : null,
      hasSkipLink,
      ariaAttributeCount,
      unlabelledInputs,
      totalInputs: inputs.length,
      positiveTabIndexCount,
    },
    mobile: {
      hasViewportMeta: viewportContent !== null,
      viewportContent,
      fixedWidthViewport,
    },
    tech: {
      detected: detectTech($, html),
      deprecatedTags,
    },
  };
}
