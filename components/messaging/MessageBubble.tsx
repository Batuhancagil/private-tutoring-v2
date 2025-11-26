'use client';

import { format } from 'date-fns';
import { UserRole } from '@prisma/client';

interface MessageBubbleProps {
  message: {
    id: string;
    content: string;
    createdAt: string;
    sender: {
      id: string;
      username: string;
      role: UserRole;
    };
  };
  isOwnMessage: boolean;
}

export function MessageBubble({ message, isOwnMessage }: MessageBubbleProps) {
  return (
    <div
      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div
        className={`max-w-[70%] rounded-lg px-4 py-2 ${
          isOwnMessage
            ? 'bg-blue-500 text-white'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
        }`}
      >
        {!isOwnMessage && (
          <div className="text-xs font-semibold mb-1 opacity-75">
            {message.sender.username} ({message.sender.role})
          </div>
        )}
        <div className="text-sm whitespace-pre-wrap">{message.content}</div>
        <div className={`text-xs mt-1 ${isOwnMessage ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
          {format(new Date(message.createdAt), 'MMM dd, yyyy HH:mm')}
        </div>
      </div>
    </div>
  );
}

