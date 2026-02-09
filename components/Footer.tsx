import React from 'react';
import { ShoppingBag, Facebook, Twitter, Instagram, Lock, Mail, Phone } from 'lucide-react';
import { ViewState } from '../types';

interface FooterProps {
    onNavigate: (view: ViewState) => void;
    currentView: ViewState;
}

const Footer: React.FC<FooterProps> = ({ onNavigate, currentView }) => {
  const handleScroll = (id: string) => {
    if (currentView !== 'landing') {
        onNavigate('landing');
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
    <footer className="bg-gray-900 text-white pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center text-green-400 mb-4 cursor-pointer" onClick={() => onNavigate('landing')}>
              <ShoppingBag className="h-8 w-8 mr-2" />
              <span className="font-bold text-xl">OrderBuddy</span>
            </div>
            <p className="text-gray-400 text-sm">
              Helping Pakistani businesses grow, one order at a time. The simplest way to manage your WhatsApp sales.
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase mb-4">Product</h3>
            <ul className="space-y-3">
              <li><button onClick={() => handleScroll('features')} className="text-gray-400 hover:text-white transition-colors text-left">Features</button></li>
              <li><button onClick={() => handleScroll('pricing')} className="text-gray-400 hover:text-white transition-colors text-left">Pricing</button></li>
              <li><button onClick={() => handleScroll('testimonials')} className="text-gray-400 hover:text-white transition-colors text-left">Testimonials</button></li>
              <li><button onClick={() => handleScroll('faq')} className="text-gray-400 hover:text-white transition-colors text-left">FAQ</button></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase mb-4">Support</h3>
            <ul className="space-y-3">
              <li><button onClick={() => handleScroll('contact')} className="text-gray-400 hover:text-white transition-colors text-left">Contact Us</button></li>
              <li><button onClick={() => onNavigate('privacy')} className="text-gray-400 hover:text-white transition-colors text-left">Privacy Policy</button></li>
              <li><button onClick={() => onNavigate('terms')} className="text-gray-400 hover:text-white transition-colors text-left">Terms of Service</button></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase mb-4">Connect</h3>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Facebook className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Instagram className="h-6 w-6" />
              </a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-12 pt-8 flex justify-between items-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} OrderBuddy Pakistan. All rights reserved.</p>
          
          {/* Hidden Admin Link */}
          <button 
            onClick={() => onNavigate('admin')} 
            className="opacity-20 hover:opacity-100 hover:text-green-500 transition-opacity"
            title="Owner Access"
          >
            <Lock className="h-4 w-4" />
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;