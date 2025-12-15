'use client';

import { useEffect, useRef } from 'react';
import { UserRole } from '@prisma/client';
import { MessageBubble } from './MessageBubble';
import { MessageComposer } from './MessageComposer';

interface Message {
  id: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    username: string;
    role: UserRole;
  };
  receiver: {
    id: string;
    username: string;
    role: UserRole;
  };
}

interface MessageThreadProps {
  messages: Message[];
  receiverId: string | null;
  currentUserId: string;
  onSendMessage: (receiverId: string, content: string) => Promise<void>;
  loading?: boolean;
  receiverName?: string;
  receiverRole?: string;
}

export function MessageThread({
  messages,
  receiverId,
  currentUserId,
  onSendMessage,
  loading,
  receiverName,
  receiverRole,
}: MessageThreadProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!receiverId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-500 dark:text-gray-400">
          Select a conversation to start messaging
        </p>
      </div>
    );
  }

  const handleSend = async (content: string) => {
    await onSendMessage(receiverId, content);
  };

  // Get receiver info from first message if not provided
  const displayName = receiverName || (messages.length > 0 
    ? (messages[0].sender.id === currentUserId ? messages[0].receiver.username : messages[0].sender.username)
    : '');
  const displayRole = receiverRole || (messages.length > 0
    ? (messages[0].sender.id === currentUserId ? messages[0].receiver.role : messages[0].sender.role)
    : '');

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
      {receiverId && (
        <div className="p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {displayName || 'Conversation'}
          </h3>
          {displayRole && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {displayRole === 'TEACHER' ? 'Teacher' : displayRole === 'STUDENT' ? 'Student' : displayRole}
            </p>
          )}
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-4">
        {loading && messages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400">
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400">
            No messages yet. Start the conversation!
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwnMessage={message.sender.id === currentUserId}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      <MessageComposer receiverId={receiverId} onSend={handleSend} disabled={loading} />
    </div>
  );
}

