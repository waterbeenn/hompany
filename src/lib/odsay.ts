import { Coordinate } from "@/lib/kakao";
import { TransitLeg } from "@/lib/types";

interface TransitRoute {
  durationMin: number;
  distanceKm: number;
  transitType: string;
  legs: TransitLeg[];
  finalWalkMin: number;
}

// ODsay pathType: 1=지하철, 2=버스, 3=버스+지하철
const PATH_TYPE_LABELS: Record<number, string> = {
  1: "지하철",
  2: "버스",
  3: "버스+지하철",
};

// ODsay subPath.trafficType: 1=지하철, 2=버스, 3=도보
function buildLegs(subPath: any[]): { legs: TransitLeg[]; finalWalkMin: number } {
  const legs: TransitLeg[] = [];
  let pendingWalk = 0;

  for (const seg of subPath ?? []) {
    if (seg.trafficType === 3) {
      pendingWalk += seg.sectionTime ?? 0;
      continue;
    }
    if (seg.trafficType !== 1 && seg.trafficType !== 2) continue;

    const lane = seg.lane?.[0];
    const mode: TransitLeg["mode"] = seg.trafficType === 1 ? "subway" : "bus";
    const label = mode === "subway" ? (lane?.name ?? "지하철") : (lane?.busNo ?? "버스");

    legs.push({
      mode,
      label,
      startName: seg.startName ?? "",
      endName: seg.endName ?? "",
      sectionTime: seg.sectionTime ?? 0,
      stationCount: seg.stationCount ?? 0,
      walkBeforeMin: pendingWalk,
    });
    pendingWalk = 0;
  }

  return { legs, finalWalkMin: pendingWalk };
}

// ODsay 대중교통 길찾기 API. 경로가 없거나(도서산간 등) 키 미설정 시 null을 반환하며,
// 이 정보는 부가 기능이라 실패해도 거리 계산 자체는 계속 진행되어야 한다.
export async function getTransitRoute(
  origin: Coordinate,
  destination: Coordinate,
): Promise<TransitRoute | null> {
  const apiKey = process.env.ODSAY_API_KEY;
  if (!apiKey) return null;

  const params = new URLSearchParams({
    SX: String(origin.lng),
    SY: String(origin.lat),
    EX: String(destination.lng),
    EY: String(destination.lat),
    apiKey,
    output: "json",
  });

  // ODsay 키가 URI 등록(Referer 검사) 모드일 경우, 서버발 요청도 등록된 URI를
  // Referer로 보내야 인증이 통과된다. ODsay Lab 콘솔에 등록한 값과 일치해야 함.
  const referer = process.env.ODSAY_REFERER ?? "http://localhost:3000";

  let res: Response;
  try {
    res = await fetch(
      `https://api.odsay.com/v1/api/searchPubTransPathT?${params}`,
      { headers: { Referer: referer } },
    );
  } catch {
    return null;
  }

  if (!res.ok) return null;

  const data = await res.json();
  const paths = data?.result?.path;
  if (!Array.isArray(paths) || paths.length === 0) return null;

  // ODsay는 자체 추천순으로 정렬해서 주기 때문에, 실제 최단 소요시간 경로를
  // 보여주려면 반환된 후보 전체에서 직접 최솟값을 찾아야 한다.
  const fastest = paths.reduce((best, current) =>
    current.info.totalTime < best.info.totalTime ? current : best,
  );

  if (!fastest?.info) return null;

  const { legs, finalWalkMin } = buildLegs(fastest.subPath);

  return {
    durationMin: fastest.info.totalTime,
    distanceKm: Math.round((fastest.info.totalDistance / 1000) * 10) / 10,
    transitType: PATH_TYPE_LABELS[fastest.pathType] ?? "대중교통",
    legs,
    finalWalkMin,
  };
}
