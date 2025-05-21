import { useState, ChangeEvent, useRef, useEffect } from "react";

type Comment = {
  id: string;
  username: string;
  text: string;
  date: string;
  replies: string[];
  likes: number;
  self_like: boolean;
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  comments: Comment[];
  isLoaded: boolean;
  likeComment: (id: string) => void;
  deleteComment: (id: string) => void;
  sendReply: (id: string, message: string) => void;
}

const CommentModal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  comments,
  isLoaded,
  likeComment,
  deleteComment,
  sendReply,
}) => {
  const [replyText, setReplyText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<{
    type: "like" | "delete" | "reply" | null;
    commentId: string | null;
  }>({ type: null, commentId: null });
  const modalRef = useRef<HTMLDivElement>(null);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setReplyText(e.target.value);
  };

  const handleReply = async (commentId: string) => {
    if (!replyText.trim()) return;

    setActionInProgress({ type: "reply", commentId });
    await sendReply(commentId, replyText);
    setReplyText("");
    setReplyingTo(null);
    setActionInProgress({ type: null, commentId: null });
  };

  const handleLike = async (commentId: string) => {
    setActionInProgress({ type: "like", commentId });
    await likeComment(commentId);
    setActionInProgress({ type: null, commentId: null });
  };

  const handleDelete = async (commentId: string) => {
    setActionInProgress({ type: "delete", commentId });
    await deleteComment(commentId);
    setActionInProgress({ type: null, commentId: null });
  };

  const toggleReplyForm = (commentId: string) => {
    if (replyingTo === commentId) {
      setReplyingTo(null);
      setReplyText("");
    } else {
      setReplyingTo(commentId);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Comments</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            &times;
          </button>
        </div>

        {/* Comment list with scroll */}
        <div className="overflow-y-auto flex-grow p-4">
          {!isLoaded && comments.length === 0 ? (
            <div className="flex justify-center items-center h-40">
              <div className="w-10 h-10 border-4 border-gray-300 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
          ) : comments.length > 0 ? (
            <ul className="space-y-4">
              {comments.map((comment) => (
                <li key={comment.id} className="border-b pb-4">
                  {/* Comment header with username and date */}
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center">
                      <span className="font-medium">{comment.username}</span>
                      <span className="text-gray-500 text-xs ml-2">
                        {comment.date}
                      </span>
                    </div>

                    {comment.username !== "User" && (
                      <button
                        onClick={() => handleDelete(comment.id)}
                        disabled={
                          actionInProgress.type === "delete" &&
                          actionInProgress.commentId === comment.id
                        }
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        {actionInProgress.type === "delete" &&
                        actionInProgress.commentId === comment.id ? (
                          <div className="w-4 h-4 border-2 border-gray-300 border-t-red-500 rounded-full animate-spin"></div>
                        ) : (
                          <span className="text-sm">🗑️</span>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Comment text and like button */}
                  <div className="mb-2">
                    <p className="text-gray-800 text-sm">{comment.text}</p>
                  </div>

                  {comment.username !== "User" && (
                    <div className="flex justify-between items-center">
                      <button
                        onClick={() => toggleReplyForm(comment.id)}
                        className={`text-xs font-medium ${
                          replyingTo === comment.id
                            ? "text-indigo-700"
                            : "text-indigo-600 hover:text-indigo-700"
                        } transition-colors`}
                        disabled={comment.username === "User"}
                      >
                        {replyingTo === comment.id ? "Cancel" : "Reply"}
                      </button>

                      <button
                        onClick={() => handleLike(comment.id)}
                        disabled={
                          actionInProgress.type === "like" &&
                          actionInProgress.commentId === comment.id
                        }
                        className="flex items-center space-x-1 text-xs"
                      >
                        {actionInProgress.type === "like" &&
                        actionInProgress.commentId === comment.id ? (
                          <div className="w-4 h-4 border-2 border-gray-300 border-t-red-500 rounded-full animate-spin mr-1"></div>
                        ) : (
                          <span
                            className={
                              comment.self_like
                                ? "text-red-500"
                                : "text-gray-400"
                            }
                          >
                            {comment.self_like ? "❤️" : "🤍"}
                          </span>
                        )}
                        <span className="text-gray-500">{comment.likes}</span>
                      </button>
                    </div>
                  )}

                  {/* Reply form */}
                  {replyingTo === comment.id && (
                    <div className="mt-3">
                      <div className="flex items-center">
                        <input
                          type="text"
                          value={replyText}
                          onChange={handleInputChange}
                          placeholder="Write a reply..."
                          className="flex-grow p-2 text-sm border rounded-l-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <button
                          onClick={() => handleReply(comment.id)}
                          disabled={
                            actionInProgress.type === "reply" &&
                            actionInProgress.commentId === comment.id
                          }
                          className="px-3 py-2 bg-indigo-600 text-white text-sm rounded-r-md hover:bg-indigo-700 transition-colors"
                        >
                          {actionInProgress.type === "reply" &&
                          actionInProgress.commentId === comment.id ? (
                            <div className="w-4 h-4 border-2 border-indigo-300 border-t-white rounded-full animate-spin"></div>
                          ) : (
                            "Send"
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Comment replies */}
                  {comment.replies.length > 0 && (
                    <div className="mt-3 pl-4 border-l-2 border-gray-200">
                      <ul className="space-y-2">
                        {comment.replies.map((reply, replyIndex) => (
                          <li
                            key={`${comment.id}-reply-${replyIndex}`}
                            className="text-sm"
                          >
                            <div className="font-medium text-xs">
                              {comment.username === "User"
                                ? "Someone replied:"
                                : "You replied:"}
                            </div>
                            <p className="text-gray-800">{reply}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-gray-500 py-8">No comments yet.</p>
          )}
        </div>

        {/* Footer with disclaimer */}
        <div className="p-3 bg-gray-50 border-t text-xs text-gray-500 text-center">
          {`Inappropriate or spam comments won't be shown`}
        </div>
      </div>
    </div>
  );
};

export default CommentModal;
