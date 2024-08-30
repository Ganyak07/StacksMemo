import React from 'react';
import { useConnect } from '@stacks/connect-react';

function Header() {
  const { authenticate, isSignedIn } = useConnect();

  return (
    <header>
      <h1>StackMemo</h1>
      {!isSignedIn ? (
        <button onClick={() => authenticate()}>Connect Wallet</button>
      ) : (
        <p>Wallet Connected</p>
      )}
    </header>
  );
}

export default Header;