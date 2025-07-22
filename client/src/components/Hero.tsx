import { Button } from "@/components/ui/button";
import { useFadeInOnScroll } from "@/hooks/useScrollAnimation";
import LazyImage from "@/components/LazyImage";
import heroImage from "@assets/hero_image_DD_1753178216280.webp";

export default function Hero() {
  const { elementRef: titleRef, fadeInClass: titleFadeClass } = useFadeInOnScroll(0.2);
  const { elementRef: textRef, fadeInClass: textFadeClass } = useFadeInOnScroll(0.2);
  const { elementRef: buttonRef, fadeInClass: buttonFadeClass } = useFadeInOnScroll(0.2);

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
    <section id="home" className="relative h-screen overflow-hidden">
      {/* Hero background with luxury sports car */}
      <div className="absolute inset-0 bg-gradient-to-r from-dark-primary via-dark-primary/70 to-transparent z-10"></div>
      <div className="absolute inset-0">
        <LazyImage
          src={heroImage}
          alt="Premium Volkswagen GTI Voertuigen - DD Cars"
          className="w-full h-full object-cover object-center image-zoom"
          onError={(e: any) => {
            console.error('Hero image failed to load:', e);
            e.target.src = "https://images.unsplash.com/photo-1503376780353-7e6692767b70?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080&q=80";
          }}
        />
      </div>

      <div className="relative z-20 container mx-auto px-4 h-full flex items-center">
        <div className="max-w-2xl">
          <h1 
            ref={titleRef}
            className={`text-5xl md:text-6xl font-light mb-6 leading-tight transition-all duration-700 ${titleFadeClass}`}
          >
            <span style={{color: '#D9C89E'}}>Betrouwbare</span> <span className="font-bold" style={{color: '#D9C89E'}}>Volkswagen</span><br />
            <span className="text-3xl md:text-4xl" style={{color: '#D9C89E'}}>Occasions 2014-2024</span>
          </h1>
          <p 
            ref={textRef}
            className={`text-xl mb-8 leading-relaxed transition-all duration-700 delay-200 ${textFadeClass}`}
            style={{color: '#D9C89E'}}
          >
            Ontdek ons aanbod van betrouwbare Volkswagen occasions. Van praktische Polo's tot sportieve Golf GTI's - alle auto's zijn zorgvuldig gecontroleerd en betaalbaar geprijsd.
          </p>
          <div 
            ref={buttonRef}
            className={`flex flex-col sm:flex-row gap-4 transition-all duration-700 delay-400 ${buttonFadeClass}`}
          >
            <Button
              onClick={() => scrollToSection('aanbod')}
              className="luxury-button px-8 py-3 rounded-full font-semibold hover:bg-white border-0"
              style={{backgroundColor: '#D9C89E', color: '#1a1a1a'}}
            >
              Bekijk Aanbod
            </Button>
            <Button
              onClick={() => scrollToSection('contact')}
              variant="outline"
              className="luxury-button px-8 py-3 rounded-full font-semibold"
              style={{borderColor: '#D9C89E', color: '#D9C89E'}}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#D9C89E';
                e.currentTarget.style.color = '#1a1a1a';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#D9C89E';
              }}
            >
              Contact Opnemen
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}