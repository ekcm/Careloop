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
import { useEffect, useState, useMemo } from 'react';
import { useT, useTranslations } from '@/hooks/useTranslation';
import { translationService } from '@/lib/translationService';
import {
  useLanguageDetection,
  useLanguageDetections,
} from '@/hooks/useLanguageDetection';
import { taskIconMap } from '@/lib/typing';
import { format } from 'date-fns';
import {
  Comment,
  NewCommentPayload,
  addComment,
  getTodoComments,
} from '@/apis/supabaseApi';
import LanguageIndicator from './LanguageIndicator';
import { useLanguageStore } from '@/lib/stores/languageStore';

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
  const [showLabelTranslated, setShowLabelTranslated] = useState(false);
  const [showNotesTranslated, setShowNotesTranslated] = useState(false);
  const [showCommentTranslated, setShowCommentTranslated] = useState<
    Record<number, boolean>
  >({});

  // Get current language from store
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);

  // Language detection for task content
  const labelLanguageDetection = useLanguageDetection(label);
  const notesLanguageDetection = useLanguageDetection(notes || '');

  const deleteConfirmText = useT('Are you sure you want to delete this task?');
  const deleteText = useT('Delete');
  const cancelText = useT('Cancel');
  const deleteTaskAriaLabel = useT('Delete task');
  const hideNotesLabel = useT('Hide Notes');
  const viewNotesLabel = useT('View Notes');

  // Get translations for display
  const [labelTranslation, setLabelTranslation] = useState<{
    id: string;
    originalText: string;
    translatedText?: string;
    isTranslating?: boolean;
    languageCode?: string;
  } | null>(null);
  const [notesTranslation, setNotesTranslation] = useState<{
    id: string;
    originalText: string;
    translatedText?: string;
    isTranslating?: boolean;
    languageCode?: string;
  } | null>(null);

  // Register and fetch label translation
  useEffect(() => {
    const labelId = translationService.registerText(label);

    // Get translation for current language
    const translation = translationService.getTranslation(
      labelId,
      currentLanguage.code
    );
    setLabelTranslation(translation || null);

    // Queue for translation if needed
    if (
      labelLanguageDetection.detectedLanguage &&
      labelLanguageDetection.detectedLanguage !== currentLanguage.code
    ) {
      translationService.queueForTranslation(labelId, currentLanguage.code);
    }
  }, [label, labelLanguageDetection.detectedLanguage, currentLanguage.code]);

  // Register and fetch notes translation
  useEffect(() => {
    if (notes) {
      const notesId = translationService.registerText(notes);

      // Get translation for current language
      const translation = translationService.getTranslation(
        notesId,
        currentLanguage.code
      );
      setNotesTranslation(translation || null);

      // Queue for translation if needed
      if (
        notesLanguageDetection.detectedLanguage &&
        notesLanguageDetection.detectedLanguage !== currentLanguage.code
      ) {
        translationService.queueForTranslation(notesId, currentLanguage.code);
      }
    } else {
      setNotesTranslation(null);
    }
  }, [notes, notesLanguageDetection.detectedLanguage, currentLanguage.code]);

  // Refresh translations when toggle state changes
  useEffect(() => {
    if (showLabelTranslated && label) {
      const labelId = translationService.registerText(label);
      const translation = translationService.getTranslation(
        labelId,
        currentLanguage.code
      );
      setLabelTranslation(translation || null);

      if (
        !translation?.translatedText ||
        translation.translatedText === label
      ) {
        translationService.queueForTranslation(labelId, currentLanguage.code);
      }
    }
  }, [showLabelTranslated, label, currentLanguage.code]);

  useEffect(() => {
    if (showNotesTranslated && notes) {
      const notesId = translationService.registerText(notes);
      const translation = translationService.getTranslation(
        notesId,
        currentLanguage.code
      );
      setNotesTranslation(translation || null);

      if (
        !translation?.translatedText ||
        translation.translatedText === notes
      ) {
        translationService.queueForTranslation(notesId, currentLanguage.code);
      }
    }
  }, [showNotesTranslated, notes, currentLanguage.code]);

  const noCommentsText = useT('No comments yet');
  const addCommentPlaceholder = useT('Add a comment...');
  const sendButtonText = useT('Send');
  const byText = useT('By');

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirm(true);
  };

  const confirmDelete = () => {
    onDelete();
    setShowConfirm(false);
  };

  const [newComment, setNewComment] = useState('');

  // Memoize comment contents to avoid infinite loop in useTranslations
  const commentContents = useMemo(
    () => comments.map((comment) => comment.comment_content),
    [comments]
  );

  // Use our custom hook for translations
  const { translatedTexts: translatedCommentContents } = useMemo(() => {
    const results = commentContents.map((content) => {
      const id = translationService.registerText(content);
      const translation = translationService.getTranslation(
        id,
        currentLanguage.code
      );
      return {
        originalText: content,
        translatedText: translation?.translatedText || content,
        isTranslating: translation?.isTranslating || false,
        id,
      };
    });

    return {
      translatedTexts: results,
    };
  }, [commentContents, currentLanguage.code]);

  // Queue comment translations
  useEffect(() => {
    commentContents.forEach((content, idx) => {
      const id = translationService.registerText(content);
      translationService.queueForTranslation(id, currentLanguage.code);
    });
  }, [commentContents, currentLanguage.code]);

  // Language detection for comments
  const commentLanguageDetections = useLanguageDetections(commentContents);

  // --- useEffect to fetch comments ---
  useEffect(() => {
    const fetchComments = async () => {
      if (!showFeedback) return;

      const fetchedComments = await getTodoComments(todo_id.toString());
      setComments(fetchedComments);
    };

    fetchComments();
  }, [todo_id, showFeedback, needsRefetch]);

  // Refresh comment translations when toggle state changes
  useEffect(() => {
    Object.entries(showCommentTranslated).forEach(([idx, isShown]) => {
      if (isShown && commentContents[Number(idx)]) {
        const commentId = translationService.registerText(
          commentContents[Number(idx)]
        );
        translationService.queueForTranslation(commentId, currentLanguage.code);
      }
    });
  }, [showCommentTranslated, commentContents, currentLanguage.code]);

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

  // Determine if we should show translations based on language
  const shouldShowTranslations =
    currentLanguage.code !== 'en' &&
    labelLanguageDetection.detectedLanguage !== currentLanguage.code;

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
              <div className="flex items-center justify-between text-muted-foreground my-1">
                <span>
                  {byText}: {author_name}
                </span>
                <div className="flex flex-row gap-2">
                  <p className="flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" />
                    {format(date, 'dd MMM yyy')}
                  </p>
                  <p className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {time}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <p
                  className={cn(
                    'text-base font-ms break-words flex-1',
                    completed && 'line-through text-muted-foreground'
                  )}
                >
                  {(shouldShowTranslations || showLabelTranslated) &&
                  labelTranslation?.translatedText
                    ? labelTranslation.translatedText
                    : label}
                </p>
                <LanguageIndicator
                  language={labelLanguageDetection.languageObject}
                  detectedLanguage={labelLanguageDetection.detectedLanguage}
                  isDetecting={labelLanguageDetection.isDetecting}
                  size="sm"
                  originalText={label}
                  onTranslationToggle={setShowLabelTranslated}
                />
              </div>

              {hasNotes && (
                <div className="w-full border-t-1 pt-1 text-md">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground flex-1">
                      {(shouldShowTranslations || showNotesTranslated) &&
                      notesTranslation?.translatedText
                        ? notesTranslation.translatedText
                        : notes}
                    </span>
                    <LanguageIndicator
                      language={notesLanguageDetection.languageObject}
                      detectedLanguage={notesLanguageDetection.detectedLanguage}
                      isDetecting={notesLanguageDetection.isDetecting}
                      size="sm"
                      originalText={notes}
                      onTranslationToggle={setShowNotesTranslated}
                    />
                  </div>
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
                  comments.map((comment, idx) => (
                    <div key={comment.id} className="text-sm">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-800 dark:text-gray-100">
                          {comment.author_name || ''}:
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {format(new Date(comment.created_at), 'dd MMM, p')}
                        </span>
                      </div>
                      <div className="flex items-start gap-2 mt-1">
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap flex-1">
                          {(shouldShowTranslations ||
                            showCommentTranslated[idx]) &&
                          translatedCommentContents[idx]?.translatedText
                            ? translatedCommentContents[idx].translatedText
                            : comment.comment_content}
                        </p>
                        <LanguageIndicator
                          language={
                            commentLanguageDetections[idx]?.languageObject
                          }
                          detectedLanguage={
                            commentLanguageDetections[idx]?.detectedLanguage ||
                            'en'
                          }
                          isDetecting={
                            commentLanguageDetections[idx]?.isDetecting
                          }
                          size="sm"
                          className="mt-1"
                          originalText={comment.comment_content}
                          onTranslationToggle={(showTranslated) => {
                            setShowCommentTranslated((prev) => ({
                              ...prev,
                              [idx]: showTranslated,
                            }));
                          }}
                        />
                      </div>
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
