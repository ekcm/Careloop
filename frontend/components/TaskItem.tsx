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
import { useState } from 'react';
import { useT } from '@/hooks/useTranslation';
import { taskIconMap } from '@/lib/typing';
import { format } from 'date-fns';
import { Comment } from '@/apis/supabaseApi';

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
  comments: Comment[];
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
  comments,
}: TaskItemProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showFeedback, setshowFeedback] = useState(false);

  const deleteConfirmText = useT('Are you sure you want to delete this task?');
  const deleteText = useT('Delete');
  const cancelText = useT('Cancel');
  const deleteTaskAriaLabel = useT('Delete task');
  const hideNotesLabel = useT('Hide Notes');
  const viewNotesLabel = useT('View Notes');
  const translatedNotes = useT(notes || '');
  const noCommentsText = useT('No comments yet.');
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

  const [newComment, setNewComment] = useState(''); // State for the comment input

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim() === '') return;
    onAddComment(newComment);
    setNewComment('');
  };

  const hasNotes = notes && notes.trim() !== '';

  return (
    <>
      <div
        onClick={onToggle}
        className={cn(
          'flex justify-between items-center p-3 rounded-xl shadow-sm cursor-pointer relative',
          completed
            ? 'bg-blue-50 dark:bg-zinc-800'
            : 'bg-white dark:bg-zinc-900'
        )}
      >
        <div className="flex items-center gap-3 min-w-0 w-full">
          <div className=" flex flex-col gap-2 items-center">
            {taskIconMap[icon]}
            {completed ? (
              <CheckSquare className="w-6 h-6 text-green-500" />
            ) : (
              <Square className="w-6 h-6 text-gray-400" />
            )}
          </div>
          <div className="min-w-0 w-full">
            <p
              className={cn(
                'text-lg font-medium break-words',
                completed && 'line-through text-muted-foreground'
              )}
            >
              {useT(label)}
            </p>
            <div className="flex items-center gap-2 text-md text-muted-foreground my-1">
              <p className="flex items-center gap-1">
                <CalendarDays className="w-3 h-3" />
                {format(date, 'dd MMM yyy')}
              </p>
              <p className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {time}
              </p>
            </div>
            {hasNotes && (
              <div className="w-full border-t-1 pt-1 text-md">
                <span>note:</span>{' '}
                <span className="text-muted-foreground">{translatedNotes}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasNotes && (
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
            )}
            <button
              type="button"
              onClick={handleDeleteClick}
              className="p-1 rounded hover:bg-red-100 dark:hover:bg-zinc-700 transition-colors"
              aria-label={deleteTaskAriaLabel}
            >
              <Trash2 className="w-5 h-5 text-red-500" />
            </button>
          </div>
        </div>
      </div>

      {showFeedback && (
        <div className="mt-1 mb-3 mx-3 p-3 rounded-xl bg-gray-100 dark:bg-zinc-800 shadow">
          <div className="space-y-3">
            {comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className="text-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-800 dark:text-gray-100">
                      {comment.profile.display_name}
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
