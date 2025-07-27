import React, { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Calendar, 
  Gauge, 
  Fuel, 
  Zap, 
  Settings, 
  Palette, 
  CreditCard,
  ShieldCheck,
  FileText,
  Wrench,
  Star,
  Play,
  RotateCcw,
  Phone,
  Heart
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ReservationForm from "@/components/ReservationForm";
import type { Vehicle } from "@shared/schema";
import { generateStructuredData } from "@shared/utils";

export default function VehicleDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [showReservationForm, setShowReservationForm] = useState(false);

  const { data: vehicle, isLoading } = useQuery<Vehicle>({
    queryKey: ['/api/vehicles/slug', slug],
    queryFn: async () => {
      const response = await fetch(`/api/vehicles/slug/${slug}`);
      if (!response.ok) {
        throw new Error('Vehicle not found');
      }
      return response.json();
    },
    enabled: !!slug,
  });

  // Update page title and meta tags when vehicle data is loaded
  useEffect(() => {
    if (vehicle) {
      document.title = vehicle.metaTitle || `${vehicle.brand} ${vehicle.model} ${vehicle.year} | DD Cars`;
      
      // Update meta description
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', vehicle.metaDescription || `${vehicle.brand} ${vehicle.model} ${vehicle.year} te koop bij DD Cars`);
      }

      // Update Open Graph tags
      const ogTitle = document.querySelector('meta[property="og:title"]');
      const ogDescription = document.querySelector('meta[property="og:description"]');
      const ogImage = document.querySelector('meta[property="og:image"]');

      if (ogTitle) ogTitle.setAttribute('content', vehicle.metaTitle || `${vehicle.brand} ${vehicle.model} ${vehicle.year}`);
      if (ogDescription) ogDescription.setAttribute('content', vehicle.metaDescription || `${vehicle.brand} ${vehicle.model} ${vehicle.year} te koop bij DD Cars`);
      if (ogImage && vehicle.images?.[0]) ogImage.setAttribute('content', vehicle.images?.[0]);

      // Add structured data for SEO
      const structuredData = generateStructuredData(vehicle);
      const existingScript = document.querySelector('script[type="application/ld+json"][data-vehicle="true"]');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
      
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-vehicle', 'true');
      script.textContent = JSON.stringify(structuredData);
      document.head.appendChild(script);

      return () => {
        const scriptToRemove = document.querySelector('script[type="application/ld+json"][data-vehicle="true"]');
        if (scriptToRemove) {
          document.head.removeChild(scriptToRemove);
        }
      };
    }
  }, [vehicle]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatMileage = (mileage: number) => {
    return new Intl.NumberFormat('nl-NL').format(mileage);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-primary">
        <Header />
        <div className="pt-20 pb-16">
          <div className="container mx-auto px-4">
            <Skeleton className="h-8 w-32 mb-8 bg-dark-tertiary" />
            <div className="grid lg:grid-cols-2 gap-12 mb-12">
              <div>
                <Skeleton className="w-full h-96 bg-dark-tertiary rounded-lg" />
              </div>
              <div>
                <Skeleton className="h-12 w-3/4 mb-4 bg-dark-tertiary" />
                <Skeleton className="h-8 w-1/2 mb-6 bg-dark-tertiary" />
                <Skeleton className="h-16 w-full bg-dark-tertiary" />
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-dark-primary">
        <Header />
        <div className="pt-20 pb-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl font-light mb-4">Voertuig niet gevonden</h1>
            <p className="text-gray-400 mb-8">Het voertuig dat u zoekt bestaat niet of is niet meer beschikbaar.</p>
            <Link href="/aanbod">
              <Button className="bg-luxury-gold text-dark-primary hover:bg-white transition-colors duration-300">
                Terug naar aanbod
              </Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const images = vehicle.images || [];

  return (
    <div className="min-h-screen bg-dark-primary">
      <Header />
      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          {/* Back button */}
          <div className="mb-8">
            <Link href="/aanbod">
              <Button variant="outline" className="border-luxury-gold text-luxury-gold hover:bg-luxury-gold hover:text-dark-primary transition-colors duration-300">
                <ArrowLeft size={16} className="mr-2" />
                Terug naar aanbod
              </Button>
            </Link>
          </div>

          {/* Main content */}
          <div className="grid lg:grid-cols-2 gap-12 mb-12">
            {/* Images */}
            <div>
              <div className="relative mb-4">
                {images.length > 0 ? (
                  <img
                    src={images[currentImageIndex]}
                    alt={`${vehicle.brand} ${vehicle.model}`}
                    className="w-full h-96 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity duration-300"
                    onClick={() => setIsImageModalOpen(true)}
                  />
                ) : (
                  <div className="w-full h-96 bg-dark-tertiary flex items-center justify-center rounded-lg">
                    <div className="text-center">
                      <div className="text-6xl mb-4" style={{color: '#D9C89E'}}>📷</div>
                      <p className="text-xl" style={{color: '#D9C89E'}}>Geen afbeeldingen beschikbaar</p>
                    </div>
                  </div>
                )}
                {vehicle.featured && (
                  <Badge className="absolute top-4 left-4 bg-luxury-gold text-dark-primary font-semibold">
                    Featured
                  </Badge>
                )}
              </div>
              
              {/* Thumbnail navigation */}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {images.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`${vehicle.brand} ${vehicle.model} - ${index + 1}`}
                      className={`w-20 h-20 object-cover rounded cursor-pointer transition-all duration-300 ${
                        index === currentImageIndex 
                          ? 'ring-2 ring-luxury-gold opacity-100' 
                          : 'opacity-60 hover:opacity-100'
                      }`}
                      onClick={() => setCurrentImageIndex(index)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Vehicle info */}
            <div>
              <h1 className="text-4xl font-light mb-2">
                {vehicle.brand} <span className="text-luxury-gold font-bold">{vehicle.model}</span>
              </h1>
              <div className="text-gray-400 mb-6 whitespace-pre-line leading-relaxed">
                {vehicle.description}
              </div>
              
              <div className="text-3xl font-bold text-luxury-gold mb-6">
                {formatPrice(parseFloat(vehicle.price))}
              </div>

              {/* Quick specs */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="flex items-center text-gray-300">
                  <Calendar size={16} className="mr-2 text-luxury-gold" />
                  {vehicle.year}
                </div>
                <div className="flex items-center text-gray-300">
                  <Gauge size={16} className="mr-2 text-luxury-gold" />
                  {formatMileage(vehicle.mileage)} km
                </div>
                <div className="flex items-center text-gray-300">
                  <Fuel size={16} className="mr-2 text-luxury-gold" />
                  {vehicle.fuel}
                </div>
                <div className="flex items-center text-gray-300">
                  <Settings size={16} className="mr-2 text-luxury-gold" />
                  {vehicle.transmission}
                </div>
                <div className="flex items-center text-gray-300">
                  <Palette size={16} className="mr-2 text-luxury-gold" />
                  {vehicle.color}
                </div>
                {vehicle.power && (
                  <div className="flex items-center text-gray-300">
                    <Zap size={16} className="mr-2 text-luxury-gold" />
                    {vehicle.power}
                  </div>
                )}
              </div>

              {/* CTA buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button className="bg-luxury-gold text-dark-primary hover:bg-white transition-colors duration-300 font-semibold px-8 py-3">
                  <CreditCard size={16} className="mr-2" />
                  Reserveer deze auto
                </Button>
                <Button 
                  variant="outline" 
                  className="border-luxury-gold text-luxury-gold hover:bg-luxury-gold hover:text-dark-primary transition-colors duration-300"
                  onClick={() => window.open('https://wa.me/31615404104?text=Hallo%20DD%20Cars%2C%20ik%20heb%20interesse%20in%20deze%20auto', '_blank')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="mr-2">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.488"/>
                  </svg>
                  WhatsApp info
                </Button>
                <Button variant="outline" className="border-gray-600 text-gray-400 hover:bg-gray-600 hover:text-white transition-colors duration-300">
                  <Heart size={16} className="mr-2" />
                  Bewaren
                </Button>
              </div>
            </div>
          </div>

          {/* Detailed information tabs */}
          <div className="mb-12">
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 bg-dark-secondary">
                <TabsTrigger value="details" className="data-[state=active]:bg-luxury-gold data-[state=active]:text-dark-primary">
                  Details
                </TabsTrigger>
                <TabsTrigger value="story" className="data-[state=active]:bg-luxury-gold data-[state=active]:text-dark-primary">
                  Het Verhaal
                </TabsTrigger>
                <TabsTrigger value="media" className="data-[state=active]:bg-luxury-gold data-[state=active]:text-dark-primary">
                  Media
                </TabsTrigger>
                <TabsTrigger value="inspection" className="data-[state=active]:bg-luxury-gold data-[state=active]:text-dark-primary">
                  Inspectie
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="bg-dark-secondary border-dark-quaternary">
                    <CardHeader>
                      <CardTitle className="flex items-center text-luxury-gold">
                        <Settings size={20} className="mr-2" />
                        Technische Specificaties
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Merk</span>
                        <span className="text-white">{vehicle.brand}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Model</span>
                        <span className="text-white">{vehicle.model}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Bouwjaar</span>
                        <span className="text-white">{vehicle.year}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Kilometerstand</span>
                        <span className="text-white">{formatMileage(vehicle.mileage)} km</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Brandstof</span>
                        <span className="text-white">{vehicle.fuel}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Transmissie</span>
                        <span className="text-white">{vehicle.transmission}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Kleur</span>
                        <span className="text-white">{vehicle.color}</span>
                      </div>
                      {vehicle.power && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Vermogen</span>
                          <span className="text-white">{vehicle.power}</span>
                        </div>
                      )}
                      {vehicle.chassisNumber && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Chassisnummer</span>
                          <span className="text-white font-mono text-sm">{vehicle.chassisNumber}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-dark-secondary border-dark-quaternary">
                    <CardHeader>
                      <CardTitle className="flex items-center text-luxury-gold">
                        <Star size={20} className="mr-2" />
                        Opties & Uitrusting
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {vehicle.options && vehicle.options.length > 0 ? (
                        <div className="grid grid-cols-1 gap-2">
                          {vehicle.options.map((option, index) => (
                            <div key={index} className="flex items-center">
                              <div className="w-2 h-2 bg-luxury-gold rounded-full mr-3"></div>
                              <span className="text-gray-300">{option}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-400">Geen specifieke opties vermeld</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="story">
                <Card className="bg-dark-secondary border-dark-quaternary">
                  <CardHeader>
                    <CardTitle className="flex items-center text-luxury-gold">
                      <FileText size={20} className="mr-2" />
                      Het Verhaal van deze Auto
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-invert max-w-none">
                      <div 
                        className="text-gray-300 leading-relaxed"
                        dangerouslySetInnerHTML={{ 
                          __html: (vehicle.description || "Geen beschrijving beschikbaar.")
                            .replace(/\*\*(.*?)\*\*/g, '<h3 class="text-luxury-gold font-semibold text-lg mb-3 mt-6">$1</h3>')
                            .replace(/^• (.+)$/gm, '<div class="flex items-start mb-2"><span class="text-luxury-gold mr-2 mt-1">•</span><span>$1</span></div>')
                            .replace(/\n\n/g, '<div class="mb-4"></div>')
                            .replace(/\n/g, '<br>')
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="media" className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {vehicle.videoUrl && (
                    <Card className="bg-dark-secondary border-dark-quaternary">
                      <CardHeader>
                        <CardTitle className="flex items-center text-luxury-gold">
                          <Play size={20} className="mr-2" />
                          Video
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="aspect-video">
                          <iframe
                            src={vehicle.videoUrl}
                            title={`${vehicle.brand} ${vehicle.model} Video`}
                            className="w-full h-full rounded-lg"
                            allowFullScreen
                          ></iframe>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {vehicle.view360Url && (
                    <Card className="bg-dark-secondary border-dark-quaternary">
                      <CardHeader>
                        <CardTitle className="flex items-center text-luxury-gold">
                          <RotateCcw size={20} className="mr-2" />
                          360° Viewer
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="aspect-video bg-dark-tertiary rounded-lg flex items-center justify-center">
                          <div className="text-center">
                            <RotateCcw size={48} className="mx-auto mb-4 text-luxury-gold" />
                            <p className="text-gray-400">360° viewer wordt geladen...</p>
                            <p className="text-sm text-gray-500 mt-2">
                              URL: {vehicle.view360Url}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="inspection" className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="bg-dark-secondary border-dark-quaternary">
                    <CardHeader>
                      <CardTitle className="flex items-center text-luxury-gold">
                        <ShieldCheck size={20} className="mr-2" />
                        NAP Check
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-300">
                        {vehicle.napCheck || "NAP check informatie niet beschikbaar"}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-dark-secondary border-dark-quaternary">
                    <CardHeader>
                      <CardTitle className="flex items-center text-luxury-gold">
                        <FileText size={20} className="mr-2" />
                        Inspectierapport
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-300">
                        {vehicle.inspectionReport || "Inspectierapport niet beschikbaar"}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-dark-secondary border-dark-quaternary md:col-span-2">
                    <CardHeader>
                      <CardTitle className="flex items-center text-luxury-gold">
                        <Wrench size={20} className="mr-2" />
                        Onderhoudshistorie
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-300">
                        {vehicle.maintenanceHistory || "Onderhoudshistorie niet beschikbaar"}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Reservation Section */}
          {showReservationForm ? (
            <div className="mb-12">
              <ReservationForm 
                vehicleId={vehicle.id}
                vehicleBrand={vehicle.brand}
                vehicleModel={vehicle.model}
                vehiclePrice={parseFloat(vehicle.price)}
                onSuccess={() => setShowReservationForm(false)}
              />
            </div>
          ) : (
            <Card className="bg-dark-secondary border-dark-quaternary mb-12">
              <CardContent className="p-8 text-center">
                <h3 className="text-2xl font-light mb-4">
                  Reserveer deze <span className="text-luxury-gold font-bold">{vehicle.brand} {vehicle.model}</span>
                </h3>
                <p className="text-gray-400 mb-6">
                  Zeker van uw keuze? Reserveer nu voor €500. De auto blijft 72 uur voor u gereserveerd.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    onClick={() => setShowReservationForm(true)}
                    className="bg-luxury-gold text-dark-primary hover:bg-white transition-colors duration-300 font-semibold px-8 py-3"
                  >
                    <CreditCard size={16} className="mr-2" />
                    Reserveer nu voor €500
                  </Button>
                  <Button variant="outline" className="border-luxury-gold text-luxury-gold hover:bg-luxury-gold hover:text-dark-primary transition-colors duration-300">
                    <Heart size={16} className="mr-2" />
                    Toevoegen aan favorieten
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Contact CTA */}
          <Card className="bg-dark-secondary border-dark-quaternary">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-light mb-4">
                Vragen over deze <span className="text-luxury-gold font-bold">{vehicle.brand} {vehicle.model}</span>?
              </h3>
              <p className="text-gray-400 mb-6">
                Neem contact met ons op voor meer informatie of een proefrit.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  className="bg-luxury-gold text-dark-primary hover:bg-white transition-colors duration-300 font-semibold px-8 py-3"
                  onClick={() => window.open('https://wa.me/31615404104?text=Hallo%20DD%20Cars%2C%20ik%20wil%20graag%20meer%20informatie%20over%20deze%20auto', '_blank')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="mr-2">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.488"/>
                  </svg>
                  WhatsApp: +31 6 15 40 41 04
                </Button>
                <Button 
                  variant="outline" 
                  className="border-luxury-gold text-luxury-gold hover:bg-luxury-gold hover:text-dark-primary transition-colors duration-300"
                  onClick={() => window.open('tel:+31615404104', '_self')}
                >
                  <Phone size={16} className="mr-2" />
                  Bel voor proefrit
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}