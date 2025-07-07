'use client';

import {
  Clock,
  CalendarDays,
  Trash2,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { useT } from '@/hooks/useTranslation';
import { taskIconMap } from '@/lib/typing';
import { format } from 'date-fns';
import {
  Comment,
  NewCommentPayload,
  addComment,
  getTodoComments,
} from '@/apis/supabaseApi';
import { get } from 'http';

type TaskItemProps = {
  id: number;
  label: string;
  completed: boolean;
  date: string;
  time: string;
  icon: string;
  notes?: string;
  onToggle: () => void;
  onDelete: () => void;
  todo_id: number;
  user_id: string;
  author_name: string;
};

export default function TaskItem({
  label,
  time,
  date,
  completed,
  icon,
  notes,
  onToggle,
  onDelete,
  todo_id,
  user_id,
  author_name,
}: TaskItemProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showFeedback, setshowFeedback] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [needsRefetch, setNeedsRefetch] = useState(false);

  const deleteConfirmText = useT('Are you sure you want to delete this task?');
  const deleteText = useT('Delete');
  const cancelText = useT('Cancel');
  const deleteTaskAriaLabel = useT('Delete task');
  const hideNotesLabel = useT('Hide Notes');
  const viewNotesLabel = useT('View Notes');
  const translatedNotes = useT(notes || '');
  const noCommentsText = useT('No comments yet');
  const addCommentPlaceholder = useT('Add a comment...');
  const sendButtonText = useT('Send');

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirm(true);
  };

  const confirmDelete = () => {
    onDelete();
    setShowConfirm(false);
  };

  const [newComment, setNewComment] = useState('');

  // --- useEffect to fetch comments ---
  useEffect(() => {
    const fetchComments = async () => {
      if (!showFeedback) return;

      const fetchedComments = await getTodoComments(todo_id.toString());
      setComments(fetchedComments);
    };

    fetchComments();
  }, [todo_id, showFeedback, needsRefetch]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim() === '') return;
    const newCommentPayload: NewCommentPayload = {
      comment_content: newComment,
      todo_id: todo_id,
      user_id: user_id,
      author_name: author_name,
    };
    await addComment(newCommentPayload);

    setNewComment('');
    setNeedsRefetch((prev) => !prev);
  };

  const hasNotes = notes && notes.trim() !== '';

  return (
    <>
      <div
        className={cn(
          'flex justify-between items-center p-3 rounded-xl shadow-sm cursor-pointer relative',
          completed
            ? 'bg-blue-50 dark:bg-zinc-800'
            : 'bg-white dark:bg-zinc-900'
        )}
      >
        <div className="flex flex-col items-center gap-3 min-w-0 w-full">
          <div className="w-full flex gap-4">
            <div
              className=" flex gap-2 items-center my-auto flex-row"
              onClick={onToggle}
            >
              {completed ? (
                <CheckSquare className="w-6 h-6 text-green-500" />
              ) : (
                <Square className="w-6 h-6 text-gray-400" />
              )}
              {taskIconMap[icon]}
            </div>
            <div className="min-w-0 w-full text-xs">
              <div className="flex items-center gap-2 text-muted-foreground my-1">
                <span className="text-muted-foreground">By: {author_name}</span>
                <p className="flex items-center gap-1">
                  <CalendarDays className="w-3 h-3" />
                  {format(date, 'dd MMM yyy')}
                </p>
                <p className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {time}
                </p>
              </div>

                <p
                className={cn(
                  'text-base font-ms break-words',
                  completed && 'line-through text-muted-foreground'
                )}
                >
                {useT(label)}
                </p>

              {hasNotes && (
                <div className="w-full border-t-1 pt-1 text-md">
                  <span className="text-muted-foreground">
                    {translatedNotes}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 space-between">
              <button
                type="button"
                onClick={handleDeleteClick}
                className="p-1 rounded hover:bg-red-100 dark:hover:bg-zinc-700 transition-colors"
                aria-label={deleteTaskAriaLabel}
              >
                <Trash2 className="w-5 h-5 text-red-500" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setshowFeedback(!showFeedback);
                }}
                className="p-1 rounded hover:bg-blue-100 dark:hover:bg-zinc-700 transition-colors"
                aria-label={showFeedback ? hideNotesLabel : viewNotesLabel}
              >
                {showFeedback ? (
                  <ChevronUp className="w-5 h-5 text-blue-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-blue-500" />
                )}
              </button>
            </div>
          </div>
          {showFeedback && (
            <div className="w-full border-t-1 p-2">
              <div className="space-y-3">
                {comments.length > 0 ? (
                  comments.map((comment) => (
                    <div key={comment.id} className="text-sm">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-800 dark:text-gray-100">
                          {comment.author_name || ''}
                          :
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {format(new Date(comment.created_at), 'dd MMM, p')}
                        </span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap mt-1">
                        {comment.comment_content}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-center text-gray-500 dark:text-gray-400 py-2">
                    {noCommentsText}
                  </p>
                )}
              </div>

              <hr className="my-3 border-gray-200 dark:border-zinc-700" />
              <form
                onSubmit={handleCommentSubmit}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={addCommentPlaceholder}
                  className="flex-grow bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-600 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  type="submit"
                  className="px-3 py-1 rounded-md bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  onClick={(e) => e.stopPropagation()}
                  disabled={newComment.trim() === ''}
                >
                  {sendButtonText}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-lg shadow-lg flex flex-col items-center gap-3">
            <p className="text-md">{deleteConfirmText}</p>
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  confirmDelete();
                }}
                className="px-3 py-1 rounded bg-red-500 text-white text-md hover:bg-red-600"
              >
                {deleteText}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowConfirm(false);
                }}
                className="px-3 py-1 rounded bg-gray-200 dark:bg-zinc-700 text-md"
              >
                {cancelText}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
