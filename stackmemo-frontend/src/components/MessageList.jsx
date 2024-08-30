import React, { useState, useEffect } from 'react';
import { useConnect } from '@stacks/connect-react';
import { getMessages, getCurrentBlockHeight, decryptMessage } from '../lib/stacksUtils';

function MessageList({ setIsLoading, setError }) {
  const [messages, setMessages] = useState([]);
  const [currentBlockHeight, setCurrentBlockHeight] = useState(0);
  const { userSession } = useConnect();

  useEffect(() => {
    fetchMessages();
    fetchCurrentBlockHeight();
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

  const fetchCurrentBlockHeight = async () => {
    try {
      const height = await getCurrentBlockHeight();
      setCurrentBlockHeight(height);
    } catch (err) {
      console.error('Failed to fetch current block height:', err);
    }
  };

  const handleDecrypt = (message, passphrase) => {
    try {
      const decryptedMessage = decryptMessage(message, passphrase);
      return decryptedMessage;
    } catch (err) {
      console.error('Failed to decrypt message:', err);
      return 'Decryption failed. Please check your passphrase.';
    }
  };

  return (
    <div>
      <h2>Your Messages</h2>
      {messages.length === 0 ? (
        <p>No messages yet.</p>
      ) : (
        <ul>
          {messages.map((message) => (
            <li key={message.id}>
              {message.isUnlocked ? (
                <DecryptedMessage message={message} handleDecrypt={handleDecrypt} />
              ) : (
                <LockedMessage message={message} currentBlockHeight={currentBlockHeight} />
              )}
            </li>
          ))}
        </ul>
      )}
      <button onClick={fetchMessages}>Refresh Messages</button>
    </div>
  );
}

function DecryptedMessage({ message, handleDecrypt }) {
  const [decryptedContent, setDecryptedContent] = useState('');
  const [passphrase, setPassphrase] = useState('');

  const decryptMessage = () => {
    const decrypted = handleDecrypt(message.message, passphrase);
    setDecryptedContent(decrypted);
  };

  return (
    <div>
      <p>Sender: {message.sender}</p>
      <p>Unlock height: {message.unlockHeight}</p>
      {decryptedContent ? (
        <p>Message: {decryptedContent}</p>
      ) : (
        <div>
          <input
            type="password"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            placeholder="Enter passphrase"
          />
          <button onClick={decryptMessage}>Decrypt</button>
        </div>
      )}
    </div>
  );
}

function LockedMessage({ message, currentBlockHeight }) {
  const blocksRemaining = message.unlockHeight - currentBlockHeight;

  return (
    <div>
      <p>Sender: {message.sender}</p>
      <p>Status: Locked</p>
      <p>Blocks remaining until unlock: {blocksRemaining}</p>
    </div>
  );
}

export default MessageList;