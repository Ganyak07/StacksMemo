import React, { useState } from 'react';
import { useConnect } from '@stacks/connect-react';
import { createMessage } from '../lib/stacksUtils';

function MessageForm() {
  const [message, setMessage] = useState('');
  const [unlockDate, setUnlockDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { doContractCall } = useConnect();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await createMessage(doContractCall, message, new Date(unlockDate).getTime());
      setMessage('');
      setUnlockDate('');
      // You might want to trigger a refresh of the message list here
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
        disabled={isLoading}
      />
      <input
        type="date"
        value={unlockDate}
        onChange={(e) => setUnlockDate(e.target.value)}
        required
        disabled={isLoading}
      />
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Creating...' : 'Create Message'}
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
  
    try {
      const unlockHeight = Math.floor(new Date(unlockDate).getTime() / 1000 / 600); // Approximate block height
      await createMessage(doContractCall, message, unlockHeight);
      setMessage('');
      setUnlockDate('');
      // Trigger a refresh of the message list
    } catch (err) {
      setError('Failed to create message. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
export default MessageForm;