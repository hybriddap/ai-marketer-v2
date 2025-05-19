// src/app/(protected)/dashboard/components/PostStatusChart.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { PostsSummary } from "@/types/business";
import { STATUS_COLORS_CHART } from "@/components/styles";
import {
  ChartData,
  ChartEvent,
  ActiveElement,
  ChartOptions,
  TooltipItem,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

interface PostStatusChartProps {
  data: PostsSummary;
}

export const PostStatusChart = ({ data }: PostStatusChartProps) => {
  const router = useRouter();
  const [chartData, setChartData] = useState<ChartData<"doughnut"> | null>(
    null
  );

  // Check if there's any data to display
  const hasData =
    data &&
    (data.numScheduled > 0 || data.numPublished > 0 || data.numFailed > 0);

  useEffect(() => {
    if (data) {
      const labels: string[] = ["Scheduled", "Published", "Failed"];
      const counts = [data.numScheduled, data.numPublished, data.numFailed];

      const backgroundColors = labels.map(
        (status) => STATUS_COLORS_CHART[status] ?? "rgba(0, 0, 0, 0.3)"
      );

      const borderColors = labels.map(
        (status) =>
          STATUS_COLORS_CHART[status]?.replace("0.6", "1") ?? "rgba(0,0,0,1)"
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
      const label = chartData.labels[index];

      if (typeof label === "string") {
        const status = label.toLowerCase();
        router.push(`/posts?status=${status}`);
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

  // Empty state - no posts yet
  if (!hasData) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-4">Post Status Overview</h3>
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
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <p className="text-gray-500 text-sm mb-4 text-center">
            No posts data yet
          </p>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {["Scheduled", "Published", "Failed"].map((status) => (
            <div key={status} className="text-center p-2 rounded">
              <div className="flex items-center justify-center">
                <div
                  className="w-3 h-3 rounded-full mr-1"
                  style={{
                    backgroundColor: STATUS_COLORS_CHART[status] ?? "#ccc",
                  }}
                ></div>
                <span className="text-sm font-medium">{status}</span>
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

  // Normal state with data
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-4">Post Status Overview</h3>
      <div className="h-64 flex items-center justify-center">
        <Doughnut data={chartData!} options={options} />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {chartData?.labels?.map((status, index) => (
          <div
            key={status as string}
            className="text-center cursor-pointer hover:bg-gray-100 p-2 rounded"
            onClick={() =>
              router.push(`/posts?status=${(status as string).toLowerCase()}`)
            }
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
              <span className="text-sm font-medium">{status as string}</span>
            </div>
            <div className="text-lg font-bold">
              {chartData?.datasets?.[0]?.data?.[index] ?? 0}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
