import React, { useEffect, useState } from "react";
import "../Sidebar.css";

const Sidebar = ({ setActiveChat, startedConversations,setStartedConversations,  setActiveChatUsername, show, closeSidebar, activeUsers, setActiveUsers, getCookie, loadMessages}) => {
  
  useEffect(() => {
    fetch("https://localhost:44368/users/active")
      .then((res) => res.json())
      .then((data) => {
        // set all active users except current user
        const userId = getCookie("userId");
        console.log("active users",data)
        setActiveUsers(data.filter((user) => user.id !== userId));
      });
  }, [])

  return (
    <div className={`sidebar ${show ? "show" : ""}`}>
      <div className="close-btn" onClick={closeSidebar}>×</div>
      <div className="sidebar-section">
        <h3>Inbox</h3>
        <div className="chat-item" onClick={() => { loadMessages("group"); setActiveChat("group"); closeSidebar(); }}>Group Chat</div>
        {startedConversations.map((conversation) => (
          <div key={conversation.userId} className="chat-item" onClick={() => {
            loadMessages(conversation.userId); 
            setActiveChat(conversation.userId); 
            setActiveChatUsername(conversation.username); 
            // set prev.newMessages to false
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
            {conversation.newMessages && <span className="red-dot"> 💬</span>}
          </div>
        ))}
      </div>

      <div className="sidebar-section">
        <h3>Active Users</h3>
        {activeUsers.map((user) => (
          <div key={user.id} className="chat-item" onClick={() => {
            loadMessages(user.id); 
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