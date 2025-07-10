import { Button } from "@/components/ui/button";
import { useFadeInOnScroll } from "@/hooks/useScrollAnimation";
import LazyImage from "@/components/LazyImage";

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
          src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080&q=80"
          alt="Premium Voertuigen"
          className="w-full h-full object-cover object-center image-zoom"
          onError={(e: any) => {
            console.error('Hero image failed to load:', e);
            e.target.src = "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080";
          }}
        />
      </div>

      <div className="relative z-20 container mx-auto px-4 h-full flex items-center">
        <div className="max-w-2xl">
          <h1 
            ref={titleRef}
            className={`text-5xl md:text-6xl font-light mb-6 leading-tight transition-all duration-700 ${titleFadeClass}`}
          >
            Premium <span className="text-luxury-gold font-bold">Occasions</span><br />
            <span className="text-3xl md:text-4xl text-gray-300">Exclusief & Uitzonderlijk</span>
          </h1>
          <p 
            ref={textRef}
            className={`text-xl text-gray-300 mb-8 leading-relaxed transition-all duration-700 delay-200 ${textFadeClass}`}
          >
            Ontdek onze collectie van premium voertuigen. Elke auto is zorgvuldig geselecteerd en gecontroleerd voor de meest veeleisende automobilist.
          </p>
          <div 
            ref={buttonRef}
            className={`flex flex-col sm:flex-row gap-4 transition-all duration-700 delay-400 ${buttonFadeClass}`}
          >
            <Button
              onClick={() => scrollToSection('aanbod')}
              className="luxury-button bg-luxury-gold text-dark-primary px-8 py-3 rounded-full font-semibold hover:bg-white border-0"
            >
              Bekijk Aanbod
            </Button>
            <Button
              onClick={() => scrollToSection('contact')}
              variant="outline"
              className="luxury-button border-luxury-gold text-luxury-gold px-8 py-3 rounded-full font-semibold hover:bg-luxury-gold hover:text-dark-primary"
            >
              Contact Opnemen
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}