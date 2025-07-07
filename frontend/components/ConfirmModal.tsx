// components/ConfirmModal.tsx
'use client';

import { FC } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useT } from '@/hooks/useTranslation';

interface ConfirmModalProps {
  open: boolean;
  title?: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: FC<ConfirmModalProps> = ({
  open,
  title,
  message,
  onConfirm,
  onCancel,
}) => {
  const defaultTitle = useT('Are you sure?');
  const cancelText = useT('Cancel');
  const confirmText = useT('Confirm');

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title ?? defaultTitle}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-slate-600">{message}</p>
        <DialogFooter className="mt-4">
          <Button variant="ghost" onClick={onCancel}>
            {cancelText}
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
