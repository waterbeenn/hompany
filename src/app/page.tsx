"use client";

import { useState } from "react";
import { JobListing } from "@/lib/types";
import { JobLinkForm } from "@/components/JobLinkForm";
import { ResultsList } from "@/components/ResultsList";
import { JobMap } from "@/components/JobMap";

interface Coordinate {
  lat: number;
  lng: number;
}

export default function Home() {
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [homeCoord, setHomeCoord] = useState<Coordinate | null>(null);

  async function handleSubmit(homeAddress: string, jobUrls: string[]) {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/parse-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ homeAddress, jobUrls }),
      });
      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error ?? "거리 계산 중 오류가 발생했습니다.");
        return;
      }

      setJobs(data.jobs ?? []);
      setHomeCoord(data.homeCoord ?? null);
    } catch {
      setSubmitError("서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleManualSubmit(
    id: string,
    companyName: string,
    address: string,
  ) {
    if (!homeCoord) return;

    try {
      const res = await fetch("/api/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          homeLat: homeCoord.lat,
          homeLng: homeCoord.lng,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setJobs((prev) =>
          prev.map((job) =>
            job.id === id
              ? {
                  ...job,
                  companyName,
                  address,
                  status: "needs-manual" as const,
                  errorMessage: data.error ?? "거리 계산에 실패했습니다.",
                }
              : job,
          ),
        );
        return;
      }

      setJobs((prev) =>
        prev.map((job) =>
          job.id === id
            ? {
                ...job,
                companyName,
                address,
                lat: data.lat,
                lng: data.lng,
                distanceKm: data.distanceKm,
                durationMin: data.durationMin,
                transitType: data.transitType,
                transitLegs: data.transitLegs,
                finalWalkMin: data.finalWalkMin,
                status: "parsed" as const,
                errorMessage: undefined,
              }
            : job,
        ),
      );
    } catch {
      setJobs((prev) =>
        prev.map((job) =>
          job.id === id
            ? {
                ...job,
                status: "needs-manual" as const,
                errorMessage: "서버에 연결할 수 없습니다.",
              }
            : job,
        ),
      );
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl gap-10 px-4 py-12">
      <div className="flex w-full max-w-xl flex-col gap-10">
        <header className="flex flex-col gap-1">
          <h1 className="text-[18px] font-medium text-gray-900">
            채용공고 거리 계산기
          </h1>
          <p className="text-[13px] text-gray-600">
            집 주소와 채용공고 링크를 입력하면 통근 거리를 계산해드립니다.
          </p>
        </header>

        <JobLinkForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
        {submitError && (
          <p className="rounded-[var(--radius-input)] bg-danger-bg px-3.5 py-2.5 text-[13px] text-danger-text">
            {submitError}
          </p>
        )}
        <ResultsList jobs={jobs} onManualSubmit={handleManualSubmit} />
      </div>

      <div className="sticky top-12 hidden h-[calc(100vh-6rem)] flex-1 lg:block">
        <JobMap homeCoord={homeCoord} jobs={jobs} />
      </div>
    </main>
  );
}
