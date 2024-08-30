import React from 'react';

function MessageList() {
  // TODO: Fetch messages from smart contract
  const messages = []; // Placeholder for fetched messages

  return (
    <div>
      <h2>Your Messages</h2>
      {messages.length === 0 ? (
        <p>No messages yet.</p>
      ) : (
        <ul>
          {messages.map((message, index) => (
            <li key={index}>{message}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default MessageList;