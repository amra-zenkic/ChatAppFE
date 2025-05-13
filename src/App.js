import React, { useState, useEffect, useRef } from "react";
import Sidebar from "./components/Sidebar";
import ChatArea from "./components/ChatArea";
import "./App.css";
import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";

function App() {

  // Function to get a cookie by name
	const getCookie = (name) => {
		const value = `; ${document.cookie}`;
		const parts = value.split(`; ${name}=`);
		if (parts.length === 2) return parts.pop().split(";").shift();
		return null;
	};

  const [conn, setConnection] = useState(null);
  const [activeChat, setActiveChat] = useState("group");
  const [showSidebar, setShowSidebar] = useState(false);
  const [username, setUsername] = useState(getCookie("username") || generateRandomUsername());
  const [messages, setMessages] = useState([]);

  function generateRandomUsername() {

    const adjectives = ["Fast", "Smart", "Happy", "Crazy", "Silent", "Golden", "Secret"];
    const nouns = ["Lion", "Tiger", "Dragon", "Wolf", "Bear", "Falcon", "Lynx"];
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const timePart = Date.now().toString().slice(-4);
    const randomPart = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return `${adjective}${noun}${timePart}${randomPart}`;
  }
  // Function to set a cookie
	const setCookieFunction = (name, value, days) => {
		let expires = "";
		if (days) {
			const date = new Date();
			date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
			expires = "; expires=" + date.toUTCString();
		}
		document.cookie = name + "=" + value + expires + "; path=/";
	};

	

  useEffect(() => {
    const connection = new HubConnectionBuilder()
      .withUrl("https://localhost:32771/Chat")
      .configureLogging(LogLevel.Information)
      .build();
      

      connection.on("ReceiveMessage", (username, message, sentAt) => {
        setMessages((prev) => [...prev, { username, message, sentAt }]);
      });

      connection.on("ReceiveSpecificMessage", (username, message, sentAt) => {
        setMessages((prev) => [...prev, { username, message, sentAt }]);
      });

      connection.start().then(() => {
        setConnection(connection);
        console.log("SignalR Connected");
        let cookieName = getCookie("username")
        if(cookieName == null){
          setCookieFunction("username", username, 3); // Set cookie for 3 days
        }
        else {
          setUsername(cookieName);
        }
        connection.invoke("JoinSpecificChatRoom", { username, activeChat}).catch(function (err) {
            return console.error(err.toString());
        });
        
      }).catch(err => console.log("Error in connecting to SignalR ",err));
      return () => {
        connection.stop();
      };
  }, [])



  return (
    <div className="app-container">
      <div className="hamburger" onClick={() => setShowSidebar(!showSidebar)}>
        ☰
      </div>
      <Sidebar
        setActiveChat={setActiveChat}
        show={showSidebar}
        closeSidebar={() => setShowSidebar(false)}
      />
      <ChatArea
        activeChat={activeChat}
        currentUser={username}
        messages={messages}
        setMessages={setMessages}
        conn={conn}
      />
    </div>
  );
}

export default App;
