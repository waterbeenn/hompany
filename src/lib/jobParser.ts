import * as cheerio from "cheerio";

export interface ParsedJob {
  companyName?: string;
  address?: string;
}

const SUPPORTED_DOMAINS = ["jobkorea.co.kr", "saramin.co.kr", "wanted.co.kr"];

// 사이트별 CSS 셀렉터 폴백. JSON-LD(JobPosting 스키마)가 없는 경우에만 사용되며,
// 마크업이 자주 바뀌므로 실제 배포 전 최신 페이지 구조로 검증 필요.
const SITE_SELECTORS: Record<string, { companyName: string; address: string }> = {
  "jobkorea.co.kr": {
    companyName: ".coName, .company-name",
    address: ".addr, .company-address",
  },
  "saramin.co.kr": {
    companyName: ".company_name, .corp_name",
    address: ".loc_mid, .company_address",
  },
};

function matchSite(hostname: string) {
  return SUPPORTED_DOMAINS.some((domain) => hostname.endsWith(domain));
}

function cleanAddress(raw: string): string {
  // 괄호 안 동/건물명 설명("(문정동, 문정역테라타워)")은 카카오 주소 검색을
  // 실패시키는 주된 원인이라 제거하고, 나머지 공백만 정리한다.
  return raw.replace(/\([^)]*\)/g, "").replace(/\s+/g, " ").trim();
}

// 채용 사이트들이 검색엔진 노출을 위해 널리 채택하는 schema.org JobPosting
// JSON-LD를 우선 시도한다. 실제 잡코리아 페이지에서 검증된 형태.
function parseFromJsonLd($: cheerio.CheerioAPI): ParsedJob | null {
  for (const el of $('script[type="application/ld+json"]').toArray()) {
    let data: unknown;
    try {
      data = JSON.parse($(el).contents().text());
    } catch {
      continue;
    }

    const posting = data as {
      "@type"?: string;
      hiringOrganization?: { name?: string };
      jobLocation?: { address?: { streetAddress?: string } };
    };

    if (posting?.["@type"] !== "JobPosting") continue;

    const streetAddress = posting.jobLocation?.address?.streetAddress;
    if (!streetAddress) continue;

    return {
      companyName: posting.hiringOrganization?.name,
      address: cleanAddress(streetAddress),
    };
  }

  return null;
}

function parseFromSelectors(
  $: cheerio.CheerioAPI,
  hostname: string,
): ParsedJob | null {
  const selectors = Object.entries(SITE_SELECTORS).find(([domain]) =>
    hostname.endsWith(domain),
  )?.[1];
  if (!selectors) return null;

  const companyName = $(selectors.companyName).first().text().trim() || undefined;
  const address = $(selectors.address).first().text().trim() || undefined;

  if (!address) return null;

  return { companyName, address: cleanAddress(address) };
}

export async function parseJobPage(url: string): Promise<ParsedJob | null> {
  let hostname: string;
  try {
    hostname = new URL(url).hostname;
  } catch {
    return null;
  }

  if (!matchSite(hostname)) return null;

  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; JobDistanceBot/1.0)" },
  });
  if (!res.ok) return null;

  const html = await res.text();
  const $ = cheerio.load(html);

  return parseFromJsonLd($) ?? parseFromSelectors($, hostname);
}
