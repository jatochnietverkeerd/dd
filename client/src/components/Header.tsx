import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Car } from "lucide-react";
import { Logo } from "./Logo";

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [location] = useLocation();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerHeight = 80;
      const elementPosition = element.offsetTop - headerHeight;
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });
    }
    closeMobileMenu();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-dark-primary/90 backdrop-blur-md">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-center relative">
          {/* Left Navigation Items */}
          <div className="hidden md:flex items-center space-x-8 absolute left-0">
            <Link href="/" className="transition-all duration-300 relative group" style={{color: '#D9C89E'}}>
              <span className="relative z-10">Home</span>
              <div className="absolute -bottom-1 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full" style={{backgroundColor: '#D9C89E'}}></div>
            </Link>
            <Link href="/aanbod" className="transition-all duration-300 relative group" style={{color: '#D9C89E'}}>
              <span className="relative z-10">Aanbod</span>
              <div className="absolute -bottom-1 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full" style={{backgroundColor: '#D9C89E'}}></div>
            </Link>
          </div>

          {/* Centered Logo */}
          <Link href="/" className="flex items-center space-x-3 scale-on-hover">
            <Logo className="h-12 transition-transform duration-300 hover:scale-110" />
          </Link>

          {/* Right Navigation Items */}
          <div className="hidden md:flex items-center space-x-8 absolute right-0">
            <Link 
              href="/over-ons" 
              className="transition-all duration-300 relative group"
              style={{color: '#D9C89E'}}
            >
              <span className="relative z-10">Over Ons</span>
              <div className="absolute -bottom-1 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full" style={{backgroundColor: '#D9C89E'}}></div>
            </Link>
            <button
              onClick={() => scrollToSection('contact')}
              className="transition-all duration-300 relative group"
              style={{color: '#D9C89E'}}
            >
              <span className="relative z-10">Contact</span>
              <div className="absolute -bottom-1 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full" style={{backgroundColor: '#D9C89E'}}></div>
            </button>
          </div>
          
          {/* Mobile Menu Button - Positioned to the right */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden transition-all duration-300 scale-on-hover absolute right-0"
            style={{color: '#D9C89E'}}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>
      
      {/* Mobile Navigation - Full Screen Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-dark-primary z-[9999] flex flex-col">
          {/* Header with close button */}
          <div className="flex justify-between items-center p-6 border-b border-gray-700">
            <h2 className="text-xl font-semibold" style={{color: '#D9C89E'}}>Menu</h2>
            <button
              onClick={closeMobileMenu}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              style={{color: '#D9C89E'}}
            >
              <X size={24} />
            </button>
          </div>
          
          {/* Menu Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Logo Section */}
            <div className="text-center mb-8">
              <Logo className="h-12 mx-auto mb-3" />
              <p className="text-sm opacity-75" style={{color: '#D9C89E'}}>Betrouwbare Occasions</p>
            </div>
            
            {/* Navigation Links */}
            <div className="space-y-4">
              <Link 
                href="/" 
                onClick={closeMobileMenu}
                className="flex items-center gap-3 w-full p-4 rounded-xl bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
                style={{color: '#D9C89E'}}
              >
                <span className="text-2xl">🏠</span>
                <span className="text-lg">Home</span>
              </Link>
              
              <Link 
                href="/aanbod" 
                onClick={closeMobileMenu}
                className="flex items-center gap-3 w-full p-4 rounded-xl bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
                style={{color: '#D9C89E'}}
              >
                <span className="text-2xl">🚗</span>
                <span className="text-lg">Aanbod</span>
              </Link>
              
              <Link 
                href="/over-ons" 
                onClick={closeMobileMenu}
                className="flex items-center gap-3 w-full p-4 rounded-xl bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
                style={{color: '#D9C89E'}}
              >
                <span className="text-2xl">👥</span>
                <span className="text-lg">Over Ons</span>
              </Link>
              
              <button
                onClick={() => scrollToSection('contact')}
                className="flex items-center gap-3 w-full p-4 rounded-xl bg-gray-800/50 hover:bg-gray-700/50 transition-colors text-left"
                style={{color: '#D9C89E'}}
              >
                <span className="text-2xl">📞</span>
                <span className="text-lg">Contact</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
