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
  const [activeUsers, setActiveUsers] = useState([]);

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

  const fetchGroupMessages = () => {
    fetch("https://localhost:44368/messages/group")
      .then((res) => res.json())
      .then((data) => {
        setMessages(data);
      });
  };

	

  useEffect(() => {
    // TODO: korisnika ubaciti u bazu, u cookie spremiti id i username
    // pa tek onda ga konektovati na signalR
    const connection = new HubConnectionBuilder()
      .withUrl("https://localhost:44368/Chat?userId=" + username)
      .configureLogging(LogLevel.Information)
      .build();

      fetchGroupMessages();
      

      connection.on("ReceiveMessage", (username, message, userName, sentAt) => {
        setActiveUsers((prev) => [...prev, userName]);
        setMessages((prev) => [...prev, { username, message, sentAt }]);
      });

      connection.on("ReceiveSpecificMessage", (username, message, sentAt) => {
        setMessages((prev) => [...prev, { username, message, sentAt }]);
      });

      connection.on("ReceivePrivateMessage", (username, message, sentAt) => {
        console.log("Received private message:", message, "from", username);
        setMessages((prev) => [...prev, { username, message, sentAt }]); // ✅

      })

      connection.start().then(() => {
        setConnection(connection);
        console.log("SignalR Connected");
        let cookieName = getCookie("username")
        if(cookieName == null){
          // adding user to database
          fetch(`https://localhost:44368/users/create?username=${username}`, {
            method: "POST"
          })
            .then((res) => {
              if (!res.ok) throw new Error("User creation failed.");
              return res.json(); // ⬅️ Parsiraj JSON iz odgovora
            })
            .then((createdUser) => {
              console.log("User created:", createdUser);
              setUsername(createdUser.username)
              setCookieFunction("username", createdUser.username, 3); // Set cookie for 3 days
              setCookieFunction("userId", createdUser.id, 3);
              setUsername(createdUser.username)
              // možeš: setUser(createdUser); ili spremiti u state itd.
            })
            .catch((err) => console.error("Error creating user:", err));

        }
        else {
          setUsername(cookieName);
        }
        connection.invoke("JoinSpecificChatRoom").catch(function (err) {
            return console.error("Error in JoinSpecificChatRoom", err.toString());
        });
        
      }).catch(err => console.log("Error in connecting to SignalR ",err));
      return () => {
        connection.stop();
      };
  }, [])

  const loadMessages = (chatName) => {
    if(chatName === "group"){
      fetchGroupMessages();
    }
    else{
      fetch(`https://localhost:44368/messages/private/${chatName}/${getCookie("userId")}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("nove poruke",data);
        setMessages(data);
      });
    }
  }



  return (
    <div className="app-container">
      <div className="hamburger" onClick={() => setShowSidebar(!showSidebar)}>
        ☰
      </div>
      <Sidebar
        setActiveChat={setActiveChat}
        show={showSidebar}
        closeSidebar={() => setShowSidebar(false)}
        activeUsers={activeUsers}
        setActiveUsers={setActiveUsers}
        getCookie={getCookie}
        loadMessages={loadMessages}
      />
      <ChatArea
        activeChat={activeChat}
        currentUser={username}
        messages={messages}
        setMessages={setMessages}
        conn={conn}
        getCookie={getCookie}
      />
    </div>
  );
}

export default App;
