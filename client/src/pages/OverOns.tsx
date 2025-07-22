import { Star, Award, Shield, CheckCircle, Users, Heart } from "lucide-react";

export default function OverOns() {
  const teamMembers = [
    {
      name: "Dennis van der Berg",
      role: "Oprichter & CEO",
      image: "/api/placeholder/300/300",
      description: "25 jaar ervaring in de automotive industrie"
    },
    {
      name: "David Hendriks",
      role: "Senior Sales Manager",
      image: "/api/placeholder/300/300", 
      description: "Expert in premium voertuigen"
    },
    {
      name: "Sandra Jansen",
      role: "Customer Relations Manager",
      image: "/api/placeholder/300/300",
      description: "Zorgt voor uitzonderlijke klantservice"
    }
  ];

  const testimonials = [
    {
      name: "Robert van Dijk",
      location: "Amsterdam",
      rating: 5,
      text: "Uitstekende service en een fantastische BMW gekocht. Het team van DD Cars denkt echt mee en zorgt voor een zorgeloze ervaring.",
      vehicle: "BMW 5 Serie"
    },
    {
      name: "Marie Bakker",
      location: "Utrecht", 
      rating: 5,
      text: "Professioneel, transparant en eerlijk. Precies wat je verwacht van een premium autodealership. Mijn Mercedes is perfect!",
      vehicle: "Mercedes C-Klasse"
    },
    {
      name: "Tom Wessels",
      location: "Rotterdam",
      rating: 5,
      text: "DD Cars heeft mij geholpen met het vinden van mijn droomauto. Persoonlijke aandacht en uitstekende nazorg. Zeer aan te bevelen!",
      vehicle: "Audi A6"
    }
  ];

  const partners = [
    { name: "Autotrust", logo: "/api/placeholder/150/80" },
    { name: "NAP", logo: "/api/placeholder/150/80" },
    { name: "BOVAG", logo: "/api/placeholder/150/80" },
    { name: "RDC", logo: "/api/placeholder/150/80" }
  ];

  const values = [
    {
      icon: Heart,
      title: "Passie voor Exclusiviteit",
      description: "Elk voertuig wordt met liefde geselecteerd. Wij geloven dat een auto meer is dan vervoer - het is een statement van wie je bent."
    },
    {
      icon: Award,
      title: "Jarenlange Ervaring",
      description: "Met meer dan 25 jaar ervaring in de automotive industrie kennen wij de markt als geen ander en weten wat kwaliteit betekent."
    },
    {
      icon: CheckCircle,
      title: "Persoonlijke Selectie",
      description: "Elk voertuig in ons aanbod wordt persoonlijk door ons team geselecteerd op basis van strikte kwaliteitseisen en unieke eigenschappen."
    },
    {
      icon: Shield,
      title: "Transparantie & Betrouwbaarheid",
      description: "Complete openheid over de historie en staat van elk voertuig. Wat u ziet is wat u krijgt - zonder verrassingen."
    }
  ];

  return (
    <div className="min-h-screen bg-dark-primary text-white">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-dark-primary via-dark-secondary to-dark-primary"></div>
        <div className="absolute inset-0 bg-[url('/assets/over_ons_hero_image.webp')] bg-cover bg-center opacity-20"></div>
        
        <div className="relative z-10 text-center max-w-4xl px-4">
          <h1 className="text-5xl md:text-7xl font-light mb-6 leading-tight">
            Ons <span className="text-luxury-gold font-bold">Verhaal</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
            Waar passie voor exclusieve auto's samenvalt met jarenlange ervaring en onwankelbare betrouwbaarheid
          </p>
          <div className="w-20 h-1 bg-luxury-gold mx-auto"></div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-dark-secondary">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-light mb-8">Onze <span className="text-luxury-gold font-bold">Missie</span></h2>
            <p className="text-xl text-gray-300 leading-relaxed mb-12">
              Bij DD Cars geloven we dat de perfecte auto meer is dan alleen vervoer. Het is een verlengstuk van je persoonlijkheid, 
              een statement van je smaak en een investering in kwaliteit. Onze missie is om elke klant te verbinden met het voertuig 
              dat perfect past bij hun leven, dromen en ambities.
            </p>
            <div className="grid md:grid-cols-2 gap-8 text-left">
              <div className="p-6 bg-dark-primary rounded-lg border border-dark-quaternary">
                <h3 className="text-2xl font-semibold mb-4 text-luxury-gold">Onze Visie</h3>
                <p className="text-gray-300 leading-relaxed">
                  Wij streven ernaar de meest vertrouwde naam te zijn in premium occasions, waar elke transactie 
                  gebaseerd is op eerlijkheid, expertise en echte zorg voor onze klanten.
                </p>
              </div>
              <div className="p-6 bg-dark-primary rounded-lg border border-dark-quaternary">
                <h3 className="text-2xl font-semibold mb-4 text-luxury-gold">Onze Waarden</h3>
                <p className="text-gray-300 leading-relaxed">
                  Integriteit, kwaliteit en persoonlijke service staan centraal in alles wat we doen. 
                  Elke klant verdient een uitzonderlijke ervaring en een voertuig dat hun verwachtingen overtreft.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-dark-primary">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-light mb-4">Wat Ons <span className="text-luxury-gold font-bold">Onderscheidt</span></h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Onze kernwaarden vormen de basis van elke interactie en elke transactie
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="text-center group">
                <div className="w-16 h-16 bg-luxury-gold rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <value.icon className="text-dark-primary" size={28} />
                </div>
                <h3 className="text-xl font-semibold mb-4">{value.title}</h3>
                <p className="text-gray-400 leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-dark-secondary">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-light mb-4">Ons <span className="text-luxury-gold font-bold">Team</span></h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Ontmoet de mensen achter DD Cars - experts met een gedeelde passie voor uitstekende service
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <div key={index} className="text-center group">
                <div className="relative mb-6 overflow-hidden rounded-lg">
                  <img 
                    src={member.image} 
                    alt={member.name}
                    className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-primary/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <h3 className="text-2xl font-semibold mb-2">{member.name}</h3>
                <p className="text-luxury-gold font-medium mb-3">{member.role}</p>
                <p className="text-gray-400">{member.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-dark-primary">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-light mb-4">Wat Onze <span className="text-luxury-gold font-bold">Klanten</span> Zeggen</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Echte verhalen van tevreden klanten die hun droomauto hebben gevonden
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-dark-secondary p-8 rounded-lg border border-dark-quaternary hover:border-luxury-gold/30 transition-colors duration-300">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} size={16} className="text-luxury-gold fill-current" />
                  ))}
                </div>
                <p className="text-gray-300 italic mb-6 leading-relaxed">"{testimonial.text}"</p>
                <div className="border-t border-dark-quaternary pt-4">
                  <p className="font-semibold text-white">{testimonial.name}</p>
                  <p className="text-gray-400 text-sm">{testimonial.location}</p>
                  <p className="text-luxury-gold text-sm font-medium">{testimonial.vehicle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section className="py-20 bg-dark-secondary">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-light mb-4">Onze <span className="text-luxury-gold font-bold">Partners</span></h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Samenwerking met vertrouwde organisaties voor uw zekerheid en gemoedsrust
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
            {partners.map((partner, index) => (
              <div key={index} className="text-center group">
                <div className="bg-white rounded-lg p-4 group-hover:shadow-lg transition-shadow duration-300">
                  <img 
                    src={partner.logo} 
                    alt={partner.name}
                    className="w-full h-12 object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300"
                  />
                </div>
                <p className="text-gray-400 text-sm mt-2">{partner.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-dark-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-light mb-6">Klaar om Uw <span className="text-luxury-gold font-bold">Droomauto</span> te Vinden?</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Laat ons u helpen bij het vinden van het perfecte voertuig. Neem vandaag nog contact met ons op.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => window.location.href = '/aanbod'}
              className="bg-luxury-gold hover:bg-luxury-gold/90 text-dark-primary font-semibold px-8 py-3 rounded-lg transition-colors duration-300"
            >
              Bekijk Ons Aanbod
            </button>
            <button 
              onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
              className="border border-luxury-gold text-luxury-gold hover:bg-luxury-gold hover:text-dark-primary font-semibold px-8 py-3 rounded-lg transition-colors duration-300"
            >
              Neem Contact Op
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}