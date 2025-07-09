import { Shield, Handshake, Star } from "lucide-react";

export default function Features() {
  const features = [
    {
      icon: Shield,
      title: "Kwaliteitsgarantie",
      description: "Alle voertuigen worden grondig gecontroleerd door onze gecertificeerde technici."
    },
    {
      icon: Handshake,
      title: "Persoonlijke Service",
      description: "Onze experts helpen u bij het vinden van uw perfecte droomauto."
    },
    {
      icon: Star,
      title: "Premium Selectie",
      description: "Exclusieve collectie van premium en luxe voertuigen."
    }
  ];

  return (
    <section className="py-20 bg-dark-secondary">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="text-center group">
              <div className="w-16 h-16 bg-luxury-gold rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="text-dark-primary" size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
