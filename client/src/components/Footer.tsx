import { Car, Facebook, Instagram, Linkedin, MapPin, Phone, Mail } from "lucide-react";
import { Link } from "wouter";

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
              <div className="w-8 h-8 bg-luxury-gold rounded-full flex items-center justify-center">
                <Car className="text-dark-primary text-sm" size={16} />
              </div>
              <span className="text-xl font-bold text-white">
                DD<span className="text-luxury-gold">Cars</span>
              </span>
            </div>
            <p className="text-gray-400 mb-4">
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
            <h4 className="text-lg font-semibold mb-4">Navigatie</h4>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/"
                  className="text-gray-400 hover:text-luxury-gold transition-colors duration-300"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link 
                  href="/aanbod"
                  className="text-gray-400 hover:text-luxury-gold transition-colors duration-300"
                >
                  Aanbod
                </Link>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('over-ons')}
                  className="text-gray-400 hover:text-luxury-gold transition-colors duration-300"
                >
                  Over Ons
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('contact')}
                  className="text-gray-400 hover:text-luxury-gold transition-colors duration-300"
                >
                  Contact
                </button>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Services</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-luxury-gold transition-colors duration-300">Verkoop</a></li>
              <li><a href="#" className="text-gray-400 hover:text-luxury-gold transition-colors duration-300">Inkoop</a></li>
              <li><a href="#" className="text-gray-400 hover:text-luxury-gold transition-colors duration-300">Financiering</a></li>
              <li><a href="#" className="text-gray-400 hover:text-luxury-gold transition-colors duration-300">Verzekering</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Info</h4>
            <ul className="space-y-2 text-gray-400">
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
        
        <div className="border-t border-dark-quaternary mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2024 DD Cars. Alle rechten voorbehouden. | Privacy Policy | Terms of Service</p>
        </div>
      </div>
    </footer>
  );
}
