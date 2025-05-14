import React, { useEffect, useState } from "react";
import "../Sidebar.css";

const Sidebar = ({ setActiveChat, setActiveChatUsername, show, closeSidebar, activeUsers, setActiveUsers, getCookie, loadMessages}) => {
  
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
        <h3>Groups</h3>
        <div className="chat-item" onClick={() => { loadMessages("group"); setActiveChat("group"); closeSidebar(); }}>Group Chat</div>

      </div>

      <div className="sidebar-section">
        <h3>Person</h3>
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