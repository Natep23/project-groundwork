import React from 'react';
import { Authenticated, Unauthenticated } from 'convex/react';
import { SignInButton, SignOutButton, UserButton } from '@clerk/clerk-react';
import StartScreen from './screens/StartScreen';
import { api } from './convex/_generated/api';

function App() {
  return (
    <main>
      <Unauthenticated>
        <SignInButton />
      </Unauthenticated>
      <Authenticated>
        <UserButton />
        <Content />
        <SignOutButton />
      </Authenticated>
    </main>
  );
}

function Content() {
  return (
    <StartScreen />
  )
}
        

export default App;
