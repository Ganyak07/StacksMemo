import React, { useState } from 'react';
import { Connect } from '@stacks/connect-react';
import { StacksTestnet } from '@stacks/network';
import Header from './components/Header';
import MessageForm from './components/MessageForm';
import MessageList from './components/MessageList';
import StatusMessage from './components/StatusMessage';
import './App.css';

const network = new StacksTestnet();

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const appConfig = {
    appName: 'StackMemo',
    network,
  };

  return (
    <Connect authOptions={appConfig}>
      <div className="App">
        <Header />
        <StatusMessage isLoading={isLoading} error={error} />
        <main>
          <MessageForm setIsLoading={setIsLoading} setError={setError} />
          <MessageList setIsLoading={setIsLoading} setError={setError} />
        </main>
      </div>
    </Connect>
  );
}

export default App;