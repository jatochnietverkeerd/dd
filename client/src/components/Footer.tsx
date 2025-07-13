import { Car, Facebook, Instagram, Linkedin, MapPin, Phone, Mail } from "lucide-react";
import { Link } from "wouter";
import { Logo } from "./Logo";

export default function Footer() {
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
  };

  return (
    <footer className="bg-dark-secondary border-t border-dark-quaternary py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Logo className="h-10" />
            </div>
            <p className="mb-4" style={{color: '#D9C89E'}}>
              Premium occasions voor de veeleisende automobilist. Kwaliteit, service en betrouwbaarheid staan bij ons centraal.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-luxury-gold transition-colors duration-300">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-luxury-gold transition-colors duration-300">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-luxury-gold transition-colors duration-300">
                <Linkedin size={20} />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4" style={{color: '#D9C89E'}}>Navigatie</h4>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/"
                  className="transition-colors duration-300 hover:opacity-80"
                  style={{color: '#D9C89E'}}
                >
                  Home
                </Link>
              </li>
              <li>
                <Link 
                  href="/aanbod"
                  className="transition-colors duration-300 hover:opacity-80"
                  style={{color: '#D9C89E'}}
                >
                  Aanbod
                </Link>
              </li>
              <li>
                <Link 
                  href="/over-ons"
                  className="transition-colors duration-300 hover:opacity-80"
                  style={{color: '#D9C89E'}}
                >
                  Over Ons
                </Link>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('contact')}
                  className="transition-colors duration-300 hover:opacity-80"
                  style={{color: '#D9C89E'}}
                >
                  Contact
                </button>
              </li>
              <li>
                <Link 
                  href="/admin/login"
                  className="transition-colors duration-300 hover:opacity-80 text-sm"
                  style={{color: '#D9C89E'}}
                >
                  Admin
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4" style={{color: '#D9C89E'}}>Services</h4>
            <ul className="space-y-2">
              <li><a href="#" className="transition-colors duration-300 hover:opacity-80" style={{color: '#D9C89E'}}>Verkoop</a></li>
              <li><a href="#" className="transition-colors duration-300 hover:opacity-80" style={{color: '#D9C89E'}}>Inkoop</a></li>
              <li><a href="#" className="transition-colors duration-300 hover:opacity-80" style={{color: '#D9C89E'}}>Financiering</a></li>
              <li><a href="#" className="transition-colors duration-300 hover:opacity-80" style={{color: '#D9C89E'}}>Verzekering</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4" style={{color: '#D9C89E'}}>Contact Info</h4>
            <ul className="space-y-2" style={{color: '#D9C89E'}}>
              <li className="flex items-center">
                <MapPin size={16} className="mr-2" />
                Hoofdstraat 123, Amsterdam
              </li>
              <li className="flex items-center">
                <Phone size={16} className="mr-2" />
                +31 20 123 4567
              </li>
              <li className="flex items-center">
                <Mail size={16} className="mr-2" />
                info@ddcars.nl
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-dark-quaternary mt-8 pt-8 text-center" style={{color: '#D9C89E'}}>
          <p>&copy; 2024 DD Cars. Alle rechten voorbehouden. | Privacy Policy | Terms of Service</p>
        </div>
      </div>
    </footer>
  );
}
