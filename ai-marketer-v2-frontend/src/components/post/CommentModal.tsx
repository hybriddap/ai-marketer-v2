import { useState, ChangeEvent } from "react";

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
  const [formData, setFormData] = useState({ text: "" });

  const [visible, setVisible] = useState<boolean[]>();

  if (!isOpen) return null;

  const commentStyle: React.CSSProperties = {
    padding: "8px 0",
    borderBottom: "1px solid #ddd",
  };

  // Handle form input changes
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (id: string, message: string) => {
    sendReply(id, message);
    setVisible([]);
  };

  const setReplyVisible = (index: number) => {
    const localVisibility = [];
    for (let i = 0; i < comments.length; i++) {
      localVisibility.push(false);
    }
    localVisibility[index] = true;
    setVisible(localVisibility);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Comments</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="bg-blue-50 p-3 border-b border-blue-100">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-blue-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1 md:flex md:justify-between">
              <p className="text-sm text-blue-700">
                {`Inappropriate or spam comments are automatically filtered and
                won't be shown.`}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {isLoaded ? (
            <ul>
              {comments.length > 0 ? (
                comments.map((comment, index) => (
                  <li key={index} style={commentStyle}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <strong>{comment.username}</strong>
                        <span
                          style={{
                            color: "#777",
                            fontSize: "0.85em",
                            marginLeft: "8px",
                          }}
                        >
                          {comment.date}
                        </span>
                      </div>
                      {comment.username != "User" && (
                        <button
                          style={{
                            color: "#aaa",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                          }}
                          onClick={() => deleteComment(comment.id)}
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontSize: "0.9em",
                        color: "#444",
                      }}
                    >
                      <span>{comment.text}</span>
                      <button
                        style={{
                          marginLeft: "8px",
                          color: comment.self_like ? "red" : "#aaa",
                        }}
                        onClick={() => likeComment(comment.id)}
                      >
                        {comment.self_like
                          ? "❤️"
                          : comment.likes != null
                          ? "🤍"
                          : ""}{" "}
                        {comment.likes}
                      </button>
                    </div>
                    {comment.username != "User" && visible && visible[index] ? (
                      <form
                        onSubmit={() => handleSubmit(comment.id, formData.text)}
                      >
                        <input
                          type="text"
                          name="text"
                          placeholder="Reply"
                          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-colors`}
                          required={true}
                          value={formData.text}
                          onChange={handleChange}
                        />
                        <button style={{ color: "blue" }} type="submit">
                          Reply
                        </button>
                      </form>
                    ) : (
                      comment.username != "User" && (
                        <button
                          style={{ color: "blue" }}
                          onClick={() => setReplyVisible(index)}
                        >
                          Reply
                        </button>
                      )
                    )}
                    {comment.replies.map((reply, index) => (
                      <li key={index} style={{ paddingLeft: "20px" }}>
                        <strong>
                          {comment.username == "User"
                            ? "Someone Replied:"
                            : "You Replied:"}
                        </strong>{" "}
                        <span
                          style={{ color: "#777", fontSize: "0.85em" }}
                        ></span>
                        <br />
                        <span style={{ fontSize: "0.9em", color: "#444" }}>
                          {reply}
                        </span>
                      </li>
                    ))}
                  </li>
                ))
              ) : (
                <p>No comments yet.</p>
              )}
            </ul>
          ) : (
            <p>Loading...</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentModal;
