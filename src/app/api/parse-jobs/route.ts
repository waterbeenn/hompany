import { NextRequest, NextResponse } from "next/server";
import { JobListing } from "@/lib/types";
import { parseJobPage } from "@/lib/jobParser";
import { getCachedJob, setCachedJob } from "@/lib/cache";
import { geocodeAddress, haversineDistanceKm } from "@/lib/kakao";
import { getTransitRoute } from "@/lib/odsay";

const CRAWL_DELAY_MS = 1000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(req: NextRequest) {
  const { homeAddress, jobUrls } = (await req.json()) as {
    homeAddress?: string;
    jobUrls?: string[];
  };

  if (!homeAddress || !jobUrls?.length) {
    return NextResponse.json(
      { error: "homeAddress와 jobUrls가 필요합니다." },
      { status: 400 },
    );
  }

  let homeCoord;
  try {
    homeCoord = await geocodeAddress(homeAddress);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "집 주소 좌표 변환 실패" },
      { status: 500 },
    );
  }

  if (!homeCoord) {
    return NextResponse.json(
      { error: "집 주소로 좌표를 찾을 수 없습니다." },
      { status: 422 },
    );
  }

  const jobs: JobListing[] = [];

  for (let i = 0; i < jobUrls.length; i++) {
    const url = jobUrls[i];
    const id = `${i}-${Buffer.from(url).toString("base64url").slice(0, 12)}`;

    try {
      let parsed = getCachedJob(url);

      if (!parsed) {
        if (i > 0) await sleep(CRAWL_DELAY_MS);
        parsed = await parseJobPage(url);
        if (parsed) setCachedJob(url, parsed);
      }

      if (!parsed?.address) {
        jobs.push({ id, url, status: "needs-manual" });
        continue;
      }

      const companyCoord = await geocodeAddress(parsed.address);
      if (!companyCoord) {
        jobs.push({
          id,
          url,
          companyName: parsed.companyName,
          address: parsed.address,
          status: "needs-manual",
          errorMessage: "회사 주소의 좌표를 찾을 수 없습니다.",
        });
        continue;
      }

      const transitRoute = await getTransitRoute(homeCoord, companyCoord);
      const distanceKm =
        transitRoute?.distanceKm ?? haversineDistanceKm(homeCoord, companyCoord);

      jobs.push({
        id,
        url,
        companyName: parsed.companyName,
        address: parsed.address,
        lat: companyCoord.lat,
        lng: companyCoord.lng,
        distanceKm,
        durationMin: transitRoute?.durationMin,
        transitType: transitRoute?.transitType,
        transitLegs: transitRoute?.legs,
        finalWalkMin: transitRoute?.finalWalkMin,
        status: "parsed",
      });
    } catch (err) {
      jobs.push({
        id,
        url,
        status: "error",
        errorMessage: err instanceof Error ? err.message : "알 수 없는 오류",
      });
    }
  }

  return NextResponse.json({ jobs, homeCoord });
}
