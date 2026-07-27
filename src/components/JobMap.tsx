"use client";

import { useEffect, useRef, useState } from "react";
import { JobListing } from "@/lib/types";

interface Coordinate {
  lat: number;
  lng: number;
}

interface JobMapProps {
  homeCoord: Coordinate | null;
  jobs: JobListing[];
}

// 카카오맵 JS SDK는 window 전역에 kakao 네임스페이스를 주입한다.
// 공식 타입 패키지를 추가하기 전까지는 최소한의 any로 다룬다.
declare global {
  interface Window {
    kakao: any;
  }
}

const JS_KEY = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;

const PIN_SHAPE =
  "M16 0C7.163 0 0 7.163 0 16c0 11.5 16 24 16 24s16-12.5 16-24C32 7.163 24.837 0 16 0z";

function pinMarkerImage(kakao: any, svgInner: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
    ${svgInner}
  </svg>`;
  const src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

  return new kakao.maps.MarkerImage(src, new kakao.maps.Size(32, 40), {
    offset: new kakao.maps.Point(16, 40),
  });
}

// 집 마커: 뉴트럴 색 핀 + 하우스 아이콘.
function createHouseMarkerImage(kakao: any) {
  return pinMarkerImage(
    kakao,
    `<path d="${PIN_SHAPE}" fill="#2C2C2A"/>
     <path d="M16 9L22 15L22 22L18.5 22L18.5 17.5L13.5 17.5L13.5 22L10 22L10 15Z" fill="white"/>`,
  );
}

// 회사 마커: Primary Blue 핀 + 결과 리스트 순번과 동일한 숫자.
function createNumberedMarkerImage(kakao: any, label: string) {
  return pinMarkerImage(
    kakao,
    `<path d="${PIN_SHAPE}" fill="#378ADD"/>
     <text x="16" y="17" text-anchor="middle" dominant-baseline="central"
       font-family="Arial, sans-serif" font-size="11" font-weight="700" fill="white">${label}</text>`,
  );
}

function loadKakaoMapsSdk(): Promise<void> {
  if (window.kakao?.maps) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.getElementById("kakao-maps-sdk");
    if (existing) {
      existing.addEventListener("load", () => window.kakao.maps.load(resolve));
      existing.addEventListener("error", reject);
      return;
    }

    const script = document.createElement("script");
    script.id = "kakao-maps-sdk";
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${JS_KEY}&autoload=false`;
    script.onload = () => window.kakao.maps.load(resolve);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export function JobMap({ homeCoord, jobs }: JobMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!JS_KEY || !containerRef.current) return;

    let cancelled = false;

    loadKakaoMapsSdk()
      .then(() => {
        if (cancelled || !containerRef.current) return;

        const { kakao } = window;
        const center = homeCoord ?? { lat: 37.5665, lng: 126.978 };

        const map = new kakao.maps.Map(containerRef.current, {
          center: new kakao.maps.LatLng(center.lat, center.lng),
          level: 7,
        });

        const bounds = new kakao.maps.LatLngBounds();

        if (homeCoord) {
          const homePos = new kakao.maps.LatLng(homeCoord.lat, homeCoord.lng);
          new kakao.maps.Marker({
            map,
            position: homePos,
            title: "집",
            image: createHouseMarkerImage(kakao),
          });
          bounds.extend(homePos);
        }

        jobs.forEach((job, index) => {
          if (job.status !== "parsed" || job.lat == null || job.lng == null) return;

          const pos = new kakao.maps.LatLng(job.lat, job.lng);
          const marker = new kakao.maps.Marker({
            map,
            position: pos,
            image: createNumberedMarkerImage(kakao, String(index + 1)),
          });
          const infowindow = new kakao.maps.InfoWindow({
            content: `<div style="padding:4px 8px;font-size:12px;white-space:nowrap;">${
              index + 1
            }. ${job.companyName ?? job.address ?? "회사"}</div>`,
          });
          kakao.maps.event.addListener(marker, "click", () =>
            infowindow.open(map, marker),
          );
          bounds.extend(pos);
        });

        if (homeCoord || jobs.length > 0) {
          map.setBounds(bounds);
        }
      })
      .catch(() => !cancelled && setLoadError(true));

    return () => {
      cancelled = true;
    };
  }, [homeCoord, jobs]);

  if (!JS_KEY) {
    return (
      <div className="flex h-full min-h-[320px] items-center justify-center rounded-[var(--radius-card)] border border-gray-100 bg-gray-50 px-6 text-center text-[13px] text-gray-600">
        지도를 표시하려면 카카오맵 JavaScript 키(NEXT_PUBLIC_KAKAO_JS_KEY)가
        필요합니다.
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex h-full min-h-[320px] items-center justify-center rounded-[var(--radius-card)] border border-gray-100 bg-gray-50 px-6 text-center text-[13px] text-danger-text">
        지도를 불러오지 못했습니다. 카카오 개발자 콘솔에 이 도메인이
        등록되어 있는지 확인해주세요.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-full min-h-[320px] w-full rounded-[var(--radius-card)] border border-gray-100"
    />
  );
}
