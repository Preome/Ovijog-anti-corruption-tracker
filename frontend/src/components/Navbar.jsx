import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Menu, X } from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-primary" />
            <span className="ml-2 text-xl font-bold text-gray-800">
              অভিযোগ | Anti-Corruption Tracker
            </span>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/" className="text-gray-700 hover:text-primary px-3 py-2">হোম</Link>
            <Link to="/apply" className="text-gray-700 hover:text-primary px-3 py-2">আবেদন করুন</Link>
            <Link to="/track" className="text-gray-700 hover:text-primary px-3 py-2">ট্র্যাক করুন</Link>
            <Link to="/complaint" className="text-gray-700 hover:text-primary px-3 py-2">অভিযোগ করুন</Link>
            <Link to="/dashboard" className="text-gray-700 hover:text-primary px-3 py-2">ড্যাশবোর্ড</Link>
            <button className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-secondary">
              বাংলা / English
            </button>
          </div>
          
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        
        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link to="/" className="block text-gray-700 hover:text-primary px-3 py-2">হোম</Link>
              <Link to="/apply" className="block text-gray-700 hover:text-primary px-3 py-2">আবেদন করুন</Link>
              <Link to="/track" className="block text-gray-700 hover:text-primary px-3 py-2">ট্র্যাক করুন</Link>
              <Link to="/complaint" className="block text-gray-700 hover:text-primary px-3 py-2">অভিযোগ করুন</Link>
              <Link to="/dashboard" className="block text-gray-700 hover:text-primary px-3 py-2">ড্যাশবোর্ড</Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;