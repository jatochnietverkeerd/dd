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
      
      {/* Hamburger Mobile Menu - Only visible when clicked */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[80px] bg-dark-primary/95 backdrop-blur-sm border-t border-gray-700 z-40 animate-in slide-in-from-top duration-300">
          <div className="py-4 px-4 space-y-1">
            <Link 
              href="/" 
              onClick={closeMobileMenu}
              className="block py-3 px-4 text-lg font-medium rounded-lg transition-colors hover:bg-gray-800"
              style={{color: '#D9C89E'}}
            >
              Home
            </Link>
            <Link 
              href="/aanbod" 
              onClick={closeMobileMenu}
              className="block py-3 px-4 text-lg font-medium rounded-lg transition-colors hover:bg-gray-800"
              style={{color: '#D9C89E'}}
            >
              Aanbod
            </Link>
            <Link 
              href="/over-ons" 
              onClick={closeMobileMenu}
              className="block py-3 px-4 text-lg font-medium rounded-lg transition-colors hover:bg-gray-800"
              style={{color: '#D9C89E'}}
            >
              Over Ons
            </Link>
            <button
              onClick={() => scrollToSection('contact')}
              className="block w-full text-left py-3 px-4 text-lg font-medium rounded-lg transition-colors hover:bg-gray-800"
              style={{color: '#D9C89E'}}
            >
              Contact
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
