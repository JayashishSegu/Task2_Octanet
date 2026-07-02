export interface SiteSignals {
  url: string;
  finalUrl: string;
  domain: string;
  https: boolean;
  redirected: boolean;
  statusCode: number;
  responseTimeMs: number;
  htmlSizeKb: number;

  headers: {
    contentEncoding: string | null;
    cacheControl: string | null;
    hsts: boolean;
    contentSecurityPolicy: boolean;
    xFrameOptions: boolean;
    server: string | null;
  };

  title: string | null;
  titleLength: number;
  metaDescription: string | null;
  metaDescriptionLength: number;
  canonical: string | null;
  charset: string | null;
  lang: string | null;
  faviconUrl: string | null;
  robotsMeta: string | null;

  og: {
    title: string | null;
    description: string | null;
    image: string | null;
  };
  twitterCard: string | null;
  structuredDataBlocks: number;

  h1Count: number;
  h1Text: string | null;
  headingCounts: Record<string, number>;
  skippedHeadingLevels: boolean;

  wordCount: number;
  fleschReadingEase: number | null;
  avgSentenceLength: number | null;

  imgCount: number;
  imgMissingAlt: number;
  imgLazyLoaded: number;
  usesModernImageFormats: boolean;

  linkCount: number;
  internalLinks: number;
  externalLinks: number;
  emptyAnchors: number;
  genericAnchorTexts: string[];

  scriptCount: number;
  externalScriptCount: number;
  stylesheetCount: number;
  inlineStyleAttrCount: number;
  usesAsyncOrDefer: boolean;

  fontFamilies: string[];
  googleFontFamilies: number;
  colorPalette: string[];
  distinctColorCount: number;

  buttonTexts: string[];
  ctaCandidates: string[];
  formCount: number;
  hasSearch: boolean;

  trust: {
    hasContactLink: boolean;
    hasPrivacyLink: boolean;
    hasTermsLink: boolean;
    hasAboutLink: boolean;
    socialLinkCount: number;
    copyrightYearFound: number | null;
  };

  a11y: {
    imgAltCoveragePct: number | null;
    hasSkipLink: boolean;
    ariaAttributeCount: number;
    unlabelledInputs: number;
    totalInputs: number;
    positiveTabIndexCount: number;
  };

  mobile: {
    hasViewportMeta: boolean;
    viewportContent: string | null;
    fixedWidthViewport: boolean;
  };

  tech: {
    detected: string[];
    deprecatedTags: string[];
  };
}
