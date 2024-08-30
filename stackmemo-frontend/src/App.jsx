import React from 'react';
import { Connect } from '@stacks/connect-react';
import { StacksMocknet } from '@stacks/network';
import Header from './components/Header';
import MessageForm from './components/MessageForm';
import MessageList from './components/MessageList';

const network = new StacksMocknet();

function App() {
  const appConfig = {
    appName: 'StackMemo',
    network,
  };

  return (
    <Connect authOptions={appConfig}>
      <div className="App">
        <Header />
        <main>
          <MessageForm />
          <MessageList />
        </main>
      </div>
    </Connect>
  );
}

export default App;