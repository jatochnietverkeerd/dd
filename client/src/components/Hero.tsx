import { Button } from "@/components/ui/button";
import heroImage from "@assets/hero_image_DD_1753178216280.webp";

export default function Hero() {

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
      {/* Hero background - optimized for performance */}
      <div className="absolute inset-0 bg-gradient-to-r from-dark-primary via-dark-primary/70 to-transparent z-10"></div>
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Betrouwbare Occasions - DD Cars"
          className="w-full h-full object-cover object-center"
          loading="eager"
          decoding="sync"
          fetchPriority="high"
          width="1920"
          height="1080"
        />
      </div>

      <div className="relative z-20 container mx-auto px-4 h-full flex items-center">
        <div className="max-w-2xl">
          <h1 className="text-5xl md:text-6xl font-light mb-6 leading-tight">
            <span style={{color: '#D9C89E'}}>Betrouwbare</span> <span className="font-bold" style={{color: '#D9C89E'}}>Occasions</span><br />
            <span className="text-3xl md:text-4xl" style={{color: '#D9C89E'}}>Kwalitatief & Betaalbaar</span>
          </h1>
          <p className="text-xl mb-8 leading-relaxed" style={{color: '#D9C89E'}}>
            Ontdek ons aanbod van betrouwbare occasions. Van praktische gezinsauto's tot sportieve modellen - alle auto's zijn zorgvuldig gecontroleerd en betaalbaar geprijsd.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => scrollToSection('aanbod')}
              className="px-8 py-3 rounded-full font-semibold border-0"
              style={{backgroundColor: '#D9C89E', color: '#1a1a1a'}}
            >
              Bekijk Aanbod
            </Button>
            <Button
              onClick={() => scrollToSection('contact')}
              variant="outline"
              className="px-8 py-3 rounded-full font-semibold"
              style={{borderColor: '#D9C89E', color: '#D9C89E'}}
            >
              Contact Opnemen
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}