import { ParseStatus } from "@/lib/types";

const STATUS_MAP: Record<ParseStatus, { bg: string; text: string; label: string }> = {
  parsed: { bg: "bg-success-bg", text: "text-success-text", label: "파싱 완료" },
  "needs-manual": {
    bg: "bg-warning-bg",
    text: "text-warning-text",
    label: "주소 확인 필요",
  },
  error: { bg: "bg-danger-bg", text: "text-danger-text", label: "오류" },
};

export function Badge({ status }: { status: ParseStatus }) {
  const { bg, text, label } = STATUS_MAP[status];

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[13px] font-medium ${bg} ${text}`}
    >
      {label}
    </span>
  );
}
