// src/components/post/DeletePostHandler.tsx
import { useState } from "react";
import { Post } from "@/types/post";
import { POSTS_API } from "@/constants/api";
import { apiClient } from "@/hooks/dataHooks";
import { ConfirmModal } from "@/components/common";
import { mutate } from "swr";

interface DeletePostHandlerProps {
  selectedPostId: string | undefined;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError?: (message: string) => void;
  posts: Post[];
}

export const DeletePostHandler = ({
  selectedPostId,
  onClose,
  onSuccess,
  onError,
  posts,
}: DeletePostHandlerProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const post = posts.find((p) => p.id === selectedPostId);
  const isInstagramPost = post?.platform?.key === "instagram";

  // Generate appropriate message based on post status
  const getDeleteConfirmMessage = () => {
    if (!post)
      return "Are you sure you want to delete this post? This action cannot be undone.";

    switch (post.status) {
      case "Posted":
        if (isInstagramPost) {
          return `Instagram doesn't support post deletion through the API. We'll implement this feature when it becomes available. Please wait.`;
        }
        return `Are you sure you want to delete this posted content?
        This will remove it from social media platforms.`;
      case "Scheduled":
        return `Are you sure you want to delete this scheduled post?
        This will cancel the scheduled publishing.`;
      case "Failed":
        return `Are you sure you want to delete this failed post?
        You may want to retry publishing it instead.`;
      default:
        return `Are you sure you want to delete this post?
        This action cannot be undone.`;
    }
  };

  const handleDelete = async (itemId: string | undefined) => {
    if (!itemId) return;
    setIsLoading(true);

    try {
      await apiClient.delete(POSTS_API.DELETE(itemId));
      onSuccess("Post deleted successfully!");
      // Trigger global SWR revalidation
      await mutate(POSTS_API.LIST);
    } catch (error: unknown) {
      if (error instanceof Error) {
        const parsed = JSON.parse(error.message); // parse the string into an object
        //console.error("Error deleting post:", parsed.data?.message);
        if (onError) {
          onError(`Failed to delete post. ${parsed.data?.message}.`);
        }
      }
    } finally {
      setIsLoading(false);
      onClose();
    }
  };

  return (
    <ConfirmModal
      isOpen={!!selectedPostId}
      title="Delete Confirmation"
      message={getDeleteConfirmMessage()}
      confirmButtonText={isLoading ? "Deleting..." : "Delete"}
      type={isInstagramPost && post.status === "Posted" ? "info" : "warning"}
      itemId={selectedPostId}
      onClose={onClose}
      onConfirm={() => handleDelete(selectedPostId)}
    />
  );
};
