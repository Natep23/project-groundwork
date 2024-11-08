import React, { useCallback } from 'react';
import { Authenticated, Unauthenticated } from 'convex/react';
import StartScreen from './screens/StartScreen';
import DashboardScreen from './screens/DashboardScreen';
import { Header } from './components/header';
// import { api } from './convex/_generated/api';

type ThemeBtnProps = {
  onClick: () => void;
  className: string;
}

function App() {

  const [theme, setTheme] = React.useState(
    localStorage.getItem('theme') || 'light');

  const [themebtn, setThemeBtn] = React.useState(
    localStorage.getItem('theme')? 'Light' : 'Dark');

  React.useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light');
    setThemeBtn(theme === 'light' ? 'Light' : 'Dark');
  }, [theme]);

  const Themebutton = ({onClick, className}: ThemeBtnProps) => { 
    return (
        <button onClick={onClick} className={className}>
          <span>{themebtn} Mode</span>
        </button>
    );
}

  
  return (
      <div className='app-container' data-theme={theme}>
      <Unauthenticated>
        <Header />
        <Themebutton onClick={toggleTheme} className="theme-button" />
        <StartScreen />
      </Unauthenticated>
      <Authenticated>
        <Header />
        <Themebutton onClick={toggleTheme} className="theme-button" />
        <DashboardScreen />
      </Authenticated>
      </div>
  );
}


        
export default App;
