import { TransitLeg } from "@/lib/types";

interface TransitRouteDetailProps {
  legs: TransitLeg[];
  finalWalkMin?: number;
}

function TimelineRow({
  dot,
  isLast,
  children,
}: {
  dot?: React.ReactNode;
  isLast?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex w-3.5 shrink-0 flex-col items-center">
        {dot ?? <span className="h-3.5 w-3.5" />}
        {!isLast && <span className="w-px flex-1 bg-gray-100" />}
      </div>
      <div className="pb-3">{children}</div>
    </div>
  );
}

const startDot = <span className="h-3.5 w-3.5 rounded-full bg-success-text" />;
const stopDot = (
  <span className="h-3.5 w-3.5 rounded-full border-2 border-primary bg-white" />
);
const endDot = <span className="h-3.5 w-3.5 rounded-full bg-gray-900" />;

export function TransitRouteDetail({ legs, finalWalkMin }: TransitRouteDetailProps) {
  if (legs.length === 0) return null;

  return (
    <div className="flex flex-col">
      <TimelineRow dot={startDot}>
        <p className="text-[13px] text-gray-900">출발</p>
      </TimelineRow>

      {legs.map((leg, i) => {
        const isLastLeg = i === legs.length - 1;
        const showFinalWalk = isLastLeg && (finalWalkMin ?? 0) > 0;

        return (
          <div key={i} className="contents">
            {leg.walkBeforeMin > 0 && (
              <TimelineRow>
                <p className="text-[12px] text-gray-600">도보 {leg.walkBeforeMin}분</p>
              </TimelineRow>
            )}

            <TimelineRow dot={stopDot}>
              <p className="text-[13px] text-gray-900">{leg.startName} 승차</p>
            </TimelineRow>

            <TimelineRow>
              <div className="flex items-center gap-2 rounded-[var(--radius-input)] bg-primary-bg px-3 py-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-medium text-white">
                  {leg.mode === "subway" ? "철" : "버"}
                </span>
                <span className="text-[13px] font-medium text-primary-text">
                  {leg.label}
                </span>
                <span className="text-[13px] text-gray-900">{leg.sectionTime}분</span>
              </div>
              <p className="mt-1 text-[12px] text-gray-600">
                {leg.stationCount}개 정류장 이동
              </p>
            </TimelineRow>

            <TimelineRow
              dot={!isLastLeg || showFinalWalk ? stopDot : endDot}
              isLast={isLastLeg && !showFinalWalk}
            >
              <p className="text-[13px] text-gray-900">{leg.endName} 하차</p>
            </TimelineRow>
          </div>
        );
      })}

      {(finalWalkMin ?? 0) > 0 && (
        <>
          <TimelineRow>
            <p className="text-[12px] text-gray-600">도보 {finalWalkMin}분</p>
          </TimelineRow>
          <TimelineRow dot={endDot} isLast>
            <p className="text-[13px] text-gray-900">도착</p>
          </TimelineRow>
        </>
      )}
    </div>
  );
}
