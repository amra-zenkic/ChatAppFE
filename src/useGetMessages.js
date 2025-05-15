import { useEffect, useState } from "react";
import axios from "axios";

export default function useGetMessages(chatName, skip, take, userId) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [messages, setMessages] = useState([]);
    const [hasMore, setHasMore] = useState(false);
    
    useEffect(() => {

    setLoading(true);
    setError(false);
    console.log('Fetching in:', chatName, 'Skip:', skip, 'Take:', take);
    const url = chatName == "group" ? "https://localhost:44368/messages/group/" : `https://localhost:44368/messages/private/${chatName}/${userId}/`
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
        setError(true);
        setLoading(false);
        console.log("Error in useGetMessages",err);
    });

    }, [chatName, skip])

    return {
        loading,
        error,
        messages,
        hasMore
    }
}