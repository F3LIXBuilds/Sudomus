import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, MessageSquare, Send, User, RefreshCw } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { messagesService } from '../services/api';
import Navbar from '../components/Navbar';
import './Messages.css';

export default function Messages() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedConversationId = searchParams.get('conversation');

  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(requestedConversationId || null);
  const [conversation, setConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [conversationLoading, setConversationLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');

  const selectedConversation = useMemo(
    () => conversations.find(item => item.id === selectedId) || null,
    [conversations, selectedId]
  );

  const loadConversations = async (preserveSelection = true) => {
    setLoading(true);
    setError('');

    try {
      const data = await messagesService.getConversations();
      setConversations(Array.isArray(data) ? data : []);

      if (!preserveSelection) {
        setSelectedId(data?.[0]?.id || null);
      } else if (selectedId && data.some(item => item.id === selectedId)) {
        // Keep current conversation.
      } else if (requestedConversationId && data.some(item => item.id === requestedConversationId)) {
        setSelectedId(requestedConversationId);
      } else if (data?.length) {
        setSelectedId(data[0].id);
      } else {
        setSelectedId(null);
      }
    } catch (err) {
      setError(err.message || 'Failed to load conversations.');
    } finally {
      setLoading(false);
    }
  };

  const loadConversation = async (id) => {
    if (!id) {
      setConversation(null);
      return;
    }

    setConversationLoading(true);
    setError('');

    try {
      const data = await messagesService.getConversation(id);
      setConversation(data);
    } catch (err) {
      setError(err.message || 'Failed to load conversation.');
      setConversation(null);
    } finally {
      setConversationLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }

    if (!authLoading && user) {
      loadConversations();
    }
  }, [authLoading, user]);

  useEffect(() => {
    if (selectedId) {
      loadConversation(selectedId);
      navigate(`/messages?conversation=${selectedId}`, { replace: true });
    } else {
      setConversation(null);
    }
  }, [selectedId]);

  const handleSend = async (event) => {
    event.preventDefault();

    const text = draft.trim();
    if (!text || !selectedId || sending) return;

    setSending(true);
    setError('');

    try {
      await messagesService.sendMessage(selectedId, text);
      setDraft('');
      await loadConversation(selectedId);
      await loadConversations();
    } catch (err) {
      setError(err.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  if (authLoading) return null;
  if (!user) return null;

  return (
    <div className="messages-page">
      <Navbar />

      <main className="messages-shell">
        <div className="messages-header">
          <div>
            <button className="messages-back" onClick={() => navigate(user.role === 'admin' ? '/admin-dashboard' : '/dashboard')}>
              <ArrowLeft size={17} />
              Back to Dashboard
            </button>
            <h1><MessageSquare size={28} /> Messages</h1>
            <p>
              {user.role === 'admin'
                ? 'Review and respond to platform conversations.'
                : 'View your property inquiries and conversations.'}
            </p>
          </div>

          <button className="messages-refresh" onClick={() => {
            loadConversations();
            if (selectedId) loadConversation(selectedId);
          }} title="Refresh">
            <RefreshCw size={18} />
          </button>
        </div>

        {error && <div className="messages-error">{error}</div>}

        <section className="messages-layout">
          <aside className="conversation-list">
            <div className="conversation-list-header">
              <strong>Conversations</strong>
              <span>{conversations.length}</span>
            </div>

            {loading ? (
              <div className="messages-empty">Loading conversations...</div>
            ) : conversations.length === 0 ? (
              <div className="messages-empty">
                <MessageSquare size={30} />
                <strong>No conversations yet</strong>
                <p>When a buyer sends an authenticated inquiry, a conversation will appear here.</p>
              </div>
            ) : (
              conversations.map(item => {
                const otherName = user.role === 'admin'
                  ? `${item.buyer_name || 'Buyer'} ↔ ${item.agent_name || 'Agent'}`
                  : user.id === item.buyer_id
                    ? item.agent_name || item.agent_email
                    : item.buyer_name || item.buyer_email;

                return (
                  <button
                    key={item.id}
                    className={`conversation-item ${selectedId === item.id ? 'active' : ''}`}
                    onClick={() => setSelectedId(item.id)}
                  >
                    <div className="conversation-avatar"><User size={17} /></div>
                    <div className="conversation-summary">
                      <strong>{otherName}</strong>
                      <span>{item.latest_message || 'No messages yet'}</span>
                      {item.latest_message_at && (
                        <small>{new Date(item.latest_message_at).toLocaleString()}</small>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </aside>

          <section className="conversation-panel">
            {!selectedId ? (
              <div className="conversation-placeholder">
                <MessageSquare size={44} />
                <h2>Select a conversation</h2>
                <p>Choose a conversation from the left to read and reply to messages.</p>
              </div>
            ) : conversationLoading ? (
              <div className="conversation-placeholder">Loading conversation...</div>
            ) : conversation ? (
              <>
                <header className="conversation-header">
                  <div>
                    <h2>
                      {user.role === 'admin'
                        ? `${conversation.buyer_name || 'Buyer'} ↔ ${conversation.agent_name || 'Agent'}`
                        : user.id === conversation.buyer_id
                          ? conversation.agent_name || conversation.agent_email
                          : conversation.buyer_name || conversation.buyer_email}
                    </h2>
                    <span>
                      {conversation.buyer_name || 'Buyer'} and {conversation.agent_name || 'Agent'}
                    </span>
                  </div>
                </header>

                <div className="conversation-messages">
                  {conversation.messages?.map(msg => (
                    <div
                      key={msg.id}
                      className={`chat-message ${msg.sender_id === user.id ? 'mine' : 'theirs'}`}
                    >
                      <div className="chat-message-meta">
                        <strong>{msg.sender_id === user.id ? 'You' : msg.sender_name || msg.sender_email}</strong>
                        <small>{new Date(msg.created_at).toLocaleString()}</small>
                      </div>
                      <div className="chat-bubble">{msg.message}</div>
                    </div>
                  ))}
                </div>

                <form className="conversation-composer" onSubmit={handleSend}>
                  <textarea
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    placeholder="Write a reply..."
                    maxLength={2000}
                    rows={3}
                    disabled={sending}
                  />
                  <button type="submit" disabled={!draft.trim() || sending}>
                    <Send size={17} />
                    {sending ? 'Sending...' : 'Send'}
                  </button>
                </form>
              </>
            ) : (
              <div className="conversation-placeholder">Unable to load this conversation.</div>
            )}
          </section>
        </section>
      </main>
    </div>
  );
}
