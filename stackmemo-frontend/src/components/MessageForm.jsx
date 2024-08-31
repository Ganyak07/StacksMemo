import React, { useState } from 'react';
import { useConnect } from '@stacks/connect-react';
import { createMessage } from '../lib/stacksUtils';

function MessageForm({ setIsLoading, setError }) {
  const [message, setMessage] = useState('');
  const [unlockDate, setUnlockDate] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const { doContractCall } = useConnect();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const unlockHeight = Math.floor(new Date(unlockDate).getTime() / 1000 / 600); // Approximate block height
      await createMessage(doContractCall, message, unlockHeight, passphrase);
      setMessage('');
      setUnlockDate('');
      setPassphrase('');
      // Trigger a refresh of the message list
    } catch (err) {
      setError('Failed to create message. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
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
      <input
        type="password"
        value={passphrase}
        onChange={(e) => setPassphrase(e.target.value)}
        placeholder="Enter a passphrase"
        required
      />
      <button type="submit">Create Message</button>
    </form>
  );
}

export default MessageForm;