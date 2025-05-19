// src/app/(protected)/dashboard/components/PlatformStatusChart.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Platform } from "@/types/business";
import { PLATFORM_CHART_COLORS } from "@/components/styles";
import {
  ChartData,
  ChartEvent,
  ActiveElement,
  ChartOptions,
  TooltipItem,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

interface PlatformStatusChartProps {
  data: Platform[];
}

export const PlatformStatusChart = ({ data }: PlatformStatusChartProps) => {
  const router = useRouter();
  const [chartData, setChartData] = useState<ChartData<"doughnut"> | null>(
    null
  );

  useEffect(() => {
    if (data) {
      const labels = data.map((p) => p.label);
      const counts: number[] = data.map((p) => p.numPublished ?? 0);

      const backgroundColors = data.map(
        (p) => PLATFORM_CHART_COLORS[p.key] ?? PLATFORM_CHART_COLORS.default
      );

      const borderColors = data.map(
        (p) =>
          PLATFORM_CHART_COLORS[p.key]?.replace("0.6", "1") ?? "rgba(0,0,0,1)"
      );

      const chart: ChartData<"doughnut"> = {
        labels,
        datasets: [
          {
            data: counts,
            backgroundColor: backgroundColors,
            borderColor: borderColors,
            borderWidth: 1,
          },
        ],
      };

      setChartData(chart);
    }
  }, [data]);

  const handleStatusClick = (event: ChartEvent, elements: ActiveElement[]) => {
    if (elements.length > 0 && chartData?.labels) {
      const { index } = elements[0];
      const platformKey = data[index]?.key;

      if (platformKey) {
        router.push(`/posts?platform=${platformKey}`);
      }
    }
  };

  const options: ChartOptions<"doughnut"> = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom" as const,
      },
      tooltip: {
        callbacks: {
          label: function (context: TooltipItem<"doughnut">) {
            const label = context.label || "";
            const value = context.raw || 0;
            return `${label}: ${value} posts`;
          },
        },
      },
    },
    onClick: handleStatusClick,
  };

  if (!chartData) {
    return (
      <div className="bg-white rounded-lg shadow p-4 h-64 flex items-center justify-center">
        <p className="text-gray-500">Loading Post Data...</p>
      </div>
    );
  }

  // Dynamically calculate grid columns based on number of platforms
  const getGridClass = (itemCount: number) => {
    if (itemCount <= 2) return "grid-cols-2";
    if (itemCount === 3) return "grid-cols-3";
    if (itemCount === 4) return "grid-cols-4";
    return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4";
  };

  const itemCount = (chartData?.labels as string[])?.length || 0;
  const gridClass = getGridClass(itemCount);

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-4">Platform Status Overview</h3>
      <div className="h-64 flex items-center justify-center">
        <Doughnut data={chartData!} options={options} />
      </div>

      {/* Dynamic grid layout based on number of items */}
      <div className={`mt-4 grid ${gridClass} gap-2`}>
        {(chartData?.labels as string[]).map((label: string, index: number) => (
          <div
            key={data[index]?.key}
            className="text-center cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors"
            onClick={() => router.push(`/posts?platform=${data[index]?.key}`)}
          >
            <div className="flex items-center justify-center">
              <div
                className="w-3 h-3 rounded-full mr-1"
                style={{
                  backgroundColor:
                    (chartData.datasets[0].backgroundColor as string[])[
                      index
                    ] ?? "#ccc",
                }}
              ></div>
              <span className="text-sm font-medium truncate">{label}</span>
            </div>
            <div className="text-lg font-bold">
              {chartData.datasets[0].data[index] ?? 0}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
