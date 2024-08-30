import React from 'react';

function StatusMessage({ isLoading, error }) {
  if (isLoading) {
    return <div className="status-message loading">Loading...</div>;
  }

  if (error) {
    return <div className="status-message error">{error}</div>;
  }

  return null;
}

export default StatusMessage;