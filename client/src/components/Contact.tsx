import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { useFadeInOnScroll } from "@/hooks/useScrollAnimation";
import { apiRequest } from "@/lib/queryClient";
import type { InsertContact } from "@shared/schema";

export default function Contact() {
  const { elementRef: titleRef, fadeInClass: titleFadeClass } = useFadeInOnScroll(0.2);
  const { elementRef: contactInfoRef, fadeInClass: contactInfoFadeClass } = useFadeInOnScroll(0.2);
  const { elementRef: formRef, fadeInClass: formFadeClass } = useFadeInOnScroll(0.2);
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    message: ""
  });
  
  const { toast } = useToast();

  const contactMutation = useMutation({
    mutationFn: async (data: InsertContact) => {
      return await apiRequest("/api/contacts", {
        method: "POST",
        body: data
      });
    },
    onSuccess: () => {
      toast({
        title: "Bericht verzonden!",
        description: "Bedankt voor uw bericht. We nemen zo snel mogelijk contact met u op.",
      });
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        message: ""
      });
    },
    onError: () => {
      toast({
        title: "Fout bij verzenden",
        description: "Er is een fout opgetreden. Probeer het later opnieuw.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    contactMutation.mutate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <section id="contact" className="py-20 bg-dark-primary">
      <div className="container mx-auto px-4">
        <div 
          ref={titleRef}
          className={`text-center mb-16 transition-all duration-700 ${titleFadeClass}`}
        >
          <h2 className="text-4xl font-light mb-4"><span style={{color: '#D9C89E'}}>Neem</span> <span className="font-bold" style={{color: '#D9C89E'}}>Contact</span> <span style={{color: '#D9C89E'}}>Op</span></h2>
          <p className="max-w-2xl mx-auto" style={{color: '#D9C89E'}}>Heeft u vragen of wilt u meer informatie over een van onze voertuigen? Neem vandaag nog contact met ons op.</p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-12">
          <div 
            ref={contactInfoRef}
            className={`space-y-8 transition-all duration-700 delay-200 ${contactInfoFadeClass}`}
          >
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{backgroundColor: '#D9C89E'}}>
                <MapPin className="text-dark-primary" size={20} />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2" style={{color: '#D9C89E'}}>Adres</h3>
                <p style={{color: '#D9C89E'}}>
                  Koekoekslaan 1A<br />
                  1171PG Badhoevedorp<br />
                  Nederland
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{backgroundColor: '#D9C89E'}}>
                <Phone className="text-dark-primary" size={20} />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2" style={{color: '#D9C89E'}}>Telefoon</h3>
                <p style={{color: '#D9C89E'}}>06 15 40 41 04</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{backgroundColor: '#D9C89E'}}>
                <Mail className="text-dark-primary" size={20} />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2" style={{color: '#D9C89E'}}>E-mail</h3>
                <p style={{color: '#D9C89E'}}>DD.Cars@hotmail.nl</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{backgroundColor: '#D9C89E'}}>
                <Clock className="text-dark-primary" size={20} />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2" style={{color: '#D9C89E'}}>Openingstijden</h3>
                <p style={{color: '#D9C89E'}}>
                  Ma-Vr: 09:00 - 18:00<br />
                  Zat: 10:00 - 17:00<br />
                  Zon: Gesloten
                </p>
              </div>
            </div>
          </div>
          
          <Card 
            ref={formRef}
            className={`bg-dark-secondary border-dark-quaternary transition-all duration-700 delay-400 ${formFadeClass}`}
          >
            <CardContent className="p-8">
              <h3 className="text-2xl font-semibold mb-6" style={{color: '#D9C89E'}}>Stuur een bericht</h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    name="firstName"
                    placeholder="Voornaam"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className="bg-dark-tertiary border-dark-quaternary text-white placeholder:text-gray-400"
                    style={{"--tw-ring-color": "#D9C89E"}}
                    onFocus={(e) => e.target.style.borderColor = '#D9C89E'}
                    onBlur={(e) => e.target.style.borderColor = ''}
                  />
                  <Input
                    name="lastName"
                    placeholder="Achternaam"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    className="bg-dark-tertiary border-dark-quaternary text-white placeholder:text-gray-400"
                    style={{"--tw-ring-color": "#D9C89E"}}
                    onFocus={(e) => e.target.style.borderColor = '#D9C89E'}
                    onBlur={(e) => e.target.style.borderColor = ''}
                  />
                </div>
                <Input
                  name="email"
                  type="email"
                  placeholder="E-mailadres"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="bg-dark-tertiary border-dark-quaternary text-white placeholder:text-gray-400"
                  style={{"--tw-ring-color": "#D9C89E"}}
                  onFocus={(e) => e.target.style.borderColor = '#D9C89E'}
                  onBlur={(e) => e.target.style.borderColor = ''}
                />
                <Input
                  name="phone"
                  type="tel"
                  placeholder="Telefoonnummer"
                  value={formData.phone}
                  onChange={handleChange}
                  className="bg-dark-tertiary border-dark-quaternary text-white placeholder:text-gray-400"
                  style={{"--tw-ring-color": "#D9C89E"}}
                  onFocus={(e) => e.target.style.borderColor = '#D9C89E'}
                  onBlur={(e) => e.target.style.borderColor = ''}
                />
                <Textarea
                  name="message"
                  placeholder="Bericht"
                  rows={4}
                  value={formData.message}
                  onChange={handleChange}
                  required
                  className="bg-dark-tertiary border-dark-quaternary text-white placeholder:text-gray-400 resize-none"
                  style={{"--tw-ring-color": "#D9C89E"}}
                  onFocus={(e) => e.target.style.borderColor = '#D9C89E'}
                  onBlur={(e) => e.target.style.borderColor = ''}
                />
                <Button 
                  type="submit"
                  disabled={contactMutation.isPending}
                  className="luxury-button w-full font-semibold hover:bg-white"
                  style={{backgroundColor: '#D9C89E', color: '#1a1a1a'}}
                >
                  {contactMutation.isPending ? "Bezig met verzenden..." : "Verstuur Bericht"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
