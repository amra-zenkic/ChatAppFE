import React, { useEffect, useState } from "react";
import "../Sidebar.css";

const Sidebar = ({ 
  setActiveChat, 
  startedConversations,
  setStartedConversations,  
  setActiveChatUsername, 
  show, 
  closeSidebar, 
  activeUsers, 
  setActiveUsers, 
  getCookie, 
 newGroupMessage,
  setMessages
}) => {
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
  
  useEffect(() => {
    fetch(`${API_URL}/users/active`)
      .then((res) => res.json())
      .then((data) => {
        const userId = getCookie("userId");
        setActiveUsers(data.filter((user) => user.id !== userId));
      });
  }, [])

  return (
    <div className={`sidebar ${show ? "show" : ""}`}>
      <div className="close-btn" onClick={closeSidebar}>×</div>
      <div className="sidebar-section">
        <h2>Welcome {getCookie("username")}</h2>
        <h3>Inbox</h3>
        <div className="chat-item" onClick={() =>{
          setMessages([]); 
          setActiveChat("group"); 
          closeSidebar(); }}>Group Chat {newGroupMessage != 0 && <span className="new-message-indicator">{newGroupMessage}</span>}</div>
        {startedConversations.map((conversation) => (
          <div key={conversation.userId} className="chat-item" onClick={() => {
            setMessages([]);
            setActiveChat(conversation.userId);
            setActiveChatUsername(conversation.username); 
            setStartedConversations((prev) => {
              return prev.map((c) => {
                if (c.userId === conversation.userId) {
                  return { ...c, newMessages: 0 };
                }
                return c;
              });
            });
            closeSidebar(); }}>
            <span className="green-dot"></span> {conversation.username}
            {conversation.newMessages != 0 && (
              <span className="new-message-indicator">
                {conversation.newMessages}
              </span>
            )}
            
          </div>
        ))}
      </div>

      <div className="sidebar-section">
        <h3>Active Users</h3>
        {activeUsers.map((user) => (
          <div key={user.id} className="chat-item" onClick={() => {
            setMessages([]);
            setActiveChat(user.id); 
            setActiveChatUsername(user.username); 
            closeSidebar(); }}>
            <span className="green-dot"></span> {user.username}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;