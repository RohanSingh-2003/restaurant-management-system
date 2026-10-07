import { useNavigate } from 'react-router-dom';

interface RoleCardData {
  role: string;
  description: string;
  path: string;
  available: boolean;
}

const roles: RoleCardData[] = [
  {
    role: 'Admin',
    description: 'Analytics, performance and business insights',
    path: '/admin/login',
    available: true,
  },
  {
    role: 'Waiter',
    description: 'Orders, tables and customer service',
    path: '/waiter/login',
    available: true,
  },
  {
    role: 'Cook',
    description: 'Kitchen orders and preparation',
    path: '/cook/login',
    available: true,
  },
  {
    role: 'Customer',
    description: 'Menu, current order, order tracking and bills',
    path: '/customer/login',
    available: true,
  },
  {
    role: 'Manager',
    description: 'Users, staff, menu, tables and system administration',
    path: '/manager/login',
    available: true,
  },
];

export function RoleSelection() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-neutral-25 flex flex-col">
      {/* Header bar */}
      <header className="border-b border-neutral-100 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <span className="text-sm font-semibold text-neutral-800 tracking-tight">
            Restaurant Management System
          </span>
          <span className="text-xs text-neutral-400 font-medium">
            Enterprise Portal
          </span>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12">
        <div className="w-full max-w-3xl">
          <div className="text-center mb-10">
            <h1 className="text-2xl font-semibold text-neutral-800">
              Select your role
            </h1>
            <p className="mt-2 text-sm text-neutral-400">
              One platform for managing your restaurant.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {roles.map(({ role, description, path, available }) => (
              <button
                key={role}
                onClick={() => navigate(path)}
                className={`group relative flex flex-col justify-between text-left p-5 rounded-lg border bg-white transition-all duration-150 min-h-[110px]
                  ${available
                    ? 'border-neutral-200 hover:border-neutral-300 hover:shadow-sm cursor-pointer'
                    : 'border-neutral-100 opacity-60 cursor-default'
                  }
                `}
                disabled={!available}
                aria-label={available ? `Sign in as ${role}` : `${role} — coming soon`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className={`text-base font-semibold ${available ? 'text-neutral-800 group-hover:text-accent' : 'text-neutral-400'}`}>
                      {role}
                    </p>
                    {!available && (
                      <span className="inline-flex items-center rounded-md bg-neutral-100 text-neutral-500 text-[11px] font-medium px-2 py-0.5">
                        Coming soon
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    {description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
