import React, { useState, useEffect } from 'react';
import { useConnect } from '@stacks/connect-react';
import { getMessages } from '../lib/stacksUtils';

function MessageList() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { userSession } = useConnect();

  useEffect(() => {
    fetchMessages();
  }, [userSession]);

  const fetchMessages = async () => {
    if (!userSession.isUserSignedIn()) return;

    setIsLoading(true);
    setError(null);

    try {
      const userAddress = userSession.loadUserData().profile.stxAddress.testnet;
      const fetchedMessages = await getMessages(userAddress);
      setMessages(fetchedMessages);
    } catch (err) {
      setError('Failed to fetch messages. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <p>Loading messages...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div>
      <h2>Your Messages</h2>
      {messages.length === 0 ? (
        <p>No messages yet.</p>
      ) : (
        <ul>
          {messages.map((message, index) => (
            <li key={index}>
              <p>{message.text}</p>
              <p>Unlock date: {new Date(message.unlockDate).toLocaleDateString()}</p>
            </li>
          ))}
        </ul>
      )}
      <button onClick={fetchMessages}>Refresh Messages</button>
    </div>
  );
}
const fetchMessages = async () => {
    if (!userSession.isUserSignedIn()) return;
  
    setIsLoading(true);
    setError(null);
  
    try {
      const userAddress = userSession.loadUserData().profile.stxAddress.testnet;
      const fetchedMessages = await getMessages(userAddress);
      setMessages(fetchedMessages);
    } catch (err) {
      setError('Failed to fetch messages. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
export default MessageList;