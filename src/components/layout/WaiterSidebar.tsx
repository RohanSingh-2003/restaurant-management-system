import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Receipt,
  MessageSquare,
  Clock,
  LayoutGrid,
  BellRing,
  History,
  LogOut,
  ChevronLeft,
  X,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useOperationalData } from '../../hooks/useOperationalData';

interface WaiterSidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onClose: () => void;
}

interface WaiterNavItem {
  label: string;
  path: string;
  icon: typeof Home;
  badge?: number;
}

interface WaiterNavGroup {
  title: string;
  items: WaiterNavItem[];
}

export function WaiterSidebar({ isOpen, isCollapsed, onToggleCollapse, onClose }: WaiterSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { orders, requests } = useOperationalData();

  const readyOrdersCount = orders.filter((o) => o.status === 'Ready').length;
  const activeOrdersCount = orders.filter((o) => o.status !== 'Completed' && o.status !== 'Cancelled').length;
  const pendingRequestsCount = requests.filter((r) => r.status === 'Pending').length;

  const currentPath = location.pathname.replace(/\/+$/, '');

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navGroups: WaiterNavGroup[] = [
    {
      title: 'Main',
      items: [
        { label: 'Home', path: '/waiter/dashboard', icon: Home },
      ],
    },
    {
      title: 'Floor',
      items: [
        { label: 'Tables', path: '/waiter/tables', icon: LayoutGrid },
      ],
    },
    {
      title: 'Service',
      items: [
        {
          label: 'Customer Requests',
          path: '/waiter/requests',
          icon: MessageSquare,
          badge: pendingRequestsCount > 0 ? pendingRequestsCount : undefined,
        },
        {
          label: 'Ready for Service',
          path: '/waiter/orders/ready',
          icon: BellRing,
          badge: readyOrdersCount > 0 ? readyOrdersCount : undefined,
        },
      ],
    },
    {
      title: 'Orders',
      items: [
        {
          label: 'Active Orders',
          path: '/waiter/orders',
          icon: Clock,
          badge: activeOrdersCount > 0 ? activeOrdersCount : undefined,
        },
        { label: 'Order History', path: '/waiter/orders/history', icon: History },
      ],
    },
    {
      title: 'Billing',
      items: [
        { label: 'Bills', path: '/waiter/bills', icon: Receipt },
      ],
    },
  ];

  const sidebarWidth = isCollapsed ? 'w-[68px]' : 'w-60';

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-screen bg-white border-r border-neutral-100 flex flex-col transition-all duration-200 ease-in-out shrink-0
          lg:translate-x-0 lg:static lg:z-auto lg:h-full
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          ${sidebarWidth}
        `}
        aria-label="Waiter navigation"
      >
        {/* Header */}
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} h-14 px-4 border-b border-neutral-100 shrink-0`}>
          {!isCollapsed && (
            <span className="text-sm font-semibold text-neutral-800 tracking-tight truncate">
              Restaurant MS
            </span>
          )}
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-md text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1 rounded-md text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronLeft className={`h-4 w-4 transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
          {navGroups.map((group) => (
            <div key={group.title}>
              {!isCollapsed && (
                <p className="px-2 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-300">
                  {group.title}
                </p>
              )}
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const itemPath = item.path.replace(/\/+$/, '');
                  const isActive = currentPath === itemPath;

                  return (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        onClick={onClose}
                        className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors duration-100
                          ${isActive
                            ? 'bg-accent-bg text-accent border border-accent-lighter'
                            : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50 border border-transparent'
                          }
                          ${isCollapsed ? 'justify-center px-0' : ''}
                        `}
                        title={isCollapsed ? item.label : undefined}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {!isCollapsed && <span className="truncate">{item.label}</span>}
                        {!isCollapsed && item.badge !== undefined && (
                          <span
                            className={`ml-auto px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${
                              isActive
                                ? 'bg-accent text-white'
                                : 'bg-neutral-100 text-neutral-600'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-neutral-100 p-3 shrink-0">
          {!isCollapsed && user && (
            <button
              onClick={() => {
                navigate('/waiter/profile');
                onClose();
              }}
              className="flex items-center gap-2.5 px-2 mb-2 w-full text-left rounded-md hover:bg-neutral-50 py-1 transition-colors cursor-pointer"
              title="View Waiter Profile"
            >
              <div className="h-8 w-8 rounded-full bg-neutral-100 flex items-center justify-center text-sm font-medium text-neutral-500 shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="truncate">
                <p className="text-sm font-medium text-neutral-700 truncate">{user.name}</p>
                <p className="text-xs text-neutral-400 truncate">{user.email}</p>
              </div>
            </button>
          )}
          {isCollapsed && user && (
            <button
              onClick={() => {
                navigate('/waiter/profile');
                onClose();
              }}
              className="flex items-center justify-center mb-2 w-full p-1 rounded-md hover:bg-neutral-50 transition-colors cursor-pointer"
              title="View Waiter Profile"
            >
              <div className="h-8 w-8 rounded-full bg-neutral-100 flex items-center justify-center text-sm font-medium text-neutral-500">
                {user.name.charAt(0).toUpperCase()}
              </div>
            </button>
          )}
          <button
            onClick={handleLogout}
            className={`flex items-center gap-2.5 w-full rounded-md px-2.5 py-2 text-sm font-medium text-neutral-500 hover:text-error hover:bg-error-light/50 transition-colors duration-100 cursor-pointer ${isCollapsed ? 'justify-center px-0' : ''}`}
            title={isCollapsed ? 'Logout' : undefined}
            aria-label="Logout"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
