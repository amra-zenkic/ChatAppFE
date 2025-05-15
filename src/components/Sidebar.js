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
  activeChat,
}) => {
  
  useEffect(() => {
    fetch("https://localhost:44368/users/active")
      .then((res) => res.json())
      .then((data) => {
        const userId = getCookie("userId");
        console.log("active users",data)
        setActiveUsers(data.filter((user) => user.id !== userId));
      });
  }, [])

  return (
    <div className={`sidebar ${show ? "show" : ""}`}>
      <div className="close-btn" onClick={closeSidebar}>×</div>
      <div className="sidebar-section">
        <h2>Welcome {getCookie("username")}</h2>
        <h3>Inbox</h3>
        <div className="chat-item" onClick={() => { 

          setActiveChat("group"); 
          closeSidebar(); }}>Group Chat {newGroupMessage && <span> 💬</span>}</div>
        {startedConversations.map((conversation) => (
          <div key={conversation.userId} className="chat-item" onClick={() => {
            setActiveChat(conversation.userId); 
            setActiveChatUsername(conversation.username); 
            setStartedConversations((prev) => {
              return prev.map((c) => {
                if (c.userId === conversation.userId) {
                  return { ...c, newMessages: false };
                }
                return c;
              });
            });
            closeSidebar(); }}>
            <span className="green-dot"></span> {conversation.username}
            {conversation.newMessages && <span> 💬</span>}
          </div>
        ))}
      </div>

      <div className="sidebar-section">
        <h3>Active Users</h3>
        {activeUsers.map((user) => (
          <div key={user.id} className="chat-item" onClick={() => {
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