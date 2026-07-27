"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const MAX_LINKS = 5;

interface JobLinkFormProps {
  onSubmit: (homeAddress: string, jobUrls: string[]) => void;
  isSubmitting?: boolean;
}

export function JobLinkForm({ onSubmit, isSubmitting }: JobLinkFormProps) {
  const [homeAddress, setHomeAddress] = useState("");
  const [jobUrls, setJobUrls] = useState<string[]>([""]);
  const [error, setError] = useState<string | undefined>();

  function updateUrl(index: number, value: string) {
    setJobUrls((prev) => prev.map((url, i) => (i === index ? value : url)));
  }

  function addUrlField() {
    if (jobUrls.length >= MAX_LINKS) return;
    setJobUrls((prev) => [...prev, ""]);
  }

  function removeUrlField(index: number) {
    setJobUrls((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!homeAddress.trim()) {
      setError("집 주소를 입력해주세요.");
      return;
    }

    const validUrls = jobUrls.map((url) => url.trim()).filter(Boolean);
    if (validUrls.length === 0) {
      setError("채용공고 링크를 1개 이상 입력해주세요.");
      return;
    }

    setError(undefined);
    onSubmit(homeAddress.trim(), validUrls);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h2 className="text-[18px] font-medium text-gray-900">Step 1. 집 주소</h2>
        <Input
          label="집 주소"
          name="homeAddress"
          placeholder="예: 서울시 강남구 테헤란로 123"
          value={homeAddress}
          onChange={(e) => setHomeAddress(e.target.value)}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-[18px] font-medium text-gray-900">
          Step 2. 채용공고 링크
        </h2>
        <div className="flex flex-col gap-3">
          {jobUrls.map((url, index) => (
            <div key={index} className="flex items-start gap-2">
              <div className="flex-1">
                <Input
                  label={`링크 ${index + 1}`}
                  name={`jobUrl-${index}`}
                  placeholder="예: https://www.jobkorea.co.kr/Recruit/GI_Read/..."
                  value={url}
                  onChange={(e) => updateUrl(index, e.target.value)}
                />
              </div>
              {jobUrls.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeUrlField(index)}
                  className="mt-8 text-[13px] text-gray-600 hover:text-danger-text"
                  aria-label={`링크 ${index + 1} 삭제`}
                >
                  삭제
                </button>
              )}
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={addUrlField}
          disabled={jobUrls.length >= MAX_LINKS}
          className="self-start"
        >
          링크 추가 ({jobUrls.length}/{MAX_LINKS})
        </Button>
      </section>

      {error && <p className="text-[13px] text-danger-text">{error}</p>}

      <Button type="submit" disabled={isSubmitting} className="self-start">
        {isSubmitting ? "계산 중..." : "거리 계산하기"}
      </Button>
    </form>
  );
}
