'use client';

import { useState, useEffect } from 'react';
import { ConversationList } from './ConversationList';
import { MessageThread } from './MessageThread';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';

interface Message {
  id: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    username: string;
    role: string;
  };
  receiver: {
    id: string;
    username: string;
    role: string;
  };
}

interface Conversation {
  id: string;
  username: string;
  role: string;
  lastMessage?: {
    content: string;
    createdAt: string;
  };
}

export function MessagesPageClient() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedReceiverId, setSelectedReceiverId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showNewMessageForm, setShowNewMessageForm] = useState(false);
  const [newMessageReceiverId, setNewMessageReceiverId] = useState('');
  const [newMessageContent, setNewMessageContent] = useState('');

  // Fetch current user
  useEffect(() => {
    async function fetchCurrentUser() {
      try {
        const response = await fetch('/api/auth/me');
        const result = await response.json();
        if (response.ok) {
          setCurrentUserId(result.data.id);
        }
      } catch (err) {
        console.error('Failed to fetch current user:', err);
      }
    }
    fetchCurrentUser();
  }, []);

  // Fetch conversations
  useEffect(() => {
    async function fetchConversations() {
      try {
        setLoading(true);
        const response = await fetch('/api/messages');
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch conversations');
        }

        // Group messages by receiver/sender to create conversations
        const messageMap = new Map<string, Conversation>();
        
        result.data.forEach((message: Message) => {
          const otherUserId = message.sender.id === currentUserId 
            ? message.receiver.id 
            : message.sender.id;
          const otherUser = message.sender.id === currentUserId 
            ? message.receiver 
            : message.sender;

          if (!messageMap.has(otherUserId)) {
            messageMap.set(otherUserId, {
              id: otherUserId,
              username: otherUser.username,
              role: otherUser.role,
            });
          }

          const conversation = messageMap.get(otherUserId)!;
          if (!conversation.lastMessage || 
              new Date(message.createdAt) > new Date(conversation.lastMessage.createdAt)) {
            conversation.lastMessage = {
              content: message.content,
              createdAt: message.createdAt,
            };
          }
        });

        setConversations(Array.from(messageMap.values()));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load conversations');
      } finally {
        setLoading(false);
      }
    }

    if (currentUserId) {
      fetchConversations();
    }
  }, [currentUserId]);

  // Fetch messages for selected conversation
  useEffect(() => {
    async function fetchMessages() {
      if (!selectedReceiverId || !currentUserId) return;

      try {
        setLoading(true);
        const response = await fetch(`/api/messages?receiverId=${selectedReceiverId}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch messages');
        }

        setMessages(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load messages');
      } finally {
        setLoading(false);
      }
    }

    fetchMessages();
  }, [selectedReceiverId, currentUserId]);

  const handleSendMessage = async (receiverId: string, content: string) => {
    if (!currentUserId) return;

    try {
      setSending(true);
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiverId,
          content,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send message');
      }

      // Add message to local state
      setMessages((prev) => [...prev, result.data]);

      // Update conversations
      setConversations((prev) => {
        const updated = [...prev];
        const conversation = updated.find((c) => c.id === receiverId);
        if (conversation) {
          conversation.lastMessage = {
            content,
            createdAt: result.data.createdAt,
          };
        } else {
          // New conversation - would need to fetch receiver info
          updated.push({
            id: receiverId,
            username: result.data.receiver.username,
            role: result.data.receiver.role,
            lastMessage: {
              content,
              createdAt: result.data.createdAt,
            },
          });
        }
        return updated;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      throw err;
    } finally {
      setSending(false);
    }
  };

  const handleNewMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageReceiverId || !newMessageContent.trim()) return;

    try {
      await handleSendMessage(newMessageReceiverId, newMessageContent);
      setShowNewMessageForm(false);
      setNewMessageReceiverId('');
      setNewMessageContent('');
      setSelectedReceiverId(newMessageReceiverId);
    } catch (err) {
      // Error already handled in handleSendMessage
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent>
          <div className="text-center py-8 text-red-500">Error: {error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-200px)] border rounded-lg overflow-hidden">
      <div className="flex flex-col w-full md:w-80">
        <div className="p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Conversations
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNewMessageForm(!showNewMessageForm)}
            >
              New
            </Button>
          </div>
          {showNewMessageForm && (
            <form onSubmit={handleNewMessage} className="space-y-2">
              <Input
                placeholder="Receiver ID"
                value={newMessageReceiverId}
                onChange={(e) => setNewMessageReceiverId(e.target.value)}
                required
              />
              <textarea
                placeholder="Message..."
                value={newMessageContent}
                onChange={(e) => setNewMessageContent(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                required
              />
              <div className="flex gap-2">
                <Button type="submit" size="sm">Send</Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowNewMessageForm(false);
                    setNewMessageReceiverId('');
                    setNewMessageContent('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
        <ConversationList
          conversations={conversations}
          selectedReceiverId={selectedReceiverId}
          onSelectConversation={setSelectedReceiverId}
          loading={loading && !selectedReceiverId}
        />
      </div>
      <MessageThread
        messages={messages}
        receiverId={selectedReceiverId}
        currentUserId={currentUserId || ''}
        onSendMessage={handleSendMessage}
        loading={loading && !!selectedReceiverId}
      />
    </div>
  );
}

