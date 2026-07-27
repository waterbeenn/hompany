"use client";

import { FormEvent, useState } from "react";
import { JobListing } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { TransitRouteDetail } from "@/components/TransitRouteDetail";

interface ResultItemProps {
  index: number;
  job: JobListing;
  onManualSubmit: (id: string, companyName: string, address: string) => void;
}

export function ResultItem({ index, job, onManualSubmit }: ResultItemProps) {
  const [open, setOpen] = useState(false);
  const [companyName, setCompanyName] = useState(job.companyName ?? "");
  const [address, setAddress] = useState(job.address ?? "");

  function handleManualSubmit(e: FormEvent) {
    e.preventDefault();
    if (!companyName.trim() || !address.trim()) return;
    onManualSubmit(job.id, companyName.trim(), address.trim());
  }

  return (
    <li className="rounded-[var(--radius-card)] border border-gray-100">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
        aria-expanded={open}
      >
        <span className="flex items-center gap-3 min-w-0">
          <span className="text-[15px] text-gray-600 shrink-0">{index + 1}.</span>
          <span className="truncate text-[15px] text-gray-900">
            {job.companyName ?? job.url}
          </span>
        </span>
        <span className="flex items-center gap-3 shrink-0">
          <Badge status={job.status} />
          <span
            className={`inline-block transition-transform ${open ? "rotate-180" : ""}`}
            aria-hidden
          >
            ⌄
          </span>
        </span>
      </button>

      {open && (
        <div className="border-t border-gray-100 px-4 py-4">
          {job.status === "parsed" ? (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-[13px] text-gray-600">회사 주소</p>
                <p className="text-[15px] text-gray-900">{job.address}</p>
              </div>
              <div>
                <p className="text-[13px] text-gray-600">대중교통 소요시간</p>
                <div className="flex items-baseline gap-1.5">
                  <p className="text-[20px] font-medium text-gray-900">
                    {job.durationMin != null ? `${job.durationMin}분` : "-"}
                  </p>
                  {job.transitType && (
                    <span className="rounded-full bg-gray-50 px-2 py-0.5 text-[12px] text-gray-600">
                      {job.transitType}
                    </span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-[13px] text-gray-600">거리</p>
                <p className="text-[20px] font-medium text-gray-900">
                  {job.distanceKm != null ? `${job.distanceKm}km` : "-"}
                </p>
              </div>
            </div>
          ) : null}
          {job.status === "parsed" && job.transitLegs && job.transitLegs.length > 0 && (
            <div className="mt-4 border-t border-gray-100 pt-4">
              <TransitRouteDetail legs={job.transitLegs} finalWalkMin={job.finalWalkMin} />
            </div>
          )}
          {job.status !== "parsed" && (
            <form onSubmit={handleManualSubmit} className="flex flex-col gap-3">
              <p className="text-[13px] text-gray-600">
                {job.errorMessage ?? "자동으로 회사 주소를 찾지 못했어요. 직접 입력해주세요."}
              </p>
              <Input
                label="회사명"
                name={`companyName-${job.id}`}
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
              <Input
                label="회사 주소"
                name={`address-${job.id}`}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
              <Button type="submit" variant="outline" className="self-start">
                거리 다시 계산하기
              </Button>
            </form>
          )}
        </div>
      )}
    </li>
  );
}
