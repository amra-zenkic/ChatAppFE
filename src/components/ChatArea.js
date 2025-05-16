import { useState, useEffect, useRef } from "react";
import "../ChatArea.css";

const ChatArea = ({ 
  activeChat,
  activeChatUsername,  
  messages, 
  conn, 
  getCookie,
  setSkip,
  loading,
  take,
  hasMore,
  skip}) => {

  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const loader = useRef(null);

  const messagesContainerRef = useRef(null);

useEffect(() => {
  const container = messagesContainerRef.current;

  if (!container) return;
  if (skip <= 10) {
    // new chat loaded, scroll to bottom
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }
}, [messages]);

  const handleSend = async () => {
    if (input.trim() !== "") {
      if (conn) {
        try {
          if (activeChat === "group") {
            await conn.invoke("SendMessage",getCookie("userId"), input);
          } else {
            await conn.invoke("SendPrivateMessage", getCookie("userId"), activeChat, input);
          }
        } catch (error) {
          console.error("Failed to send message:", error);
        }
      }
      setInput("");
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setSkip(prev => prev + take);
      }
    });
    if (loader.current) observer.observe(loader.current);
    return () => {
      if (loader.current) observer.unobserve(loader.current);
    };
  }, [loading, hasMore]);


  return (
    <div className="chat-area">
      <div className="chat-header">
        {activeChat === "group" ? "Global Group Chat" : `Chat with ${activeChatUsername}`}
      </div>
      <div className="messages" ref={messagesContainerRef}>
        
        {hasMore == true ? 
        <div ref={loader} className="loading">Load next messages...</div> 
        : ""}
        {messages.map((msg, idx) => {
          if (msg.username === "admin") {
            return (
              <div
                key={idx}
                className="admin-message"
              >
                {msg.message}
              </div>
            );
          }
          return (
            <div
              key={idx}
              className={`message ${msg.username === getCookie("username") ? "sent" : "received"}`}>
                <p className="message-username">{msg.username}</p>
                {msg.message}
                <p className="message-timestamp">{new Date(msg.sentAt).toLocaleString()}</p>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      <div className="chat-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message here..."
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
};

export default ChatArea;