import { useFadeInOnScroll } from "@/hooks/useScrollAnimation";
import LazyImage from "@/components/LazyImage";

export default function About() {
  const { elementRef: textRef, fadeInClass: textFadeClass } = useFadeInOnScroll(0.2);
  const { elementRef: imageRef, fadeInClass: imageFadeClass } = useFadeInOnScroll(0.2);
  const { elementRef: statsRef, fadeInClass: statsFadeClass } = useFadeInOnScroll(0.2);

  return (
    <section id="over-ons" className="py-20 bg-dark-secondary">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div 
            ref={textRef}
            className={`transition-all duration-700 ${textFadeClass}`}
          >
            <h2 className="text-4xl font-light mb-6">Over <span className="text-luxury-gold font-bold">DD Cars</span></h2>
            <p className="text-gray-300 mb-6 leading-relaxed">
              DD Cars is gespecialiseerd in de verkoop van premium en exclusieve occasions. Met meer dan 15 jaar ervaring in de automotive sector, bieden wij alleen de beste voertuigen aan onze klanten.
            </p>
            <p className="text-gray-300 mb-8 leading-relaxed">
              Onze passie voor automobiele excellentie drijft ons om elke dag het beste te leveren. Van luxe sedans tot sportieve coupés, wij hebben de perfecte auto voor elke smaak en budget.
            </p>
            <div 
              ref={statsRef}
              className={`grid grid-cols-2 gap-6 transition-all duration-700 delay-200 ${statsFadeClass}`}
            >
              <div className="scale-on-hover">
                <h3 className="text-2xl font-bold text-luxury-gold mb-2">500+</h3>
                <p className="text-gray-400">Tevreden Klanten</p>
              </div>
              <div className="scale-on-hover">
                <h3 className="text-2xl font-bold text-luxury-gold mb-2">15+</h3>
                <p className="text-gray-400">Jaar Ervaring</p>
              </div>
            </div>
          </div>
          <div 
            ref={imageRef}
            className={`relative transition-all duration-700 delay-300 ${imageFadeClass}`}
          >
            <LazyImage
              src="https://images.unsplash.com/photo-1562911791-c7a97b729ec5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
              alt="Professional car dealership showroom"
              className="rounded-lg shadow-2xl w-full h-auto scale-on-hover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
