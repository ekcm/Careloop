import { FC } from 'react';

/**
 * A simple notification component to display messages.
 */
export const Notification: FC<{
  message: string;
  onClose: () => void;
  isError?: boolean;
}> = ({ message, onClose, isError }) => {
  if (!message) return null;

  return (
    <div
      className={`fixed top-5 right-5 p-4 rounded-md shadow-lg text-white ${isError ? 'bg-red-500' : 'bg-blue-500'}`}
    >
      <span>{message}</span>
      <button onClick={onClose} className="ml-4 font-bold">
        X
      </button>
    </div>
  );
};
