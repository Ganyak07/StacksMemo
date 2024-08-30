import React, { useState } from 'react';

function MessageForm() {
  const [message, setMessage] = useState('');
  const [unlockDate, setUnlockDate] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Implement message creation logic
    console.log('Message:', message, 'Unlock Date:', unlockDate);
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Enter your message"
        required
      />
      <input
        type="date"
        value={unlockDate}
        onChange={(e) => setUnlockDate(e.target.value)}
        required
      />
      <button type="submit">Create Message</button>
    </form>
  );
}

export default MessageForm;