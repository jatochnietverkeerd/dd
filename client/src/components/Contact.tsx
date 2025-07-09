import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { InsertContact } from "@shared/schema";

export default function Contact() {
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
        <div className="text-center mb-16">
          <h2 className="text-4xl font-light mb-4">Neem <span className="text-luxury-gold font-bold">Contact</span> Op</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">Heeft u vragen of wilt u meer informatie over een van onze voertuigen? Neem vandaag nog contact met ons op.</p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-12">
          <div className="space-y-8">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-luxury-gold rounded-full flex items-center justify-center flex-shrink-0">
                <MapPin className="text-dark-primary" size={20} />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Adres</h3>
                <p className="text-gray-400">
                  Hoofdstraat 123<br />
                  1234 AB Amsterdam<br />
                  Nederland
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-luxury-gold rounded-full flex items-center justify-center flex-shrink-0">
                <Phone className="text-dark-primary" size={20} />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Telefoon</h3>
                <p className="text-gray-400">+31 20 123 4567</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-luxury-gold rounded-full flex items-center justify-center flex-shrink-0">
                <Mail className="text-dark-primary" size={20} />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">E-mail</h3>
                <p className="text-gray-400">info@ddcars.nl</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-luxury-gold rounded-full flex items-center justify-center flex-shrink-0">
                <Clock className="text-dark-primary" size={20} />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Openingstijden</h3>
                <p className="text-gray-400">
                  Ma-Vr: 09:00 - 18:00<br />
                  Zat: 10:00 - 17:00<br />
                  Zon: Gesloten
                </p>
              </div>
            </div>
          </div>
          
          <Card className="bg-dark-secondary border-dark-quaternary">
            <CardContent className="p-8">
              <h3 className="text-2xl font-semibold mb-6">Stuur een bericht</h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    name="firstName"
                    placeholder="Voornaam"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className="bg-dark-tertiary border-dark-quaternary focus:border-luxury-gold text-white placeholder:text-gray-400"
                  />
                  <Input
                    name="lastName"
                    placeholder="Achternaam"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    className="bg-dark-tertiary border-dark-quaternary focus:border-luxury-gold text-white placeholder:text-gray-400"
                  />
                </div>
                <Input
                  name="email"
                  type="email"
                  placeholder="E-mailadres"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="bg-dark-tertiary border-dark-quaternary focus:border-luxury-gold text-white placeholder:text-gray-400"
                />
                <Input
                  name="phone"
                  type="tel"
                  placeholder="Telefoonnummer"
                  value={formData.phone}
                  onChange={handleChange}
                  className="bg-dark-tertiary border-dark-quaternary focus:border-luxury-gold text-white placeholder:text-gray-400"
                />
                <Textarea
                  name="message"
                  placeholder="Bericht"
                  rows={4}
                  value={formData.message}
                  onChange={handleChange}
                  required
                  className="bg-dark-tertiary border-dark-quaternary focus:border-luxury-gold text-white placeholder:text-gray-400 resize-none"
                />
                <Button 
                  type="submit"
                  disabled={contactMutation.isPending}
                  className="w-full bg-luxury-gold text-dark-primary hover:bg-white transition-colors duration-300 font-semibold"
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
