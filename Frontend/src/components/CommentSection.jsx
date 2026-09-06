/**
 * Comment Section Component
 * Handles YouTube video commenting workflow:
 * - Total comments counter
 * - Sorting toggle (Top comments vs Newest first)
 * - Comment input box with focus underline and Cancel/Comment buttons
 * - Individual comment rendering with time ago and edited badge
 * - Options menu (Edit, Delete) for author
 * - Inline edit mode with Save / Cancel
 * - Like and dislike counters on individual comments
 */

import { useState, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { ThumbUpIcon, ThumbDownIcon, MoreVerticalIcon, EditIcon, TrashIcon, SortIcon } from './Icons';

import { formatTimeAgo } from '../utils/formatters';
import { addComment, editComment, deleteComment } from '../utils/videoService';
import {
  addCommentThunk,
  editCommentThunk,
  deleteCommentThunk
} from '../store/slices/videoSlice';

export default function CommentSection({ videoId, comments = [], currentUser, onCommentUpdated }) {
  const dispatch = useDispatch();
  const [newCommentText, setNewCommentText] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [activeMenuCommentId, setActiveMenuCommentId] = useState(null);
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'top'
  const [commentLikes, setCommentLikes] = useState({});

  // Current user info or guest fallback
  const userAvatar = currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80';
  const userName = currentUser?.username || 'You';

  // Sort comments according to selected filter
  const sortedComments = useMemo(() => {
    const list = [...(comments || [])];
    if (sortBy === 'top') {
      return list.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    }
    // Default newest first
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [comments, sortBy]);

  // Handle adding a new comment
  const handleAddComment = (e) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    try {
      const { video } = addComment(videoId, {
        text: newCommentText.trim(),
        user: currentUser
      });

      dispatch(addCommentThunk({ videoId, text: newCommentText.trim(), user: currentUser }));
      setNewCommentText('');
      setIsInputFocused(false);
      if (onCommentUpdated) {
        onCommentUpdated(video);
      }
    } catch (err) {
      console.error('Failed to add comment:', err);
    }
  };

  // Start editing a comment
  const handleStartEdit = (comment) => {
    setEditingCommentId(comment.commentId);
    setEditingText(comment.text);
    setActiveMenuCommentId(null);
  };

  // Save edited comment
  const handleSaveEdit = (commentId) => {
    if (!editingText.trim()) return;

    try {
      const { video } = editComment(videoId, commentId, editingText.trim());
      dispatch(editCommentThunk({ videoId, commentId, text: editingText.trim() }));
      setEditingCommentId(null);
      setEditingText('');
      if (onCommentUpdated) {
        onCommentUpdated(video);
      }
    } catch (err) {
      console.error('Failed to update comment:', err);
    }
  };

  // Cancel edit mode
  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingText('');
  };

  // Delete a comment
  const handleDeleteComment = (commentId) => {
    if (!window.confirm('Delete this comment permanently?')) {
      return;
    }

    try {
      const { video } = deleteComment(videoId, commentId);
      dispatch(deleteCommentThunk({ videoId, commentId }));
      setActiveMenuCommentId(null);
      if (onCommentUpdated) {
        onCommentUpdated(video);
      }
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  // Like a comment (local state toggle)
  const handleToggleCommentLike = (commentId) => {
    setCommentLikes((prev) => {
      const current = prev[commentId];
      if (current === 'like') {
        const next = { ...prev };
        delete next[commentId];
        return next;
      }
      return { ...prev, [commentId]: 'like' };
    });
  };

  const handleToggleCommentDislike = (commentId) => {
    setCommentLikes((prev) => {
      const current = prev[commentId];
      if (current === 'dislike') {
        const next = { ...prev };
        delete next[commentId];
        return next;
      }
      return { ...prev, [commentId]: 'dislike' };
    });
  };

  return (
    <div className="yt-comments-section mt-6 select-none">
      {/* Comments Header: Count & Sort */}
      <div className="flex items-center gap-8 mb-6">
        <h2 className="text-xl font-bold text-white tracking-tight">
          {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
        </h2>

        <div className="flex items-center gap-2 cursor-pointer text-sm font-medium text-white hover:text-white/80">
          <SortIcon size={18} />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-transparent text-white font-semibold text-sm outline-none cursor-pointer border-none"
            aria-label="Sort comments"
          >
            <option value="newest" className="bg-[#212121] text-white">Newest first</option>
            <option value="top" className="bg-[#212121] text-white">Top comments</option>
          </select>
        </div>
      </div>

      {/* Add Comment Input Form */}
      <div className="flex gap-4 items-start mb-8">
        <img
          src={userAvatar}
          alt={userName}
          className="w-10 h-10 rounded-full object-cover shrink-0 ring-1 ring-white/10"
        />

        <form onSubmit={handleAddComment} className="flex-1 min-w-0">
          <div className="relative">
            <textarea
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              onFocus={() => setIsInputFocused(true)}
              placeholder="Add a comment..."
              rows={isInputFocused ? 2 : 1}
              className="w-full bg-transparent text-white placeholder-[#888] text-sm resize-none outline-none border-b border-white/20 focus:border-white transition-colors py-1.5 leading-relaxed"
            />
          </div>

          {(isInputFocused || newCommentText.trim().length > 0) && (
            <div className="flex items-center justify-end gap-3 mt-2.5">
              <button
                type="button"
                onClick={() => {
                  setNewCommentText('');
                  setIsInputFocused(false);
                }}
                className="px-4 py-2 rounded-full text-sm font-medium text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newCommentText.trim()}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  newCommentText.trim()
                    ? 'bg-[#3ea6ff] hover:bg-[#65b8ff] text-black cursor-pointer shadow'
                    : 'bg-white/10 text-white/40 cursor-not-allowed'
                }`}
              >
                Comment
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Comments List */}
      <div className="flex flex-col gap-6">
        {sortedComments.length === 0 ? (
          <div className="text-center py-8 text-neutral-400 text-sm">
            No comments yet. Be the first to start the conversation!
          </div>
        ) : (
          sortedComments.map((comment) => {
            const isEditing = editingCommentId === comment.commentId;
            const userReaction = commentLikes[comment.commentId];

            const baseLikes = Number(comment.likes) || 0;
            const displayedLikes = baseLikes + (userReaction === 'like' ? 1 : 0);

            return (
              <div key={comment.commentId} className="flex gap-4 items-start group/comment relative">
                {/* Author Avatar */}
                <img
                  src={
                    comment.avatarUrl ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                      comment.author || 'User'
                    )}`
                  }
                  alt={comment.author || 'User'}
                  className="w-10 h-10 rounded-full object-cover shrink-0 mt-0.5"
                  onError={(e) => {
                    e.currentTarget.src =
                      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80';
                  }}
                />

                {/* Comment Body */}
                <div className="flex-1 min-w-0">
                  {/* Author Header */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white text-xs font-semibold hover:underline cursor-pointer">
                      @{comment.author || 'User'}
                    </span>
                    <span className="text-[#aaa] text-xs">
                      {formatTimeAgo(comment.timestamp)}
                    </span>
                    {comment.isEdited && (
                      <span className="text-[#888] text-[11px] italic">(edited)</span>
                    )}
                  </div>

                  {/* Comment Text or Inline Edit Form */}
                  {isEditing ? (
                    <div className="mt-2 flex flex-col gap-2">
                      <textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="w-full bg-[#1e1e1e] border border-white/30 rounded-lg p-2.5 text-white text-sm focus:border-[#3ea6ff] outline-none resize-none leading-relaxed"
                        rows={2}
                        autoFocus
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="px-3 py-1.5 rounded-full text-xs font-medium text-white hover:bg-white/10 transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(comment.commentId)}
                          disabled={!editingText.trim()}
                          className="px-4 py-1.5 rounded-full text-xs font-semibold bg-[#3ea6ff] hover:bg-[#65b8ff] text-black transition-colors cursor-pointer disabled:opacity-50"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-white text-sm whitespace-pre-wrap leading-relaxed select-text">
                      {comment.text}
                    </p>
                  )}

                  {/* Comment Actions (Like / Dislike / Reply) */}
                  {!isEditing && (
                    <div className="flex items-center gap-4 mt-2">
                      <button
                        onClick={() => handleToggleCommentLike(comment.commentId)}
                        className={`flex items-center gap-1.5 text-xs transition-colors cursor-pointer ${
                          userReaction === 'like' ? 'text-[#3ea6ff]' : 'text-neutral-400 hover:text-white'
                        }`}
                        title="Like"
                        aria-label="Like comment"
                      >
                        <ThumbUpIcon size={14} active={userReaction === 'like'} />
                        {displayedLikes > 0 && <span>{displayedLikes}</span>}
                      </button>

                      <button
                        onClick={() => handleToggleCommentDislike(comment.commentId)}
                        className={`flex items-center text-xs transition-colors cursor-pointer ${
                          userReaction === 'dislike' ? 'text-[#3ea6ff]' : 'text-neutral-400 hover:text-white'
                        }`}
                        title="Dislike"
                        aria-label="Dislike comment"
                      >
                        <ThumbDownIcon size={14} active={userReaction === 'dislike'} />
                      </button>

                      {/* Quick inline edit/delete shortcuts for creator/author */}
                      <div className="flex items-center gap-1 ml-2 opacity-0 group-hover/comment:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleStartEdit(comment)}
                          className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white px-2 py-1 rounded hover:bg-white/10 cursor-pointer transition-colors"
                          title="Edit comment"
                        >
                          <EditIcon size={13} />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => handleDeleteComment(comment.commentId)}
                          className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-500/10 cursor-pointer transition-colors"
                          title="Delete comment"
                        >
                          <TrashIcon size={13} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* More 3-dots Menu for Edit / Delete */}
                {!isEditing && (
                  <div className="relative">
                    <button
                      onClick={() =>
                        setActiveMenuCommentId((prev) =>
                          prev === comment.commentId ? null : comment.commentId
                        )
                      }
                      className="opacity-0 group-hover/comment:opacity-100 p-1.5 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white cursor-pointer transition-all"
                      aria-label="Comment options"
                    >
                      <MoreVerticalIcon size={16} />
                    </button>

                    {activeMenuCommentId === comment.commentId && (
                      <div className="absolute right-0 top-8 z-20 w-36 bg-[#282828] border border-white/10 rounded-xl shadow-2xl py-1.5 flex flex-col">
                        <button
                          onClick={() => handleStartEdit(comment)}
                          className="flex items-center gap-2.5 px-3 py-2 text-left text-xs text-white hover:bg-white/10 cursor-pointer"
                        >
                          <EditIcon size={14} />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteComment(comment.commentId)}
                          className="flex items-center gap-2.5 px-3 py-2 text-left text-xs text-red-400 hover:bg-white/10 cursor-pointer"
                        >
                          <TrashIcon size={14} />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
