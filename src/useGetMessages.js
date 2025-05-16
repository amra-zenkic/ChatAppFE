import { useEffect, useState } from "react";
import axios from "axios";

export default function useGetMessages(chatName, skip, take, userId) {
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState([]);
    const [hasMore, setHasMore] = useState(false);
    const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
    useEffect(() => {
        setLoading(true);

        const url =
        chatName === "group"
            ? `${API_URL}/messages/group/`
            : `${API_URL}/messages/private/${chatName}/${userId}/`;

        axios({
            method: "get",
            url: url,
            params: {
                skip: skip,
                take: take
            }
        }).then(res => { 
            setMessages(res.data.messages);
            setHasMore(res.data.hasMore);
            setLoading(false);
        }).catch(err => {
            setLoading(false);
            console.log("Error in useGetMessages",err);
        });

    }, [chatName, skip])

    return {
        loading,
        messages,
        hasMore
    }
}