import React from 'react';
import { Sun, Moon, Terminal, Search, Shield } from 'lucide-react';

interface NavbarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isDarkMode: boolean;
  setIsDarkMode: (darkMode: boolean) => void;
  toggleTerminal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  setSearchQuery,
  isDarkMode,
  setIsDarkMode,
  toggleTerminal
}) => {
  return (
    <header className="navbar-container">
      <div className="navbar-inner">
        {/* Logo and Brand */}
        <div className="nav-logo">
          <Shield className="logo-icon" />
          <span className="logo-text">tobi<span className="logo-accent">.log</span></span>
        </div>

        {/* Search Bar */}
        <div className="search-wrapper">
          <Search className="search-icon" size={16} />
          <input
            type="text"
            placeholder="Search writeups, CVEs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        {/* Actions (Terminal, Theme Toggle) */}
        <div className="nav-actions">
          <button
            className="nav-action-btn terminal-trigger"
            onClick={toggleTerminal}
            title="Open Interactive Terminal (`)"
          >
            <Terminal size={18} />
            <span className="terminal-badge">SYS</span>
          </button>
          
          <button
            className="nav-action-btn theme-toggle"
            onClick={() => setIsDarkMode(!isDarkMode)}
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>
    </header>
  );
};
