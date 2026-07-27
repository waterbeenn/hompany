const KAKAO_LOCAL_URL =
  "https://dapi.kakao.com/v2/local/search/address.json";

export interface Coordinate {
  lat: number;
  lng: number;
}

export async function geocodeAddress(address: string): Promise<Coordinate | null> {
  const apiKey = process.env.KAKAO_REST_API_KEY;
  if (!apiKey) {
    throw new Error("KAKAO_REST_API_KEY 환경변수가 설정되지 않았습니다.");
  }

  const res = await fetch(
    `${KAKAO_LOCAL_URL}?query=${encodeURIComponent(address)}`,
    { headers: { Authorization: `KakaoAK ${apiKey}` } },
  );

  if (!res.ok) return null;

  const data = await res.json();
  const first = data.documents?.[0];
  if (!first) return null;

  return { lat: Number(first.y), lng: Number(first.x) };
}

// 두 좌표 간 직선 거리(km) — Haversine 공식.
// 대중교통 소요시간은 lib/odsay.ts에서 별도로 조회한다.
export function haversineDistanceKm(a: Coordinate, b: Coordinate): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return Math.round(R * 2 * Math.asin(Math.sqrt(h)) * 10) / 10;
}
