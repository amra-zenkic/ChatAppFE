import React, { useState, useEffect, useRef, use } from "react";
import Sidebar from "./components/Sidebar";
import ChatArea from "./components/ChatArea";
import "./App.css";
import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
  const [activeChatUsername, setActiveChatUsername] = useState("Group");
  const [showSidebar, setShowSidebar] = useState(false);
  const [username, setUsername] = useState("");
  const [messages, setMessages] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [startedConversations, setStartedConversations] = useState([]);

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
    /*
    const userName = getCookie("userId");
    if(userName){
      setUsername(userName);
      //addSinglarConnection(userName);
    }
    else {*/
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
    //}
}, []);
useEffect(() => {
  if (!username) return;

  const connection = new HubConnectionBuilder()
    .withUrl(`https://localhost:44368/Chat?userId=${username}`)
    .configureLogging(LogLevel.Information)
    .build();

  connection.on("ReceiveMessage", (username, message, user, sentAt) => {
    console.log("NOVI KORISNIK", user.username);
    setActiveUsers((prev) => [...prev, user]);
    //setMessages((prev) => [...prev, { username, message, sentAt }]);
    toast.info(`${user.username} joined the chat`, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });

  });

  connection.on("ReceiveSpecificMessage", (username, message, sentAt, chatRoom) => {
    console.log("Dodajem grupnu poruku");
    console.log("Ali je chatroom", chatRoom, "i activeChat", activeChatRef.current);
    if(chatRoom === activeChatRef.current) {
      setMessages((prev) => [...prev, { username, message, sentAt }]);
    }
  });
/*
connection.on("ReceivePrivateMessage", (username, message, sentAt, chatRoom) => {
  console.log("Received private message:", message, "from", username);
  console.log("activeChat", activeChatRef.current);
  console.log("chatRoom", chatRoom);
  // adding to startedConversations if it's the first message or if it's a new message marking it
  
  if(chatRoom === activeChatRef.current || username === getCookie("username")){
    setMessages((prev) => [...prev, { username, message, sentAt }]);
  }
});
*/
connection.on("ReceivePrivateMessage", (sender, receiver, message, sentAt, chatRoom) => {
  // senderUsername -sender, chatRoom - receiver/sender
  console.log("Received private message:", message, "from", sender.username);
  console.log("activeChat", activeChatRef.current);
  console.log("chatRoom", chatRoom);


  // if its active chat add message
  if (chatRoom === activeChatRef.current || sender.username === getCookie("username")) {
    setMessages((prev) => [...prev, { username: sender.username, message, sentAt }]);
  }
  const usernameToCheck = getCookie("username") == sender.username ? receiver.username : sender.username;
  const idToCheck = getCookie("username") == sender.username ? receiver.id : sender.id;
  // update startedConversations
  setStartedConversations((prev) => {
    const exists = prev.find(c => c.username === usernameToCheck);

    if (!exists) {
      // Dodaj novog korisnika
      return [...prev, { username: usernameToCheck, userId: idToCheck, newMessages: chatRoom !== activeChatRef.current }];
    } else {
      // Ažuriraj newMessages ako nije aktivni chat
      return prev.map(c =>
        c.username === usernameToCheck
          ? { ...c, newMessages: chatRoom !== activeChatRef.current ? true : false }
          : c
      );
    }
  });  
});

connection.on("UserLeft", (userId, username) => {
  console.log("User left:", userId);
  toast.info(`${username} left the chat`, {
    position: "top-right",
    autoClose: 2000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  });
  setStartedConversations((prev) => prev.filter(c => c.userId !== userId));
  setActiveUsers((prev) => prev.filter(u => u.id !== userId));
});



  connection.start()
    .then(() => {
      setConnection(connection);
      loadMessages("group");
      return connection.invoke("JoinSpecificChatRoom");
    })
    .catch(err => console.error("SignalR connection error:", err));

  const handleBeforeUnload = () => {
    const userId = getCookie("userId");
    connection.invoke("UserLeft", userId);
    //navigator.sendBeacon(`https://localhost:44368/users/updateStatus/${userId}`)
    //conn.stop()
    
  };

  window.addEventListener("beforeunload", handleBeforeUnload);

  return () => {
    window.removeEventListener("beforeunload", handleBeforeUnload);
    connection.stop();
  };

}, [username]);





  const loadMessages = (chatName) => {
    if(chatName === "group"){
      setActiveChatUsername("Group");
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
        setActiveChatUsername={setActiveChatUsername}
        startedConversations={startedConversations}
        setStartedConversations={setStartedConversations}
        show={showSidebar}
        closeSidebar={() => setShowSidebar(false)}
        activeUsers={activeUsers}
        setActiveUsers={setActiveUsers}
        getCookie={getCookie}
        loadMessages={loadMessages}
      />
      <ChatArea
        activeChat={activeChat}
        activeChatUsername={activeChatUsername}
        currentUser={username}
        messages={messages}
        setMessages={setMessages}
        conn={conn}
        getCookie={getCookie}
      />
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default App;
