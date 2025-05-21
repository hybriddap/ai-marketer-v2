// src/app/(protected)/posts/dashboard/index.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useNotification } from "@/context/NotificationContext";
import { DeletePostHandler } from "@/components/post/DeletePostHandler";
import { PlatformKey } from "@/utils/icon";
import { Post } from "@/types/post";
import { DropboxItem } from "@/types/index";
import { usePostEditorContext } from "@/context/PostEditorContext";
import { PostsFilterBar } from "./PostsFilterBar";
import { PostList } from "./PostList";
import { POST_STATUS_OPTIONS } from "@/constants/posts";
import { PLATFORM_OPTIONS_WITH_LABEL } from "@/utils/icon";
import { Card, ErrorFallback, SyncErrorBanner } from "@/components/common";
import { mutate } from "swr";
import { POSTS_API } from "@/constants/api";
import { apiClient } from "@/hooks/dataHooks";

const ITEMS_PER_PAGE = 5;

export const PostsDashboardView = ({
  posts,
  error,
  isLoading,
  syncErrors,
}: {
  posts: Post[];
  error: unknown;
  isLoading: boolean;
  syncErrors?: { platform: string; error: string }[];
}) => {
  const router = useRouter();
  const { setSelectedPost } = usePostEditorContext();
  const [selectedPostId, setSelectedPostId] = useState<string | undefined>(
    undefined
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformKey | null>(
    null
  );
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [isPendingDisplay, setIsPendingDisplay] = useState(true);

  const { showNotification } = useNotification();

  const handleLoadMore = () => setVisibleCount((prev) => prev + ITEMS_PER_PAGE);

  const filteredPosts = posts.filter(
    (post) =>
      (!selectedPlatform || post.platform.key === selectedPlatform) &&
      (!selectedStatus || post.status === selectedStatus) &&
      (!searchTerm ||
        post.caption.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const slicedPosts = filteredPosts.slice(0, visibleCount);
  const searchParams = useSearchParams();
  const postIdParam = searchParams.get("id");
  const statusParam = searchParams.get("status");
  const platformParam = searchParams.get("platform");
  const postRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const normalisedStatus =
      POST_STATUS_OPTIONS.find(
        (s) => s.key.toLowerCase() === statusParam?.toLowerCase()
      )?.key ?? null;
    setSelectedStatus(normalisedStatus);
  }, [statusParam]);

  useEffect(() => {
    const normalisedPlatform =
      PLATFORM_OPTIONS_WITH_LABEL.find(
        (p) => p.key.toLowerCase() === platformParam?.toLowerCase()
      )?.key ?? null;
    setSelectedPlatform(normalisedPlatform);
  }, [platformParam]);

  // Prevent flickering loading states with a short delay
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setIsPendingDisplay(false);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setIsPendingDisplay(false);
    }
  }, [isLoading]);

  // Auto-scroll to selected post when navigating from external links
  useEffect(() => {
    if (postIdParam && postRefs.current[postIdParam]) {
      postRefs.current[postIdParam]?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [postRefs, slicedPosts, postIdParam]);

  // Automatically load more posts if the selected post isn't in the current view
  useEffect(() => {
    if (!postIdParam) return;

    const isVisible = slicedPosts.some((p) => p.id === postIdParam);

    if (!isVisible && filteredPosts.length > slicedPosts.length) {
      setVisibleCount((prev) => prev + ITEMS_PER_PAGE);
    }
  }, [postIdParam, slicedPosts, filteredPosts]);

  // Show error UI if there's an error
  if (error) {
    const handleRetry = async () => {
      // Trigger global SWR revalidation
      await mutate(POSTS_API.LIST);
    };

    return (
      <ErrorFallback
        message="Failed to load posts. Please try again later."
        onRetry={handleRetry}
        isProcessing={isLoading}
      />
    );
  }

  const handleOpenDeleteModal = (postId: string) => {
    setSelectedPostId(postId);
  };

  const handleEdit = (post: Post) => {
    setSelectedPost(post);
    router.push(`/posts?mode=edit&id=${post.id}`);
  };

  const handleRetry = async (postId: string) => {
    console.log(`Retrying post: ${postId}`);
    const formData = new FormData();
    formData.append("retry", "t");

    // Use the PATCH endpoint to retry the post
    await apiClient.patch(
      POSTS_API.UPDATE(postId),
      formData,
      {},
      true // isFormData flag
    );

    // Show success notification
    showNotification("success", "Post retry successfully!");
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <DeletePostHandler
        selectedPostId={selectedPostId}
        onClose={() => setSelectedPostId(undefined)}
        onSuccess={(message) => showNotification("success", message)}
        onError={(message) => showNotification("error", message)}
        posts={posts}
      />

      {/* Display sync errors if present */}
      {syncErrors && syncErrors.length > 0 && (
        <SyncErrorBanner errors={syncErrors} />
      )}

      <PostsFilterBar
        setSearchTerm={setSearchTerm}
        selectedPlatform={selectedPlatform}
        setSelectedPlatform={setSelectedPlatform}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
      />

      {/* Loading State */}
      {isLoading && !isPendingDisplay && (
        <div className="relative w-full">
          <div className="mt-4 flex flex-col justify-center items-center py-16 bg-white rounded-lg shadow border border-gray-200">
            <div className="w-10 h-10 border-4 border-gray-300 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500">Loading posts...</p>
          </div>
        </div>
      )}

      {!isLoading && (
        <>
          {/* Empty State - No Posts */}
          {posts.length === 0 && (
            <Card showButton={false}>
              <div className="text-center py-8 text-sm">
                <p className="text-gray-600 mb-6 whitespace-pre-line">
                  {`No posts yet.\nClick 'Create Post' to start sharing your first post\nwith AI-powered help!`}
                </p>
              </div>
            </Card>
          )}

          {/* Empty State - No Filtered Results */}
          {posts.length > 0 && filteredPosts.length === 0 && (
            <Card showButton={false}>
              <div className="text-center py-8 text-sm">
                <p className="text-gray-600 mb-6 whitespace-pre-line">
                  {`We couldn't find any posts that match your search.\nTry changing the filters or keywords!`}
                </p>
              </div>
            </Card>
          )}

          {/* Posts List */}
          {filteredPosts.length > 0 && (
            <>
              <PostList
                posts={slicedPosts}
                actionsBuilder={(post) => {
                  return [
                    post.status === "Failed"
                      ? { label: "Retry", onClick: () => handleRetry(post.id) }
                      : false,
                    post.status !== "Published"
                      ? { label: "Edit", onClick: () => handleEdit(post) }
                      : false,
                    {
                      label: "Delete",
                      onClick: () => handleOpenDeleteModal(post.id),
                    },
                  ].filter(Boolean) as DropboxItem[];
                }}
                postRefs={postRefs}
              />

              {/* Load More Button */}
              {visibleCount < filteredPosts.length && (
                <div className="flex justify-center mt-6">
                  <button
                    id="load-more-button"
                    onClick={handleLoadMore}
                    className="w-full px-6 py-3 text-sm font-medium text-gray-600 bg-white border border-gray-300 
                                rounded-lg shadow-sm hover:bg-gray-100 transition"
                  >
                    Load More
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};
