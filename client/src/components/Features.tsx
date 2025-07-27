import React from "react";
import { Shield, Handshake, Star } from "lucide-react";
import { useFadeInOnScroll } from "@/hooks/useScrollAnimation";

function FeatureCard({ feature, index }: { feature: any; index: number }) {
  const { elementRef, fadeInClass } = useFadeInOnScroll(0.2);
  
  return (
    <div 
      ref={elementRef}
      className={`text-center group transition-all duration-700 scale-on-hover ${fadeInClass}`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" style={{backgroundColor: '#D9C89E'}}>
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
    <section className="py-20 bg-dark-secondary">
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
