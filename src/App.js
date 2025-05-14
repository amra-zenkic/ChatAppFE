import React, { useState, useEffect, useRef, use } from "react";
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
  const [activeChat, setActiveChat] = useState("group"); // group or id of user in private chat
  const [showSidebar, setShowSidebar] = useState(false);
  const [username, setUsername] = useState("");
  const [messages, setMessages] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);

  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  const activeChatRef = useRef(activeChat);


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
    const userName = getCookie("userId");
    if(userName){
      setUsername(userName);
      //addSinglarConnection(userName);
    }
    else {
      fetch("https://localhost:44368/users/create", {
        method: "POST",
      })
        .then((res) => res.json())
        .then((data) => {
          console.log("new user", data);
          setCookieFunction("userId", data.id, 3);
          setCookieFunction("username", data.username, 3);
          setUsername(data.username);
          //addSinglarConnection(data.username);
          
        });
    }
}, []);
useEffect(() => {
  if (!username) return;

  const connection = new HubConnectionBuilder()
    .withUrl(`https://localhost:44368/Chat?userId=${username}`)
    .configureLogging(LogLevel.Information)
    .build();

  connection.on("ReceiveMessage", (username, message, userName, sentAt) => {
        setActiveUsers((prev) => [...prev, userName]);
        setMessages((prev) => [...prev, { username, message, sentAt }]);
      });
      /*
 connection.on("ReceiveSpecificMessage", (username, message, sentAt, chatRoom) => {
        console.log("Dodajem grupnu poruku");
        console.log("Ali je chatroom", chatRoom, "i activeChat", activeChat);
        if(chatRoom === activeChat) { // chatroom == "group"
          setMessages((prev) => [...prev, { username, message, sentAt }]);
        }
      });

      connection.on("ReceivePrivateMessage", (username, message, sentAt, chatRoom) => {
        console.log("Received private message (iz ReceivePrivateMessage):", message, "from", username);
        console.log("activeChat", activeChat);
        console.log("chatRoom", chatRoom);
        if(activeChat === chatRoom){
          setMessages((prev) => [...prev, { username, message, sentAt }]);
        }
      });
      */
     connection.on("ReceiveSpecificMessage", (username, message, sentAt, chatRoom) => {
  console.log("Dodajem grupnu poruku");
  console.log("Ali je chatroom", chatRoom, "i activeChat", activeChatRef.current);
  if(chatRoom === activeChatRef.current) {
    setMessages((prev) => [...prev, { username, message, sentAt }]);
  }
});

connection.on("ReceivePrivateMessage", (username, message, sentAt, chatRoom) => {
  console.log("Received private message:", message, "from", username);
  console.log("activeChat", activeChatRef.current);
  console.log("chatRoom", chatRoom);
  if(chatRoom === activeChatRef.current){
    setMessages((prev) => [...prev, { username, message, sentAt }]);
  }
});


  connection.start()
    .then(() => {
      setConnection(connection);
      loadMessages("group");
      return connection.invoke("JoinSpecificChatRoom");
    })
    .catch(err => console.error("SignalR connection error:", err));

  return () => {
    connection.stop();
  };
}, [username]);





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
