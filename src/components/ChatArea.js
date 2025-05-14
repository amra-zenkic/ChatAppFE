import React, { useState, useEffect, useRef } from "react";
import "../ChatArea.css";



const ChatArea = ({ activeChat, currentUser, messages, setMessages, conn, getCookie}) => {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    console.log("messages", messages);
  }, [messages]);

  const handleSend = async () => {
    if (input.trim() !== "") {
      if (conn) {
        try {
          //await conn.invoke("SendMessage", input);
          if (activeChat === "group") {
            console.log("Sending message:", input, "from ", getCookie("userId"));
            await conn.invoke("SendMessage",getCookie("userId"), input);
          } else {
            console.log("Sending private message:", input, "from ", getCookie("userId"), "to", activeChat);
            await conn.invoke("SendPrivateMessage", getCookie("userId"), activeChat, input);
          }
        } catch (error) {
          console.error("Failed to send message:", error);
        }
      }

      setInput("");
    }
  };

  return (
    <div className="chat-area">
      <div className="chat-header">
        {activeChat === "group" ? "Global Group Chat" : `Chat with ${activeChat}`}
      </div>
      <div className="messages">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`message ${msg.username === currentUser ? "sent" : "received"}`}
          >
            <p className="message-username">{msg.username}</p>
            
            {msg.message}
            <p className="message-timestamp">{new Date(msg.sentAt).toLocaleString()}</p>
          </div>
        ))}
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
