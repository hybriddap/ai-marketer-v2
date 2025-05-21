// src/components/common/SyncErrorBanner.tsx
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  FaExclamationTriangle,
  FaInfoCircle,
  FaTimesCircle,
} from "react-icons/fa";

interface SyncErrorBannerProps {
  errors: { platform: string; error: string }[];
}

export default function SyncErrorBanner({ errors }: SyncErrorBannerProps) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);

  if (!errors || errors.length === 0 || dismissed) {
    return null;
  }

  // Group errors by platform for better display
  const errorsByPlatform = errors.reduce((acc, { platform, error }) => {
    if (!acc[platform]) {
      acc[platform] = [];
    }
    acc[platform].push(error);
    return acc;
  }, {} as Record<string, string[]>);

  // Determine if reconnection is needed based on error messages
  const needsReconnection = Object.values(errorsByPlatform)
    .flat()
    .some(
      (error) =>
        error.includes("reconnect") ||
        error.includes("access token") ||
        error.includes("Unable to retrieve")
    );

  return (
    <div className="mb-4 bg-amber-50 border-l-4 border-amber-500 rounded-md p-4 relative">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
        aria-label="Dismiss"
      >
        <FaTimesCircle />
      </button>

      <div className="flex items-start">
        <div className="flex-shrink-0 mr-3">
          <FaExclamationTriangle className="h-5 w-5 text-amber-500" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-amber-800">
            Social Media Sync Issues Detected
          </h3>

          <div className="mt-2 text-sm text-amber-700">
            {needsReconnection ? (
              <p>
                Some of your social media accounts need to be reconnected. This
                typically happens when access tokens expire.
              </p>
            ) : (
              <p>
                We encountered some issues while syncing with your social media
                accounts.
              </p>
            )}

            <div className="mt-2 space-y-1">
              {Object.entries(errorsByPlatform).map(
                ([platform, platformErrors]) => (
                  <div key={platform} className="font-medium">
                    {platform.charAt(0).toUpperCase() + platform.slice(1)}:
                    <ul className="ml-5 list-disc font-normal">
                      {platformErrors.map((error, idx) => (
                        <li key={idx} className="text-xs">
                          {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              )}
            </div>

            <div className="mt-3 flex items-center text-xs">
              <FaInfoCircle className="mr-1 text-amber-600" />
              <span>
                {needsReconnection
                  ? "Your account credentials need to be refreshed. This is normal and happens periodically for security reasons."
                  : "Temporary issues may resolve on their own. If the problem persists, try reconnecting your accounts."}
              </span>
            </div>
          </div>

          <div className="mt-3">
            <button
              onClick={() => router.push("/settings/social")}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-amber-800 bg-amber-200 hover:bg-amber-300"
            >
              Go to Social Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
