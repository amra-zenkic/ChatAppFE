import React from "react";
import "../Sidebar.css";

const Sidebar = ({ setActiveChat, show, closeSidebar }) => {
  const activeUsers = ["Wealth", "Amirae", "Blessing", "Tez"];
  const privateChats = ["Wealth", "Amirae", "Blessing", "Tez"];

  return (
    <div className={`sidebar ${show ? "show" : ""}`}>
      <div className="close-btn" onClick={closeSidebar}>×</div>
      <div className="sidebar-section">
        <h3>Groups</h3>
        <div className="chat-item" onClick={() => { setActiveChat("group"); closeSidebar(); }}>Kingbas Internship Team</div>
        <div className="chat-item" onClick={() => { setActiveChat("group"); closeSidebar(); }}>Just fun</div>
      </div>

      <div className="sidebar-section">
        <h3>Person</h3>
        {privateChats.map((name) => (
          <div key={name} className="chat-item" onClick={() => { setActiveChat(name); closeSidebar(); }}>
            <span className="green-dot"></span> {name}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;