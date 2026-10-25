import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, ChevronDown, User, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface AdminHeaderProps {
  onMenuClick: () => void;
}

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    navigate('/');
  };

  const displayName = user?.name || 'Admin';
  const displayEmail = user?.email || 'admin@restaurant.com';

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 sm:px-6 bg-white border-b border-neutral-100">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-1.5 rounded-md text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Right */}
      <div className="flex items-center">
        {/* Profile dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 pl-2 pr-1.5 py-1.5 rounded-md hover:bg-neutral-50 transition-colors"
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
            aria-label="Account menu"
          >
            <div className="h-7 w-7 rounded-full bg-neutral-100 flex items-center justify-center text-xs font-medium text-neutral-500">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-neutral-700 leading-none">{displayName}</p>
              <p className="text-[11px] text-neutral-400 leading-tight mt-0.5">{displayEmail}</p>
            </div>
            <ChevronDown className={`h-3.5 w-3.5 text-neutral-400 transition-transform duration-150 ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-48 bg-white border border-neutral-100 rounded-lg shadow-lg shadow-neutral-900/5 py-1 z-50">
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  navigate('/admin/profile');
                }}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50"
              >
                <User className="h-4 w-4" />
                Profile
              </button>
              <div className="border-t border-neutral-100 my-1" />
              <button
                onClick={handleLogout}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-error hover:bg-error-light/50"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
