'use client';

import { useState, FormEvent } from 'react';
import { Button } from '@/components/ui/Button';

interface MessageComposerProps {
  receiverId: string;
  onSend: (content: string) => Promise<void>;
  disabled?: boolean;
}

export function MessageComposer({ receiverId, onSend, disabled }: MessageComposerProps) {
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim() || sending || disabled) return;

    try {
      setSending(true);
      await onSend(content.trim());
      setContent('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 p-4 border-t dark:border-gray-700">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Type your message..."
        disabled={sending || disabled}
        rows={3}
        className="flex-1 px-3 py-2 border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
      />
      <Button type="submit" disabled={!content.trim() || sending || disabled}>
        {sending ? 'Sending...' : 'Send'}
      </Button>
    </form>
  );
}

