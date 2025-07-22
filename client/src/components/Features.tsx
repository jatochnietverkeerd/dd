import { Shield, Handshake, Star } from "lucide-react";

function FeatureCard({ feature, index }: { feature: any; index: number }) {
  return (
    <div className="text-center">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{backgroundColor: '#D9C89E'}}>
        <feature.icon className="text-dark-primary" size={24} />
      </div>
      <h3 className="text-xl font-semibold mb-2" style={{color: '#D9C89E'}}>{feature.title}</h3>
      <p style={{color: '#D9C89E'}}>{feature.description}</p>
    </div>
  );
}

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
      description: "Onze experts helpen u bij het vinden van de juiste auto voor uw budget."
    },
    {
      icon: Star,
      title: "Betrouwbare Selectie",
      description: "Zorgvuldig geselecteerde occasions van verschillende merken."
    }
  ];

  return (
    <section className="py-20 bg-slate-800">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
