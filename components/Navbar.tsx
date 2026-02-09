import React from 'react';
import { ShoppingBag, LogOut, Menu, X } from 'lucide-react';
import { User, ViewState } from '../types';

interface NavbarProps {
  view: ViewState;
  user: User | null;
  onNavigate: (view: ViewState) => void;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ view, user, onNavigate, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const handleScroll = (id: string) => {
    setIsMenuOpen(false);
    if (view !== 'landing') {
        onNavigate('landing');
        // Small timeout to allow landing page to mount
        setTimeout(() => {
            const element = document.getElementById(id);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }, 100);
    } else {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    }
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo Section */}
          <div className="flex items-center cursor-pointer flex-shrink-0" onClick={() => onNavigate(user ? 'dashboard' : 'landing')}>
            <div className="flex items-center text-green-600">
              <ShoppingBag className="h-8 w-8 mr-2" />
              <span className="font-bold text-xl tracking-tight">OrderBuddy</span>
            </div>
          </div>
          
          {/* Centered Navigation Links (Desktop) */}
          <div className="hidden md:flex items-center justify-center flex-1 space-x-8">
             <button onClick={() => onNavigate('landing')} className="text-gray-600 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">Home</button>
             <button onClick={() => handleScroll('features')} className="text-gray-600 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">Features</button>
             <button onClick={() => handleScroll('pricing')} className="text-gray-600 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">Pricing</button>
             <button onClick={() => handleScroll('contact')} className="text-gray-600 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">Contact</button>
          </div>

          {/* Right Side Auth Buttons (Desktop) */}
          <div className="hidden md:flex items-center space-x-4 flex-shrink-0">
            {(!user && view !== 'login') && (
                <button onClick={() => onNavigate('login')} className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg text-sm font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5">
                  Login / Signup
                </button>
            )}
            
            {user && (
              <div className="flex items-center space-x-4">
                <span className="text-gray-700 font-medium">Hi, {user.shopName}</span>
                <button 
                  onClick={onLogout}
                  className="flex items-center text-gray-500 hover:text-red-600 transition-colors"
                >
                  <LogOut className="h-5 w-5 mr-1" />
                  Logout
                </button>
              </div>
            )}
            
             {view === 'login' && !user && (
              <button onClick={() => onNavigate('landing')} className="text-gray-600 hover:text-green-600 font-medium">
                Back to Home
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 absolute w-full shadow-lg">
          <div className="px-4 pt-2 pb-6 space-y-2">
            <button onClick={() => { onNavigate('landing'); setIsMenuOpen(false); }} className="block w-full text-left px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">Home</button>
            <button onClick={() => handleScroll('features')} className="block w-full text-left px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">Features</button>
            <button onClick={() => handleScroll('pricing')} className="block w-full text-left px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">Pricing</button>
            <button onClick={() => handleScroll('contact')} className="block w-full text-left px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">Contact</button>
            {!user && view !== 'login' && (
                <div className="pt-2">
                    <button onClick={() => { onNavigate('login'); setIsMenuOpen(false); }} className="block w-full text-center px-4 py-3 rounded-xl text-base font-bold text-white bg-green-600 hover:bg-green-700 shadow-md">
                        Login / Signup
                    </button>
                </div>
            )}
             {user && (
              <button onClick={onLogout} className="block w-full text-left px-3 py-3 rounded-md text-base font-medium text-red-600 hover:bg-red-50">Logout</button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;