import customImage from "@assets/over_ons_hero_image.webp";

export default function About() {

  return (
    <section id="over-ons" className="py-20 bg-dark-secondary">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-light mb-6"><span style={{color: '#D9C89E'}}>Over</span> <span className="font-bold" style={{color: '#D9C89E'}}>DD Cars</span></h2>
            <p className="mb-6 leading-relaxed" style={{color: '#D9C89E'}}>
              DD Cars is gespecialiseerd in betrouwbare occasions van verschillende merken. Met meer dan 15 jaar ervaring in de automotive sector, helpen wij klanten bij het vinden van kwalitatieve tweedehands auto's.
            </p>
            <p className="mb-8 leading-relaxed" style={{color: '#D9C89E'}}>
              Van praktische Opel's tot sportieve Audi's - wij bieden betaalbare en goed onderhouden voertuigen. Ons doel is om iedere klant een betrouwbare auto te leveren met een eerlijke prijs-kwaliteitverhouding.
            </p>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-2xl font-bold mb-2" style={{color: '#D9C89E'}}>500+</h3>
                <p style={{color: '#D9C89E'}}>Tevreden Klanten</p>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2" style={{color: '#D9C89E'}}>15+</h3>
                <p style={{color: '#D9C89E'}}>Jaar Ervaring</p>
              </div>
            </div>
          </div>
          <div className="relative">
            <img
              src={customImage}
              alt="DD Cars - Betrouwbare Occasions"
              className="w-full rounded-lg shadow-2xl"
              loading="lazy"
              decoding="async"
              width="600"
              height="400"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
