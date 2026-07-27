import { NextRequest, NextResponse } from "next/server";
import { geocodeAddress, haversineDistanceKm } from "@/lib/kakao";
import { getTransitRoute } from "@/lib/odsay";

export async function POST(req: NextRequest) {
  const { address, homeLat, homeLng } = (await req.json()) as {
    address?: string;
    homeLat?: number;
    homeLng?: number;
  };

  if (!address || homeLat == null || homeLng == null) {
    return NextResponse.json(
      { error: "address, homeLat, homeLng가 필요합니다." },
      { status: 400 },
    );
  }

  let companyCoord;
  try {
    companyCoord = await geocodeAddress(address);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "좌표 변환 실패" },
      { status: 500 },
    );
  }

  if (!companyCoord) {
    return NextResponse.json(
      { error: "입력하신 주소로 좌표를 찾을 수 없습니다." },
      { status: 422 },
    );
  }

  const homeCoord = { lat: homeLat, lng: homeLng };
  const transitRoute = await getTransitRoute(homeCoord, companyCoord);
  const distanceKm =
    transitRoute?.distanceKm ?? haversineDistanceKm(homeCoord, companyCoord);

  return NextResponse.json({
    lat: companyCoord.lat,
    lng: companyCoord.lng,
    distanceKm,
    durationMin: transitRoute?.durationMin,
    transitType: transitRoute?.transitType,
    transitLegs: transitRoute?.legs,
    finalWalkMin: transitRoute?.finalWalkMin,
  });
}
