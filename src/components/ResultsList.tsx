"use client";

import { JobListing } from "@/lib/types";
import { ResultItem } from "@/components/ResultItem";

interface ResultsListProps {
  jobs: JobListing[];
  onManualSubmit: (id: string, companyName: string, address: string) => void;
}

export function ResultsList({ jobs, onManualSubmit }: ResultsListProps) {
  if (jobs.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-[18px] font-medium text-gray-900">결과</h2>
      <ul className="flex flex-col gap-2">
        {jobs.map((job, index) => (
          <ResultItem
            key={job.id}
            index={index}
            job={job}
            onManualSubmit={onManualSubmit}
          />
        ))}
      </ul>
    </section>
  );
}
