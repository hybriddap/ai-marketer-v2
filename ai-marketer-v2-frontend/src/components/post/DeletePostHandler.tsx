// src/components/post/DeletePostHandler.tsx
import { useState } from "react";
import { Post } from "@/types/post";
import { POSTS_API } from "@/constants/api";
import { apiClient } from "@/hooks/dataHooks";
import { useNotification } from "@/context/NotificationContext";
import { ConfirmModal } from "@/components/common";
import { mutate } from "swr";

interface DeletePostHandlerProps {
  selectedPostId: string | undefined;
  onClose: () => void;
  post: Post | undefined;
}

export const DeletePostHandler = ({
  selectedPostId,
  onClose,
  post,
}: DeletePostHandlerProps) => {
  const { showNotification } = useNotification();
  const [isLoading, setIsLoading] = useState(false);
  const isInstagramPost = post?.platform?.key === "instagram";

  // Generate appropriate message based on post status
  const getDeleteConfirmMessage = () => {
    switch (post?.status) {
      case "Published":
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

  const handleDelete = async () => {
    if (!selectedPostId) return;
    setIsLoading(true);

    try {
      await apiClient.delete(POSTS_API.DELETE(selectedPostId));
      showNotification("success", "Post deleted successfully!");
      await mutate(POSTS_API.LIST);
    } catch (error: unknown) {
      if (error instanceof Error) {
        const parsed = JSON.parse(error.message);
        showNotification(
          "error",
          `Failed to delete post. ${parsed.data?.message}.`
        );
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
      type={isInstagramPost && post.status === "Published" ? "info" : "warning"}
      itemId={selectedPostId}
      onClose={onClose}
      onConfirm={() => handleDelete()}
    />
  );
};
