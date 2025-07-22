import { useFadeInOnScroll } from "@/hooks/useScrollAnimation";
import LazyImage from "@/components/LazyImage";
import customImage from "@assets/over_ons_hero_image.webp";

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
            <h2 className="text-4xl font-light mb-6"><span style={{color: '#D9C89E'}}>Over</span> <span className="font-bold" style={{color: '#D9C89E'}}>DD Cars</span></h2>
            <p className="mb-6 leading-relaxed" style={{color: '#D9C89E'}}>
              DD Cars is gespecialiseerd in betrouwbare occasions van Volkswagen. Met meer dan 15 jaar ervaring in de automotive sector, helpen wij klanten bij het vinden van kwalitatieve tweedehands auto's uit de periode 2014-2024.
            </p>
            <p className="mb-8 leading-relaxed" style={{color: '#D9C89E'}}>
              Van praktische Polo's tot sportieve Golf GTI's - wij bieden betaalbare en goed onderhouden voertuigen. Ons doel is om iedere klant een betrouwbare auto te leveren met een eerlijke prijs-kwaliteitverhouding.
            </p>
            <div 
              ref={statsRef}
              className={`grid grid-cols-2 gap-6 transition-all duration-700 delay-200 ${statsFadeClass}`}
            >
              <div className="scale-on-hover">
                <h3 className="text-2xl font-bold mb-2" style={{color: '#D9C89E'}}>500+</h3>
                <p style={{color: '#D9C89E'}}>Tevreden Klanten</p>
              </div>
              <div className="scale-on-hover">
                <h3 className="text-2xl font-bold mb-2" style={{color: '#D9C89E'}}>15+</h3>
                <p style={{color: '#D9C89E'}}>Jaar Ervaring</p>
              </div>
            </div>
          </div>
          <div 
            ref={imageRef}
            className={`relative transition-all duration-700 delay-300 ${imageFadeClass}`}
          >
            <LazyImage
              src={customImage}
              alt="DD Cars - Premium Auto Dealership"
              className="rounded-lg shadow-2xl w-full h-auto scale-on-hover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
