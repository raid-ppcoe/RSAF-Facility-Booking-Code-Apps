import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Home, 
  Calendar, 
  Clock, 
  Settings, 
  LogOut, 
  User as UserIcon, 
  Shield, 
  Building2,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const menuItems = [
    { id: 'home', label: 'Home', icon: Home, roles: ['user', 'admin', 'super_admin'] },
    { id: 'book', label: 'Book Facility', icon: Calendar, roles: ['user', 'admin', 'super_admin'] },
    { id: 'availability', label: 'Availability', icon: Clock, roles: ['user', 'admin', 'super_admin'] },
    { id: 'management', label: 'Management', icon: Shield, roles: ['admin', 'super_admin'] },
    { id: 'infrastructure', label: 'Infrastructure', icon: Building2, roles: ['admin', 'super_admin'] },
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['user', 'admin', 'super_admin'] },
  ];

  const filteredMenuItems = menuItems.filter(item => item.roles.includes(user?.role || 'user'));

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-[#1E3A8A] text-white">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
            <Building2 className="text-white" size={24} />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight block">FacilityBook</span>
            <span className="text-xs text-white/50 block leading-none">v1.0.35</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {filteredMenuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                activeTab === item.id 
                  ? "bg-white/10 text-white shadow-lg" 
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-all"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 md:px-10">
          <div className="flex items-center gap-4">
            <button 
              title="Open Menu"
              className="md:hidden p-2 hover:bg-slate-100 rounded-lg"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={24} />
            </button>
            <h1 className="text-2xl font-bold text-slate-800 capitalize">{activeTab.replace('-', ' ')}</h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-800">{user?.name}</p>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{user?.role.replace('_', ' ')}</p>
              </div>
              <div className="w-10 h-10 rounded-xl border-2 border-slate-100 shadow-sm bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 bg-[#1E3A8A] text-white z-50 md:hidden p-6 flex flex-col"
            >
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-3">
                  <Building2 size={24} />
                  <div>
                    <span className="text-xl font-bold block">FacilityBook</span>
                    <span className="text-xs text-white/50 block leading-none mt-1">v1.0.35</span>
                  </div>
                </div>
                <button title="Close Menu" onClick={() => setIsMobileMenuOpen(false)}>
                  <X size={24} />
                </button>
              </div>

              <nav className="flex-1 space-y-2">
                {filteredMenuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                      activeTab === item.id 
                        ? "bg-white/10 text-white" 
                        : "text-white/60"
                    )}
                  >
                    <item.icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </nav>

              <button 
                onClick={logout}
                className="flex items-center gap-3 px-4 py-3 text-white/60 mt-auto"
              >
                <LogOut size={20} />
                <span className="font-medium">Logout</span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};