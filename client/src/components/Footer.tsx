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
            <div className="flex space-x-4 flex-wrap">
              <a href="#" className="transition-colors duration-300 hover:opacity-80" style={{color: '#D9C89E'}}>
                <Facebook size={20} />
              </a>
              <a href="#" className="transition-colors duration-300 hover:opacity-80" style={{color: '#D9C89E'}}>
                <Instagram size={20} />
              </a>
              <a href="#" className="transition-colors duration-300 hover:opacity-80" style={{color: '#D9C89E'}}>
                <Linkedin size={20} />
              </a>
              {/* WhatsApp */}
              <a href="#" className="transition-colors duration-300 hover:opacity-80" style={{color: '#D9C89E'}}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.488"/>
                </svg>
              </a>
              {/* Marktplaats */}
              <a href="https://www.marktplaats.nl/u/dd-cars/27830238/" target="_blank" rel="noopener noreferrer" className="transition-colors duration-300 hover:opacity-80 text-sm font-medium" style={{color: '#D9C89E'}}>
                Marktplaats
              </a>
              {/* AutoScout24 */}
              <a href="#" className="transition-colors duration-300 hover:opacity-80 text-sm font-medium" style={{color: '#D9C89E'}}>
                AutoScout24
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
              <li className="flex items-start">
                <MapPin size={16} className="mr-2 mt-0.5" />
                <div>
                  Koekoekslaan 1A<br />
                  1171PG Badhoevedorp
                  <br />
                  <a 
                    href="https://maps.google.com/maps?q=Koekoekslaan+1A,+1171PG+Badhoevedorp,+Nederland"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 px-3 py-1 text-sm rounded-md transition-colors hover:opacity-80 border"
                    style={{color: '#D9C89E', borderColor: '#D9C89E'}}
                  >
                    📍 Routebeschrijving
                  </a>
                </div>
              </li>
              <li className="flex items-center">
                <Phone size={16} className="mr-2" />
                +31 6 15 40 41 04
              </li>
              <li className="flex items-center">
                <Mail size={16} className="mr-2" />
                DD.Cars@hotmail.nl
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
