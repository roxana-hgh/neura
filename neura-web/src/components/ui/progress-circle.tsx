import React from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "./popover";

type ProgressCircleProps = {
  percent: number;
  size?: number; // px
  strokeWidth?: number; // px
  colorClass?: string; // tailwind text color class for the filled arc, e.g. 'text-green-500'
  trackClass?: string; // tailwind text color class for the track, e.g. 'text-gray-200'
  /** enable the percentage label (disabled by default) */
  labelEnabled?: boolean;
  /** label position when enabled */
  labelPosition?: "center" | "left" | "right" | "bottom" | "popover";
  className?: string;
  fill?: boolean; // if true, fills the circle interior instead of using stroke
};

const ProgressCircle: React.FC<ProgressCircleProps> = ({
  percent,
  size = 48,
  strokeWidth = 6,
  colorClass = "text-sky-500",
  trackClass = "text-gray-200",
  labelEnabled = false,
  labelPosition = "center",
  className = "",
  fill = false,
}) => {
  const capped = Math.max(0, Math.min(100, percent));

  // non-fill (stroke) mode calculations
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - capped / 100);
  const center = size / 2;

  // determine track class behavior for fill mode (expect bg- classes) vs stroke mode (text- classes)
  const effectiveTrackClass = fill
    ? trackClass && trackClass.startsWith("bg-")
      ? trackClass
      : "bg-gray-200"
    : trackClass;

  // Render inner circle content (either filled or stroked)
  const renderInner = () => {
    if (fill) {
      const gradient = `conic-gradient(currentColor ${capped}%, rgba(0,0,0,0) ${capped}% )`;
      return (
        <>
          <div className={`absolute inset-0 rounded-full ${effectiveTrackClass}`} />
          <div
            className={`absolute inset-0 rounded-full overflow-hidden  ${colorClass}`}
            style={{ background: gradient, transition: "background 0.35s ease" }}
          />
        </>
      );
    }

    return (
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        role="img"
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="currentColor"
          className={effectiveTrackClass}
          strokeWidth={strokeWidth}
          fill="none"
        />

        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="currentColor"
          className={colorClass}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.5s ease, stroke 0.3s" }}
        />
      </svg>
    );
  };

  const labelEl = (
    <span className="text-xs font-medium leading-none">{Math.round(capped)}%</span>
  );

  // circle element (keeps inner layout isolated)
  const circleEl = (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      aria-label={`Progress: ${capped}%`}
    >
      {renderInner()}
      {labelEnabled && labelPosition === "center" && (
        <div className="absolute inset-0 flex items-center justify-center">{labelEl}</div>
      )}
    </div>
  );

  // Popover mode (wrap the circle in a popover trigger)
  if (labelEnabled && labelPosition === "popover") {
    return (
      <Popover>
        <PopoverTrigger asChild>{circleEl}</PopoverTrigger>
        <PopoverContent className="w-auto p-2">
          <div className="text-sm">{Math.round(capped)}%</div>
        </PopoverContent>
      </Popover>
    );
  }

  // Flex-based positioning for left, right, bottom
  if (labelEnabled && (labelPosition === "left" || labelPosition === "right")) {
    const children = labelPosition === "left" ? (
      <>
        <div className="flex items-center gap-1">{labelEl}</div>
        {circleEl}
      </>
    ) : (
      <>
        {circleEl}
        <div className="flex items-center gap-1">{labelEl}</div>
      </>
    );

    return (
      <div className={`inline-flex items-center gap-1 ${className}`}>{children}</div>
    );
  }

  if (labelEnabled && labelPosition === "bottom") {
    return (
      <div className={`inline-flex flex-col items-center gap-1 ${className}`}>
        {circleEl}
        <div>{labelEl}</div>
      </div>
    );
  }

  // default: just render circle (center handled inside circleEl)
  return <div className={className}>{circleEl}</div>;
};

export default ProgressCircle;
