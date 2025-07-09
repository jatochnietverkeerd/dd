import { Button } from "@/components/ui/button";

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
      {/* Hero background with luxury sports car */}
      <div className="absolute inset-0 bg-gradient-to-r from-dark-primary via-dark-primary/70 to-transparent z-10"></div>
      <div className="absolute inset-0">
        <img 
          src="https://images.unsplash.com/photo-1544636331-e26879cd4d9b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&h=1080" 
          alt="Premium sports car in luxury showroom" 
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="relative z-20 container mx-auto px-4 h-full flex items-center">
        <div className="max-w-2xl">
          <h1 className="text-5xl md:text-6xl font-light mb-6 leading-tight">
            Premium <span className="text-luxury-gold font-bold">Occasions</span><br />
            <span className="text-3xl md:text-4xl text-gray-300">Exclusief & Uitzonderlijk</span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 leading-relaxed">
            Ontdek onze collectie van premium voertuigen. Elke auto is zorgvuldig geselecteerd en gecontroleerd voor de meest veeleisende automobilist.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => scrollToSection('aanbod')}
              className="bg-luxury-gold text-dark-primary px-8 py-3 rounded-full font-semibold hover:bg-white transition-colors duration-300 border-0"
            >
              Bekijk Aanbod
            </Button>
            <Button
              onClick={() => scrollToSection('contact')}
              variant="outline"
              className="border-luxury-gold text-luxury-gold px-8 py-3 rounded-full font-semibold hover:bg-luxury-gold hover:text-dark-primary transition-colors duration-300"
            >
              Contact Opnemen
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
