
import { useState } from "react";
import {
  MessageSquareText,
  Search,
  Send,
  Bot,
  User,
  RefreshCw,
} from "lucide-react";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

export default function Assistant() {
  const [query, setQuery] = useState("");
  const [question, setQuestion] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I'm the GreenGen AI Assistant. Ask me about carbon emissions, renewable energy, sustainability, or reduction strategies.",
    },
  ]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [error, setError] = useState("");

  async function searchKnowledge(e) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoadingSearch(true);
    setError("");
    setSearchResults(null);

    try {
      const params = new URLSearchParams({ query: query.trim() });
      const response = await fetch(
        `${API_BASE}/rag/search?${params.toString()}`
      );
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.detail || `Search failed (${response.status})`);
      }

      setSearchResults(data);
    } catch (err) {
      setError(err.message || "Could not search the knowledge base.");
    } finally {
      setLoadingSearch(false);
    }
  }

  async function sendMessage(e) {
    e.preventDefault();
    const text = question.trim();
    if (!text || loadingChat) return;

    const updatedMessages = [...messages, { role: "user", content: text }];
    setMessages(updatedMessages);
    setQuestion("");
    setLoadingChat(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.detail || `Chat failed (${response.status})`);
      }

      const answer =
        data.response ||
        data.answer ||
        data.message ||
        data.reply ||
        "The assistant returned a response without a recognized answer field.";

      setMessages((previous) => [
        ...previous,
        { role: "assistant", content: answer },
      ]);
    } catch (err) {
      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content:
            "I couldn't connect to the AI service. Please check that the backend and AI endpoint are running.",
        },
      ]);
      setError(err.message || "Could not connect to the AI assistant.");
    } finally {
      setLoadingChat(false);
    }
  }

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">GENERATIVE AI</div>
          <h1>RAG & AI Assistant</h1>
          <p>
            Search sustainability knowledge and ask questions about
            carbon reduction strategies.
          </p>
        </div>
        <div className="heading-icon">
          <MessageSquareText size={23} />
        </div>
      </div>

      {error && (
        <div className="notice notice-error">
          <strong>Service notice</strong>
          <p>{error}</p>
        </div>
      )}

      <div className="assistant-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2><Search size={19} /> Knowledge Search</h2>
              <p>Retrieve relevant sustainability information.</p>
            </div>
          </div>

          <form onSubmit={searchKnowledge} className="search-form">
            <label className="field">
              <span>Search query</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. renewable energy benefits"
              />
            </label>
            <button
              className="btn btn-primary"
              type="submit"
              disabled={loadingSearch || !query.trim()}
            >
              {loadingSearch ? (
                <><RefreshCw size={16} /> Searching...</>
              ) : (
                <><Search size={16} /> Search</>
              )}
            </button>
          </form>

          {searchResults && (
            <div className="search-results">
              <h3>Retrieved information</h3>
              <pre className="result-json">
                {JSON.stringify(searchResults, null, 2)}
              </pre>
            </div>
          )}

          {!searchResults && (
            <div className="empty-state compact-empty">
              <Search size={24} />
              <p>Search results will appear here.</p>
            </div>
          )}
        </section>

        <section className="panel chat-panel">
          <div className="panel-heading">
            <div>
              <h2><Bot size={19} /> GreenGen AI Chat</h2>
              <p>Ask a sustainability-related question.</p>
            </div>
            <span className="tag">AI Assistant</span>
          </div>

          <div className="chat-messages">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`chat-message ${
                  message.role === "user" ? "user-message" : "bot-message"
                }`}
              >
                <div className="chat-avatar">
                  {message.role === "user" ? (
                    <User size={17} />
                  ) : (
                    <Bot size={17} />
                  )}
                </div>
                <div className="chat-bubble">
                  <div className="chat-role">
                    {message.role === "user" ? "You" : "GreenGen AI"}
                  </div>
                  <p>{message.content}</p>
                </div>
              </div>
            ))}

            {loadingChat && (
              <div className="chat-loading">
                <RefreshCw size={15} /> Generating response...
              </div>
            )}
          </div>

          <form onSubmit={sendMessage} className="chat-form">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask about sustainability..."
              aria-label="Message to GreenGen AI"
            />
            <button
              className="btn btn-primary send-button"
              type="submit"
              disabled={loadingChat || !question.trim()}
              aria-label="Send message"
            >
              <Send size={17} />
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
