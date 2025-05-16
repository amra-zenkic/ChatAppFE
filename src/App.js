import React, { useState, useEffect, useRef, use } from "react";
import Sidebar from "./components/Sidebar";
import ChatArea from "./components/ChatArea";
import "./App.css";
import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import useGetMessages from "./useGetMessages";

function App() {
	const getCookie = (name) => {
		const value = `; ${document.cookie}`;
		const parts = value.split(`; ${name}=`);
		if (parts.length === 2) return parts.pop().split(";").shift();
		return null;
	};
	const setCookieFunction = (name, value, days) => {
		let expires = "";
		if (days) {
			const date = new Date();
			date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
			expires = "; expires=" + date.toUTCString();
		}
		document.cookie = name + "=" + value + expires + "; path=/";
	};

  const [conn, setConnection] = useState(null);
  const [activeChat, setActiveChat] = useState("group"); // current active chat: "group" or id of user in private chat
  const [activeChatUsername, setActiveChatUsername] = useState("Group");
  const [showSidebar, setShowSidebar] = useState(false);
  const [username, setUsername] = useState("");
  const [messages, setMessages] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [startedConversations, setStartedConversations] = useState([]);
  const [newGroupMessage, setNewGroupMessage] = useState(false);
  // infinite scroll states
  const [skip, setSkip] = useState(0);
  const [take, setTake] = useState(10);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(false);
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const activeChatRef = useRef(activeChat);
  useEffect(() => {
      fetch(`${API_URL}/users/create`, {
        method: "POST",
      })
        .then((res) => res.json())
        .then((data) => {
          setCookieFunction("userId", data.id, 3);
          setCookieFunction("username", data.username, 3);
          setUsername(data.username);
        });
}, []);

useEffect(() => {
  if (!username) return;

  const connection = new HubConnectionBuilder()
    .withUrl(`${API_URL}/Chat?userId=${username}`)
    .configureLogging(LogLevel.Information)
    .build();

  connection.on("ReceiveMessage", (username, message, user, sentAt, joined) => {
    // add new user to active users
    if(activeChatRef.current == "group") {
      setMessages((prev) => [...prev, { username, message, sentAt }]);
    }
    if(!joined) { // user left the chat
      setActiveUsers((prev) => prev.filter((u) => u.username !== user.username));
      setStartedConversations((prev) => prev.filter((u) => u.username !== user.username));
    }
    if(joined && user.username !== getCookie("username")) {
      setActiveUsers((prev) => [...prev, user]);
    }
    toast.info(`${message}`, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    
  });

  // message for group chat
  connection.on("ReceiveSpecificMessage", (username, message, sentAt, chatRoom) => {
    if(chatRoom === activeChatRef.current) {
      setMessages((prev) => [...prev, { username, message, sentAt }]);
      setNewGroupMessage(0);
    }
    else {
      setNewGroupMessage(prev => prev + 1);
    }
  });

connection.on("ReceivePrivateMessage", (sender, receiver, message, sentAt, chatRoom) => {
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
      // add new user
      return [...prev, {  username: usernameToCheck, 
                          userId: idToCheck, 
                          newMessages: chatRoom === activeChatRef.current ? 0 : 1 }];
    } else {
      // update new started conversations so user gets notification
      return prev.map(c =>
        c.username === usernameToCheck
          ? { ...c, newMessages: chatRoom !== activeChatRef.current ? c.newMessages+1 : 0 }
          : c
      );
    }
  });  
});

  connection.start()
    .then(() => {
      setConnection(connection);
      setActiveChat("group");
      return connection.invoke("JoinSpecificChatRoom");
    })
    .catch(err => console.error("SignalR connection error:", err));

}, [username]);

const {
  loading: messagesLoading,
  messages: fetchedMessages,
  hasMore: messagesHasMore
} = useGetMessages(activeChat, skip, take, getCookie("userId"));

const shouldResetRef = useRef(false);

useEffect(() => {
  shouldResetRef.current = true;
  activeChatRef.current = activeChat;
  setMessages([]);
  setSkip(0);
  setTake(10);
  setHasMore(true);
  if(activeChat == "group") {
    setNewGroupMessage(false);
  }
}, [activeChat]);
useEffect(() => {
  if (loading) return;

  if (shouldResetRef.current) { // new chat loaded
    setMessages(fetchedMessages);
    shouldResetRef.current = false;
    setShouldScrollToBottom(true);
  } else {
    setMessages((prev) => {
      const combined = [...fetchedMessages, ...prev];
      const seen = new Set();
      return combined.filter(msg => {
        const key = msg.sentAt + msg.username + msg.message;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    });
  }

  setHasMore(messagesHasMore);
}, [fetchedMessages, loading]);


useEffect(() => {
  if (shouldScrollToBottom) {
    const timeout = setTimeout(() => setShouldScrollToBottom(false), 100);
    return () => clearTimeout(timeout);
  }
}, [shouldScrollToBottom]);



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
        newGroupMessage={newGroupMessage}
        setMessages={setMessages}
      />

      <ChatArea
        activeChat={activeChat}
        activeChatUsername={activeChatUsername}        
        messages={messages}        
        conn={conn}
        getCookie={getCookie}
        setSkip={setSkip}
        loading={loading}
        take={take}
        hasMore={hasMore}
        skip={skip}
      />
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default App;