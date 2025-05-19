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

  // Check if there's any data to display
  const hasData =
    data &&
    data.length > 0 &&
    data.some((platform) => (platform.numPublished ?? 0) > 0);

  useEffect(() => {
    if (data && data.length > 0) {
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

  // Empty state - No platforms connected
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-4">Platform Status Overview</h3>
        <div className="h-64 flex flex-col items-center justify-center">
          <div className="w-16 h-16 mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
          </div>
          <p className="text-gray-500 text-sm mb-4 text-center">
            No social media accounts connected
          </p>
        </div>
      </div>
    );
  }

  // Empty state - Platforms connected but no posts
  if (!hasData) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-4">Platform Status Overview</h3>
        <div className="h-64 flex flex-col items-center justify-center">
          <div className="w-16 h-16 mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p className="text-gray-500 text-sm mb-4 text-center">
            No posts published yet
          </p>
          <button
            onClick={() => router.push("/posts?mode=create")}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700 transition"
          >
            Create Your First Post
          </button>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {data.map((platform) => (
            <div key={platform.key} className="text-center p-2 rounded">
              <div className="flex items-center justify-center">
                <div
                  className="w-3 h-3 rounded-full mr-1"
                  style={{
                    backgroundColor:
                      PLATFORM_CHART_COLORS[platform.key] ?? "#ccc",
                  }}
                ></div>
                <span className="text-sm font-medium truncate">
                  {platform.label}
                </span>
              </div>
              <div className="text-lg font-bold">0</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Loading state
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
