import type { SiteSignals } from "./signals";
import type { CategoryKey, Improvement, Priority } from "@/lib/types";

export interface CheckResult {
  id: string;
  passed: boolean;
  /** Concrete observation from the fetched page — every roast/score cites this. */
  evidence: string;
  weight: number;
  categories: CategoryKey[];
  roast?: string;
  win?: string;
  improvement?: Omit<Improvement, "priority"> & { priority: Priority };
}

type CheckDef = (s: SiteSignals) => CheckResult | null;

const check = (r: CheckResult | null) => r;

/**
 * Every check below inspects a real signal collected from the live page.
 * A check that isn't applicable (e.g. alt coverage on a page with no images)
 * returns null and is excluded from scoring entirely — no invented problems.
 */
const CHECKS: CheckDef[] = [
  // ---------------------------------------------------------------- Performance
  (s) =>
    check({
      id: "response-time",
      passed: s.responseTimeMs < 1200,
      evidence: `Server responded in ${s.responseTimeMs}ms (${s.htmlSizeKb}KB of HTML).`,
      weight: 3,
      categories: ["performance"],
      roast:
        s.responseTimeMs >= 3000
          ? `${s.responseTimeMs}ms to serve one page of HTML. Continents have drifted faster.`
          : `A ${s.responseTimeMs}ms server response. Your backend is doing the "I'll be right there" thing that never ends well.`,
      win: `Snappy server: first byte of HTML arrived in ${s.responseTimeMs}ms.`,
      improvement: {
        issue: `Slow server response (${s.responseTimeMs}ms TTFB)`,
        whyItMatters:
          "Time-to-first-byte delays every other metric — LCP, FCP, and user patience. Google's guidance is under 800ms; conversion drops measurably for every extra second.",
        howToFix:
          "Add edge/CDN caching for HTML, enable static generation or ISR where possible, and profile slow database queries or blocking middleware.",
        expectedImpact: "Faster LCP across the whole site and better crawl budget usage.",
        priority: s.responseTimeMs >= 3000 ? "Critical" : "High",
      },
    }),
  (s) =>
    check({
      id: "html-weight",
      passed: s.htmlSizeKb < 400,
      evidence: `The HTML document alone weighs ${s.htmlSizeKb}KB.`,
      weight: 2,
      categories: ["performance", "developerQuality"],
      roast: `${s.htmlSizeKb}KB of raw HTML. That's not a web page, that's a novella with div soup.`,
      win: `Lean document: only ${s.htmlSizeKb}KB of HTML before assets.`,
      improvement: {
        issue: `Heavy HTML document (${s.htmlSizeKb}KB)`,
        whyItMatters:
          "Large documents slow parsing and first paint, especially on mobile CPUs and slow networks.",
        howToFix:
          "Remove inlined data blobs, paginate long lists, defer below-the-fold markup, and strip unused inline SVG/CSS.",
        expectedImpact: "Faster first paint and lower bandwidth cost per visit.",
        priority: "Medium",
      },
    }),
  (s) =>
    check({
      id: "compression",
      passed: s.headers.contentEncoding !== null || s.htmlSizeKb < 30,
      evidence: s.headers.contentEncoding
        ? `Responses are compressed with ${s.headers.contentEncoding}.`
        : `No Content-Encoding header — the ${s.htmlSizeKb}KB HTML ships uncompressed.`,
      weight: 2,
      categories: ["performance", "developerQuality"],
      roast:
        "Shipping uncompressed HTML in this economy? gzip has been free since 1992.",
      win: `Text compression is on (${s.headers.contentEncoding ?? "small payload"}).`,
      improvement: {
        issue: "No text compression (gzip/brotli) on the HTML response",
        whyItMatters:
          "Compression typically cuts HTML/CSS/JS transfer size by 60–80% — it's the cheapest performance win that exists.",
        howToFix:
          "Enable brotli or gzip at your CDN, reverse proxy, or web server (one config line in nginx/Apache/Caddy; automatic on Vercel/Netlify/Cloudflare).",
        expectedImpact: "Immediate 60–80% smaller text payloads for every visitor.",
        priority: "High",
      },
    }),
  (s) =>
    s.externalScriptCount === 0
      ? null
      : check({
          id: "script-count",
          passed: s.externalScriptCount <= 15,
          evidence: `${s.scriptCount} script tags on the page, ${s.externalScriptCount} of them external.`,
          weight: 2,
          categories: ["performance", "developerQuality"],
          roast: `${s.externalScriptCount} external scripts. Your page isn't loading, it's hosting a JavaScript family reunion.`,
          win: `Restrained JavaScript diet: ${s.externalScriptCount} external script${s.externalScriptCount === 1 ? "" : "s"}.`,
          improvement: {
            issue: `High script count (${s.externalScriptCount} external scripts)`,
            whyItMatters:
              "Each script adds network requests, parse/execute time, and main-thread blocking — the top cause of poor mobile performance.",
            howToFix:
              "Audit with the browser coverage tool, remove unused third-party tags, bundle what remains, and lazy-load non-critical scripts.",
            expectedImpact: "Lower Total Blocking Time and faster interactivity.",
            priority: "High",
          },
        }),
  (s) =>
    s.externalScriptCount === 0
      ? null
      : check({
          id: "async-defer",
          passed: s.usesAsyncOrDefer,
          evidence: s.usesAsyncOrDefer
            ? "External scripts use async/defer/module loading."
            : `None of the ${s.externalScriptCount} external scripts use async or defer.`,
          weight: 1,
          categories: ["performance", "developerQuality"],
          roast:
            "Every script loads synchronously, render-blocking like it's 2009 and we're all still on jQuery 1.4.",
          win: "Scripts load with async/defer — the render path isn't blocked.",
          improvement: {
            issue: "Render-blocking synchronous scripts",
            whyItMatters:
              "Synchronous scripts in <head> halt HTML parsing until they download and execute, directly delaying first paint.",
            howToFix:
              "Add `defer` to scripts that need DOM order, `async` to independent ones, or move them before </body>.",
            expectedImpact: "Faster First Contentful Paint with a one-word change per tag.",
            priority: "Medium",
          },
        }),
  (s) =>
    s.imgCount < 3
      ? null
      : check({
          id: "lazy-images",
          passed: s.imgLazyLoaded > 0 || s.imgCount < 8,
          evidence: `${s.imgCount} images, ${s.imgLazyLoaded} using loading="lazy".`,
          weight: 1,
          categories: ["performance"],
          roast: `${s.imgCount} images and not one of them lazy-loads. They all show up at once, like uninvited relatives.`,
          win: `Images lazy-load (${s.imgLazyLoaded}/${s.imgCount} tagged).`,
          improvement: {
            issue: "Images not lazy-loaded",
            whyItMatters:
              "Eagerly loading offscreen images wastes bandwidth and competes with critical resources during initial load.",
            howToFix: 'Add loading="lazy" to below-the-fold <img> elements.',
            expectedImpact: "Reduced initial payload and faster LCP.",
            priority: "Medium",
          },
        }),
  (s) =>
    s.imgCount < 3
      ? null
      : check({
          id: "modern-images",
          passed: s.usesModernImageFormats,
          evidence: s.usesModernImageFormats
            ? "Modern image formats (WebP/AVIF) detected."
            : `No WebP/AVIF usage found across ${s.imgCount} images.`,
          weight: 1,
          categories: ["performance"],
          roast:
            "Still serving JPEGs like it's a 2012 food blog. WebP called; it wants to save you 30% bandwidth.",
          win: "Serving next-gen image formats (WebP/AVIF).",
          improvement: {
            issue: "Legacy image formats only",
            whyItMatters:
              "WebP/AVIF are 25–50% smaller than JPEG/PNG at the same quality — pure bandwidth savings.",
            howToFix:
              "Use <picture> with WebP/AVIF sources or an image CDN/framework that converts automatically.",
            expectedImpact: "Significantly lighter pages, better LCP on image-heavy views.",
            priority: "Medium",
          },
        }),

  // ------------------------------------------------------------------------ SEO
  (s) =>
    check({
      id: "title",
      passed: s.titleLength >= 15 && s.titleLength <= 65,
      evidence: s.title
        ? `<title> is "${s.title}" (${s.titleLength} chars).`
        : "The page has no <title> tag at all.",
      weight: 3,
      categories: ["seo"],
      roast: !s.title
        ? "No <title> tag. Google will name your site itself, and Google is not a creative."
        : s.titleLength < 15
          ? `A ${s.titleLength}-character title. Even fortune cookies put in more effort.`
          : `A ${s.titleLength}-character title that search results will amputate mid-sentence.`,
      win: `Well-sized title tag (${s.titleLength} chars): "${s.title}".`,
      improvement: {
        issue: !s.title
          ? "Missing <title> tag"
          : `Title length is ${s.titleLength} chars (ideal: 15–65)`,
        whyItMatters:
          "The title is the strongest on-page ranking signal and your search-result headline. Too long gets truncated; too short wastes the slot; missing is SEO malpractice.",
        howToFix:
          "Write a 50–60 character title: primary keyword + value proposition + brand.",
        expectedImpact: "Better rankings and click-through rate from search results.",
        priority: !s.title ? "Critical" : "High",
      },
    }),
  (s) =>
    check({
      id: "meta-description",
      passed: s.metaDescriptionLength >= 50 && s.metaDescriptionLength <= 165,
      evidence: s.metaDescription
        ? `Meta description is ${s.metaDescriptionLength} chars: "${s.metaDescription.slice(0, 120)}${s.metaDescriptionLength > 120 ? "…" : ""}"`
        : "No meta description found.",
      weight: 2,
      categories: ["seo", "copywriting"],
      roast: !s.metaDescription
        ? "No meta description — so Google improvises your sales pitch from random page text. Bold strategy."
        : `A ${s.metaDescriptionLength}-character meta description. ${s.metaDescriptionLength < 50 ? "That's a shrug, not a pitch." : "Search engines will cut it off right before the good part."}`,
      win: `Meta description present and well-sized (${s.metaDescriptionLength} chars).`,
      improvement: {
        issue: !s.metaDescription
          ? "Missing meta description"
          : `Meta description is ${s.metaDescriptionLength} chars (ideal: 50–160)`,
        whyItMatters:
          "It's your ad copy in search results. A compelling description can lift CTR by 5–15% without any ranking change.",
        howToFix:
          "Write a 140–160 character description with the key benefit and a reason to click.",
        expectedImpact: "Higher organic click-through rate.",
        priority: "High",
      },
    }),
  (s) =>
    check({
      id: "h1",
      passed: s.h1Count === 1,
      evidence:
        s.h1Count === 0
          ? "No <h1> on the page."
          : s.h1Count === 1
            ? `One <h1>: "${s.h1Text?.slice(0, 90) ?? ""}".`
            : `${s.h1Count} <h1> tags on a single page.`,
      weight: 2,
      categories: ["seo", "accessibility"],
      roast:
        s.h1Count === 0
          ? "Zero H1 tags. Your page has no headline — it just clears its throat and hopes."
          : `${s.h1Count} H1 tags fighting for the mic. Pick a main character.`,
      win: `Exactly one clear <h1>: "${s.h1Text?.slice(0, 60) ?? ""}".`,
      improvement: {
        issue: s.h1Count === 0 ? "Missing H1 heading" : `Multiple H1s (${s.h1Count})`,
        whyItMatters:
          "The H1 tells both users and search engines what the page is about; screen readers use it for orientation.",
        howToFix:
          "Use exactly one H1 stating the page's core value, then H2/H3 for structure.",
        expectedImpact: "Clearer topical signal for search and better screen-reader navigation.",
        priority: "High",
      },
    }),
  (s) =>
    check({
      id: "heading-structure",
      passed: !s.skippedHeadingLevels,
      evidence: `Heading outline: ${Object.entries(s.headingCounts)
        .filter(([, c]) => c > 0)
        .map(([h, c]) => `${c}×${h}`)
        .join(", ") || "no headings at all"}.`,
      weight: 1,
      categories: ["seo", "accessibility", "developerQuality"],
      roast:
        "Your heading levels skip around like a DJ set. H2 to H5 is not a transition, it's a cry for help.",
      win: "Logical heading hierarchy with no skipped levels.",
      improvement: {
        issue: "Skipped heading levels in document outline",
        whyItMatters:
          "Screen-reader users navigate by heading levels; skips break the mental map. Search engines also use the outline to understand structure.",
        howToFix: "Nest headings sequentially (h1 → h2 → h3) without skipping levels.",
        expectedImpact: "Better accessibility and cleaner document semantics.",
        priority: "Medium",
      },
    }),
  (s) =>
    check({
      id: "canonical",
      passed: s.canonical !== null,
      evidence: s.canonical
        ? `Canonical URL set: ${s.canonical}`
        : "No canonical link tag.",
      weight: 1,
      categories: ["seo"],
      roast:
        "No canonical tag — so www, non-www, and ?utm_ clones of this page all compete against each other. A civil war of your own making.",
      win: "Canonical URL declared — duplicate-content risk handled.",
      improvement: {
        issue: "Missing canonical tag",
        whyItMatters:
          "Without it, URL variants (www, trailing slash, tracking params) split ranking signals across duplicates.",
        howToFix: 'Add <link rel="canonical" href="..."> pointing to the preferred URL.',
        expectedImpact: "Consolidated ranking signals per page.",
        priority: "Medium",
      },
    }),
  (s) =>
    check({
      id: "og-tags",
      passed: !!(s.og.title && s.og.image),
      evidence: `Open Graph: title=${s.og.title ? "✓" : "✗"}, description=${s.og.description ? "✓" : "✗"}, image=${s.og.image ? "✓" : "✗"}; Twitter card: ${s.twitterCard ?? "none"}.`,
      weight: 1,
      categories: ["seo", "branding"],
      roast:
        "Share this link anywhere and it shows up as a naked grey rectangle. Open Graph tags exist so your links don't look like spam.",
      win: "Social share cards configured (Open Graph title + image).",
      improvement: {
        issue: "Incomplete Open Graph / Twitter card tags",
        whyItMatters:
          "Links shared on social/chat render without an image or title, tanking click-through on every share.",
        howToFix:
          "Add og:title, og:description, og:image (1200×630) and twitter:card meta tags.",
        expectedImpact: "Dramatically better-looking shares and more referral clicks.",
        priority: "Medium",
      },
    }),
  (s) =>
    check({
      id: "structured-data",
      passed: s.structuredDataBlocks > 0,
      evidence: `${s.structuredDataBlocks} JSON-LD structured data block(s) found.`,
      weight: 1,
      categories: ["seo"],
      roast:
        "No structured data. Google is squinting at your page trying to guess what it is, and Google guesses lazily.",
      win: `Structured data present (${s.structuredDataBlocks} JSON-LD block${s.structuredDataBlocks === 1 ? "" : "s"}).`,
      improvement: {
        issue: "No structured data (JSON-LD)",
        whyItMatters:
          "Schema markup unlocks rich results — stars, FAQs, breadcrumbs — which raise CTR without ranking changes.",
        howToFix:
          "Add JSON-LD for your entity type (Organization, Product, Article, FAQ) and validate with Google's Rich Results test.",
        expectedImpact: "Eligibility for rich results and better entity understanding.",
        priority: "Low",
      },
    }),
  (s) =>
    !s.robotsMeta
      ? null
      : check({
          id: "robots-noindex",
          passed: !/noindex/i.test(s.robotsMeta),
          evidence: `Robots meta tag: "${s.robotsMeta}".`,
          weight: 3,
          categories: ["seo"],
          roast:
            'Your page literally tells Google "noindex" — you built a billboard and then buried it. Iconic self-sabotage.',
          win: "Robots meta present and page is indexable.",
          improvement: {
            issue: "Page is set to noindex",
            whyItMatters:
              "noindex removes the page from search entirely. If this is your homepage, you are invisible on Google by choice.",
            howToFix:
              "Remove the noindex directive from the robots meta tag (unless this is intentional for a staging site).",
            expectedImpact: "The page becomes eligible to rank at all.",
            priority: "Critical",
          },
        }),

  // ---------------------------------------------------------------- Accessibility
  (s) =>
    check({
      id: "lang-attr",
      passed: s.lang !== null,
      evidence: s.lang
        ? `<html lang="${s.lang}"> is set.`
        : "The <html> tag has no lang attribute.",
      weight: 2,
      categories: ["accessibility", "seo"],
      roast:
        'No lang attribute — screen readers get to play "guess the language" with your content. They hate that game.',
      win: `Document language declared (lang="${s.lang}").`,
      improvement: {
        issue: "Missing lang attribute on <html>",
        whyItMatters:
          "Screen readers use it to pick the right pronunciation engine; browsers use it for translation and hyphenation.",
        howToFix: 'Add lang="en" (or your language) to the <html> element.',
        expectedImpact: "Correct screen-reader pronunciation; a WCAG 3.1.1 pass.",
        priority: "High",
      },
    }),
  (s) =>
    s.a11y.imgAltCoveragePct === null
      ? null
      : check({
          id: "alt-text",
          passed: s.a11y.imgAltCoveragePct >= 90,
          evidence: `${s.imgCount - s.imgMissingAlt}/${s.imgCount} images have alt text (${s.a11y.imgAltCoveragePct}% coverage).`,
          weight: 3,
          categories: ["accessibility", "seo"],
          roast: `${s.imgMissingAlt} of your ${s.imgCount} images have no alt text. To a screen reader, your page is a slideshow of awkward silences.`,
          win: `Strong alt-text coverage: ${s.a11y.imgAltCoveragePct}% of images described.`,
          improvement: {
            issue: `${s.imgMissingAlt} images missing alt text`,
            whyItMatters:
              "Screen-reader users get nothing from undescribed images, and image search can't index them. It's also the most-cited WCAG failure.",
            howToFix:
              'Add descriptive alt text to meaningful images; use alt="" for purely decorative ones.',
            expectedImpact: "WCAG 1.1.1 compliance and image-SEO gains.",
            priority: s.a11y.imgAltCoveragePct < 50 ? "Critical" : "High",
          },
        }),
  (s) =>
    s.a11y.totalInputs === 0
      ? null
      : check({
          id: "input-labels",
          passed: s.a11y.unlabelledInputs === 0,
          evidence: `${s.a11y.unlabelledInputs}/${s.a11y.totalInputs} form inputs have no label, aria-label, or placeholder.`,
          weight: 2,
          categories: ["accessibility", "ux", "conversion"],
          roast: `${s.a11y.unlabelledInputs} form fields with no labels. Users get to guess what goes in the mystery boxes. Fun for nobody.`,
          win: "Every form input has an accessible label.",
          improvement: {
            issue: `${s.a11y.unlabelledInputs} unlabelled form inputs`,
            whyItMatters:
              "Unlabelled fields are unusable with assistive tech and increase form abandonment for everyone.",
            howToFix:
              "Associate a <label for> with every input, or add aria-label where a visible label truly can't fit.",
            expectedImpact: "Accessible, higher-converting forms.",
            priority: "High",
          },
        }),
  (s) =>
    check({
      id: "empty-links",
      passed: s.emptyAnchors === 0,
      evidence: `${s.emptyAnchors} link(s) have no accessible text (no text, aria-label, or image alt).`,
      weight: 1,
      categories: ["accessibility"],
      roast: `${s.emptyAnchors} links with no text at all. Screen readers announce these as "link". Link to what? Adventure, apparently.`,
      win: "All links have accessible names.",
      improvement: {
        issue: `${s.emptyAnchors} links without accessible names`,
        whyItMatters:
          'Screen readers announce them as just "link", making navigation guesswork.',
        howToFix: "Add text content or aria-label to every anchor (icon links included).",
        expectedImpact: "Navigable page for assistive-tech users; WCAG 2.4.4 pass.",
        priority: "Medium",
      },
    }),
  (s) =>
    check({
      id: "positive-tabindex",
      passed: s.a11y.positiveTabIndexCount === 0,
      evidence: `${s.a11y.positiveTabIndexCount} elements use a positive tabindex.`,
      weight: 1,
      categories: ["accessibility", "developerQuality"],
      roast:
        "Positive tabindex values found — you've manually reordered keyboard navigation into a scavenger hunt.",
      win: "No tab-order hijacking (no positive tabindex).",
      improvement: {
        issue: "Positive tabindex values override natural focus order",
        whyItMatters:
          "They create unpredictable keyboard navigation that breaks as the DOM changes.",
        howToFix: "Use tabindex='0' or restructure the DOM so source order matches visual order.",
        expectedImpact: "Sane keyboard navigation.",
        priority: "Medium",
      },
    }),

  // --------------------------------------------------------------------- Mobile/UX
  (s) =>
    check({
      id: "viewport",
      passed: s.mobile.hasViewportMeta && !s.mobile.fixedWidthViewport,
      evidence: s.mobile.hasViewportMeta
        ? `Viewport meta: "${s.mobile.viewportContent}".`
        : "No viewport meta tag — mobile browsers will render the desktop layout zoomed out.",
      weight: 3,
      categories: ["ux", "performance", "seo"],
      roast: !s.mobile.hasViewportMeta
        ? "No viewport meta tag. On phones your site is a microfiche — users need a magnifying glass and a grudge."
        : "A fixed-width viewport. You've decided what size everyone's phone should be. They disagree.",
      win: "Proper responsive viewport configuration.",
      improvement: {
        issue: !s.mobile.hasViewportMeta
          ? "Missing viewport meta tag"
          : "Fixed-width viewport",
        whyItMatters:
          "Over 60% of traffic is mobile, and Google indexes mobile-first. A broken mobile render hurts both rankings and every mobile visitor.",
        howToFix:
          '<meta name="viewport" content="width=device-width, initial-scale=1"> plus responsive CSS.',
        expectedImpact: "A usable mobile experience and mobile-first indexing eligibility.",
        priority: "Critical",
      },
    }),
  (s) =>
    check({
      id: "content-volume",
      passed: s.wordCount >= 120,
      evidence: `${s.wordCount} words of visible text content.`,
      weight: 2,
      categories: ["copywriting", "seo"],
      roast: `${s.wordCount} words on the whole page. Your site says less than a shrug emoji.`,
      win: `Substantial content for search and users (${s.wordCount} words).`,
      improvement: {
        issue: `Thin content (${s.wordCount} words)`,
        whyItMatters:
          "Search engines can't rank what isn't there, and users can't be convinced by white space. (If content is JS-rendered, ensure it's server-rendered for crawlers.)",
        howToFix:
          "Add real copy: what it is, who it's for, why it's better, proof. If the page is a JS shell, enable SSR/prerendering.",
        expectedImpact: "Rankability and a working pitch.",
        priority: "High",
      },
    }),
  (s) =>
    s.fleschReadingEase === null
      ? null
      : check({
          id: "readability",
          passed: s.fleschReadingEase >= 40,
          evidence: `Flesch reading ease ≈ ${s.fleschReadingEase} (avg sentence ${s.avgSentenceLength} words).`,
          weight: 1,
          categories: ["copywriting", "ux"],
          roast: `Flesch score of ${s.fleschReadingEase}. Your copy reads like terms and conditions that gained sentience.`,
          win: `Readable copy (Flesch ≈ ${s.fleschReadingEase}).`,
          improvement: {
            issue: `Hard-to-read copy (Flesch ≈ ${s.fleschReadingEase})`,
            whyItMatters:
              "Visitors skim. Dense sentences hide your value proposition and raise bounce rates.",
            howToFix:
              "Shorten sentences (aim under 20 words), cut jargon, front-load benefits.",
            expectedImpact: "More visitors actually absorbing the pitch.",
            priority: "Medium",
          },
        }),
  (s) =>
    check({
      id: "generic-anchors",
      passed: s.genericAnchorTexts.length === 0,
      evidence:
        s.genericAnchorTexts.length > 0
          ? `Generic link text found: ${s.genericAnchorTexts.map((t) => `"${t}"`).join(", ")}.`
          : "No generic link labels like \"click here\" found.",
      weight: 1,
      categories: ["copywriting", "seo", "accessibility"],
      roast: `"${s.genericAnchorTexts[0] ?? "click here"}" as link text. Where does it go? Mystery. Marketing by suspense.`,
      win: "Descriptive link text throughout — no \"click here\" filler.",
      improvement: {
        issue: "Generic anchor text (\"click here\", \"read more\")",
        whyItMatters:
          "Link text is a ranking signal and the only context screen-reader users get when tabbing through links.",
        howToFix: "Rewrite anchors to describe the destination (\"See pricing\", \"Read the case study\").",
        expectedImpact: "Better internal-link SEO and scannability.",
        priority: "Low",
      },
    }),
  (s) =>
    check({
      id: "navigation",
      passed: s.internalLinks >= 3,
      evidence: `${s.internalLinks} internal links, ${s.externalLinks} external.`,
      weight: 2,
      categories: ["ux", "seo"],
      roast:
        "Barely any internal links. Your site is a room with no doors — visitors see one page and leave because there's nowhere to go.",
      win: `Healthy internal linking (${s.internalLinks} internal links).`,
      improvement: {
        issue: `Weak internal navigation (${s.internalLinks} internal links)`,
        whyItMatters:
          "Internal links drive discovery for users and PageRank flow for crawlers.",
        howToFix:
          "Add a clear nav menu and contextual links to key pages (features, pricing, docs, contact).",
        expectedImpact: "Longer sessions, deeper crawls.",
        priority: "Medium",
      },
    }),

  // -------------------------------------------------------------- Conversion / CTA
  (s) =>
    check({
      id: "cta-presence",
      passed: s.ctaCandidates.length > 0,
      evidence:
        s.ctaCandidates.length > 0
          ? `CTA candidates found: ${s.ctaCandidates.slice(0, 5).map((c) => `"${c}"`).join(", ")}.`
          : `No call-to-action found among ${s.buttonTexts.length} buttons and ${s.linkCount} links.`,
      weight: 3,
      categories: ["conversion", "ux"],
      roast:
        "There's no call to action anywhere. Visitors arrive, look around, and leave — like a shop with no counter.",
      win: `Clear calls to action present: ${s.ctaCandidates.slice(0, 3).map((c) => `"${c}"`).join(", ")}.`,
      improvement: {
        issue: "No identifiable call to action",
        whyItMatters:
          "Every page needs one primary next step. Without it, interest has nowhere to convert.",
        howToFix:
          "Add one prominent, high-contrast primary CTA above the fold (\"Get started\", \"Book a demo\") and repeat it after key sections.",
        expectedImpact: "Directly measurable lift in signups/leads.",
        priority: "Critical",
      },
    }),
  (s) =>
    s.ctaCandidates.length === 0
      ? null
      : check({
          id: "cta-focus",
          passed: s.ctaCandidates.length <= 6,
          evidence: `${s.ctaCandidates.length} distinct CTA-style actions on one page: ${s.ctaCandidates.slice(0, 6).map((c) => `"${c}"`).join(", ")}…`,
          weight: 1,
          categories: ["conversion", "design"],
          roast: `${s.ctaCandidates.length} different calls to action. When everything screams "click me", users click "back".`,
          win: "Focused conversion path — a manageable number of CTAs.",
          improvement: {
            issue: `CTA overload (${s.ctaCandidates.length} competing actions)`,
            whyItMatters:
              "Choice paralysis is real: more competing CTAs reliably lowers total conversion.",
            howToFix:
              "Pick one primary action per page; demote the rest to secondary/ghost buttons.",
            expectedImpact: "Clearer funnel, higher primary-action conversion.",
            priority: "Medium",
          },
        }),
  (s) =>
    check({
      id: "forms",
      passed: s.formCount > 0 || s.ctaCandidates.length > 0,
      evidence: `${s.formCount} form(s) on the page.`,
      weight: 1,
      categories: ["conversion"],
      roast:
        "No forms, no signup, no capture — visitors couldn't give you their email if they begged.",
      win: `Lead capture in place (${s.formCount} form${s.formCount === 1 ? "" : "s"}).`,
      improvement: {
        issue: "No way to capture visitor interest",
        whyItMatters:
          "97% of first-time visitors don't buy; without email capture or signup, they're gone forever.",
        howToFix: "Add a low-friction email capture or signup form near the primary CTA.",
        expectedImpact: "A remarketable audience instead of anonymous bounces.",
        priority: "Medium",
      },
    }),

  // -------------------------------------------------------------------- Trust
  (s) =>
    check({
      id: "https",
      passed: s.https,
      evidence: s.https
        ? "Site serves over HTTPS."
        : "Site loads over plain HTTP — no encryption.",
      weight: 3,
      categories: ["trust", "seo", "developerQuality"],
      roast:
        'Plain HTTP in this decade. Browsers literally stamp "Not Secure" next to your name. That\'s a review you can\'t delete.',
      win: "Served over HTTPS.",
      improvement: {
        issue: "No HTTPS",
        whyItMatters:
          "Browsers flag HTTP sites as \"Not Secure\", Google downranks them, and no sane user submits a form on one.",
        howToFix: "Install a free Let's Encrypt certificate and 301-redirect HTTP → HTTPS.",
        expectedImpact: "Removes the trust-killing warning; small ranking boost.",
        priority: "Critical",
      },
    }),
  (s) =>
    !s.https
      ? null
      : check({
          id: "hsts",
          passed: s.headers.hsts,
          evidence: s.headers.hsts
            ? "HSTS header present."
            : "No Strict-Transport-Security header.",
          weight: 1,
          categories: ["trust", "developerQuality"],
          roast:
            "HTTPS but no HSTS — you locked the front door and left a sticky note saying the window's open.",
          win: "HSTS enforced — downgrade attacks blocked.",
          improvement: {
            issue: "Missing HSTS header",
            whyItMatters:
              "Without HSTS, first requests can be downgraded to HTTP by an attacker on the network.",
            howToFix:
              'Add "Strict-Transport-Security: max-age=31536000; includeSubDomains".',
            expectedImpact: "Hardened transport security.",
            priority: "Low",
          },
        }),
  (s) =>
    check({
      id: "legal-pages",
      passed: s.trust.hasPrivacyLink || s.trust.hasTermsLink,
      evidence: `Footer/legal links — privacy: ${s.trust.hasPrivacyLink ? "✓" : "✗"}, terms: ${s.trust.hasTermsLink ? "✓" : "✗"}, contact: ${s.trust.hasContactLink ? "✓" : "✗"}, about: ${s.trust.hasAboutLink ? "✓" : "✗"}.`,
      weight: 2,
      categories: ["trust"],
      roast:
        "No privacy policy, no terms. Legally speaking, your website is a guy selling watches out of a coat.",
      win: "Legal pages linked (privacy/terms) — baseline credibility handled.",
      improvement: {
        issue: "No privacy policy or terms of service linked",
        whyItMatters:
          "Users, payment providers, ad networks, and GDPR/CCPA regulators all expect them. Their absence screams 'side project'.",
        howToFix: "Publish privacy and terms pages, link them in the footer.",
        expectedImpact: "Baseline legitimacy and compliance readiness.",
        priority: "High",
      },
    }),
  (s) =>
    check({
      id: "contact",
      passed: s.trust.hasContactLink || s.trust.hasAboutLink,
      evidence: `Contact link: ${s.trust.hasContactLink ? "found" : "not found"}; About link: ${s.trust.hasAboutLink ? "found" : "not found"}.`,
      weight: 1,
      categories: ["trust", "conversion"],
      roast:
        "No contact page, no about page. Who runs this site? Nobody knows. Very trustworthy. Very normal.",
      win: "Humans are findable — contact/about pages linked.",
      improvement: {
        issue: "No contact or about information",
        whyItMatters:
          "Anonymous websites don't get wallets opened. E-E-A-T (Google's quality framework) also weighs author/company transparency.",
        howToFix: "Add an about page with real names/story and a contact page or email.",
        expectedImpact: "Higher trust, better conversions, E-E-A-T credit.",
        priority: "Medium",
      },
    }),
  (s) =>
    check({
      id: "social-proof-links",
      passed: s.trust.socialLinkCount > 0,
      evidence: `${s.trust.socialLinkCount} social profile link(s) detected.`,
      weight: 1,
      categories: ["trust", "branding"],
      roast:
        "Zero social links. In 2026 having no social presence reads either 'mysterious' or 'made up' — and users guess the second.",
      win: `Connected social presence (${s.trust.socialLinkCount} profiles linked).`,
      improvement: {
        issue: "No social profiles linked",
        whyItMatters:
          "Social links are a cheap external trust signal and a second touchpoint for hesitant visitors.",
        howToFix: "Link active social profiles in the footer (only ones you actually maintain).",
        expectedImpact: "Incremental trust and brand verification.",
        priority: "Low",
      },
    }),
  (s) =>
    s.trust.copyrightYearFound === null
      ? null
      : check({
          id: "copyright-fresh",
          passed: s.trust.copyrightYearFound >= new Date().getFullYear() - 1,
          evidence: `Footer copyright year: ${s.trust.copyrightYearFound}.`,
          weight: 1,
          categories: ["trust"],
          roast: `"© ${s.trust.copyrightYearFound}" in the footer. Nothing says "we may have abandoned this" like a copyright from ${new Date().getFullYear() - s.trust.copyrightYearFound} years ago.`,
          win: "Copyright year is current — the lights are visibly on.",
          improvement: {
            issue: `Stale copyright year (${s.trust.copyrightYearFound})`,
            whyItMatters:
              "An outdated year is the classic 'is this site even maintained?' red flag.",
            howToFix: "Render the year dynamically.",
            expectedImpact: "One less abandonment signal.",
            priority: "Low",
          },
        }),

  // ------------------------------------------------------------- Branding / Design
  (s) =>
    check({
      id: "favicon",
      passed: s.faviconUrl !== null,
      evidence: s.faviconUrl ? `Favicon: ${s.faviconUrl}` : "No favicon declared.",
      weight: 1,
      categories: ["branding", "design"],
      roast:
        "No favicon. In a row of browser tabs your site is the one in the witness protection program.",
      win: "Custom favicon present — recognizable in a tab sea.",
      improvement: {
        issue: "Missing favicon",
        whyItMatters:
          "It's your brand mark in tabs, bookmarks, and search results. Its absence looks unfinished.",
        howToFix: "Add favicon.ico + a 180×180 apple-touch-icon + an SVG icon.",
        expectedImpact: "Brand recognition in every tab and bookmark.",
        priority: "Low",
      },
    }),
  (s) =>
    s.fontFamilies.length === 0
      ? null
      : check({
          id: "font-discipline",
          passed: s.fontFamilies.length <= 4,
          evidence: `${s.fontFamilies.length} font families detected: ${s.fontFamilies.slice(0, 6).join(", ")}.`,
          weight: 1,
          categories: ["visualConsistency", "design", "branding"],
          roast: `${s.fontFamilies.length} different fonts on one page. This isn't typography, it's a ransom note.`,
          win: `Typographic discipline: ${s.fontFamilies.length} font famil${s.fontFamilies.length === 1 ? "y" : "ies"}.`,
          improvement: {
            issue: `Too many fonts (${s.fontFamilies.length} families)`,
            whyItMatters:
              "Every extra font is a download AND a consistency leak. Strong brands use 1–2 families with weight variation.",
            howToFix: "Consolidate to one heading + one body family; use weights for hierarchy.",
            expectedImpact: "Cleaner look, faster loads, stronger brand.",
            priority: "Medium",
          },
        }),
  (s) =>
    s.distinctColorCount === 0
      ? null
      : check({
          id: "color-discipline",
          passed: s.distinctColorCount <= 16,
          evidence: `${s.distinctColorCount} distinct hex colors in page styles${s.colorPalette.length ? ` (e.g. ${s.colorPalette.slice(0, 5).join(", ")})` : ""}.`,
          weight: 1,
          categories: ["visualConsistency", "design"],
          roast: `${s.distinctColorCount} different colors in your CSS. This palette looks like three designers quit halfway and a fourth was never told.`,
          win: `Restrained palette (${s.distinctColorCount} colors) — visually coherent.`,
          improvement: {
            issue: `Color sprawl (${s.distinctColorCount} distinct colors)`,
            whyItMatters:
              "Uncontrolled palettes read as inconsistent and unprofessional, and make dark-mode/theming nearly impossible.",
            howToFix:
              "Define design tokens (primary, neutral scale, semantic colors) and replace one-off hex values.",
            expectedImpact: "Consistent UI and maintainable styling.",
            priority: "Low",
          },
        }),
  (s) =>
    check({
      id: "inline-styles",
      passed: s.inlineStyleAttrCount <= 30,
      evidence: `${s.inlineStyleAttrCount} elements carry inline style attributes.`,
      weight: 1,
      categories: ["developerQuality", "visualConsistency"],
      roast: `${s.inlineStyleAttrCount} inline style attributes. Your CSS architecture is "vibes, applied individually".`,
      win: "Styles live in stylesheets, not sprinkled inline.",
      improvement: {
        issue: `Heavy inline styling (${s.inlineStyleAttrCount} style attributes)`,
        whyItMatters:
          "Inline styles defeat caching, bloat HTML, break consistency, and fight CSP policies.",
        howToFix: "Move repeated inline styles into classes/design tokens.",
        expectedImpact: "Smaller HTML, consistent theming.",
        priority: "Low",
      },
    }),
  (s) =>
    s.tech.deprecatedTags.length === 0
      ? null
      : check({
          id: "deprecated-tags",
          passed: false,
          evidence: `Deprecated HTML tags in use: ${s.tech.deprecatedTags.map((t) => `<${t}>`).join(", ")}.`,
          weight: 2,
          categories: ["developerQuality", "design"],
          roast: `A <${s.tech.deprecatedTags[0]}> tag, in the wild, in ${new Date().getFullYear()}. Archaeologists would like a word.`,
          improvement: {
            issue: `Deprecated HTML tags (${s.tech.deprecatedTags.join(", ")})`,
            whyItMatters:
              "Deprecated elements have inconsistent rendering, no accessibility semantics, and may be dropped by browsers.",
            howToFix: "Replace with semantic HTML + CSS equivalents.",
            expectedImpact: "Future-proof, consistent rendering.",
            priority: "Medium",
          },
        }),
  (s) =>
    check({
      id: "charset",
      passed: s.charset !== null,
      evidence: s.charset ? `Charset declared: ${s.charset}.` : "No charset declaration.",
      weight: 1,
      categories: ["developerQuality"],
      roast:
        "No charset declared. Living dangerously — one curly quote away from a page full of �����.",
      win: `Charset declared (${s.charset}).`,
      improvement: {
        issue: "Missing charset declaration",
        whyItMatters: "Browsers may mis-decode text, garbling any non-ASCII character.",
        howToFix: 'Add <meta charset="utf-8"> as the first element in <head>.',
        expectedImpact: "Reliable text rendering.",
        priority: "Low",
      },
    }),
  (s) =>
    check({
      id: "security-headers",
      passed: s.headers.contentSecurityPolicy || s.headers.xFrameOptions,
      evidence: `Security headers — CSP: ${s.headers.contentSecurityPolicy ? "✓" : "✗"}, X-Frame-Options/frame-ancestors: ${s.headers.xFrameOptions ? "✓" : "✗"}.`,
      weight: 1,
      categories: ["developerQuality", "trust"],
      roast:
        "No CSP, no X-Frame-Options. Your security headers section is just a polite cough.",
      win: "Security headers configured (CSP / frame protection).",
      improvement: {
        issue: "Missing security headers",
        whyItMatters:
          "CSP blunts XSS; frame protection stops clickjacking. Their absence fails basic security audits.",
        howToFix:
          "Add Content-Security-Policy and X-Frame-Options (or frame-ancestors) headers at your server/CDN.",
        expectedImpact: "Materially reduced XSS/clickjacking exposure.",
        priority: "Medium",
      },
    }),
];

export function runChecks(signals: SiteSignals): CheckResult[] {
  return CHECKS.map((c) => c(signals)).filter((r): r is CheckResult => r !== null);
}
