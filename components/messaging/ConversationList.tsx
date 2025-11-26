'use client';

import { format } from 'date-fns';

interface Conversation {
  id: string;
  username: string;
  role: string;
  lastMessage?: {
    content: string;
    createdAt: string;
  };
  unreadCount?: number;
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedReceiverId: string | null;
  onSelectConversation: (receiverId: string) => void;
  loading?: boolean;
}

export function ConversationList({
  conversations,
  selectedReceiverId,
  onSelectConversation,
  loading,
}: ConversationListProps) {
  if (loading) {
    return (
      <div className="w-full md:w-80 border-r dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
        <div className="text-center text-gray-500 dark:text-gray-400">
          Loading conversations...
        </div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="w-full md:w-80 border-r dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
        <div className="text-center text-gray-500 dark:text-gray-400">
          No conversations yet
        </div>
      </div>
    );
  }

  return (
    <div className="w-full md:w-80 border-r dark:border-gray-700 bg-white dark:bg-gray-800 overflow-y-auto">
      {conversations.map((conversation) => (
        <button
          key={conversation.id}
          onClick={() => onSelectConversation(conversation.id)}
          className={`w-full text-left p-4 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
            selectedReceiverId === conversation.id
              ? 'bg-blue-50 dark:bg-blue-900/20'
              : ''
          }`}
        >
          <div className="flex justify-between items-start mb-1">
            <div className="font-semibold text-gray-900 dark:text-white">
              {conversation.username}
            </div>
            {conversation.unreadCount && conversation.unreadCount > 0 && (
              <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1">
                {conversation.unreadCount}
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            {conversation.role}
          </div>
          {conversation.lastMessage && (
            <div className="text-sm text-gray-600 dark:text-gray-300 truncate">
              {conversation.lastMessage.content}
            </div>
          )}
          {conversation.lastMessage && (
            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {format(new Date(conversation.lastMessage.createdAt), 'MMM dd, HH:mm')}
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

