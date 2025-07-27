import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Gauge, Fuel, Calendar, Euro } from "lucide-react";
import { Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import type { Vehicle } from "@shared/schema";

export default function Aanbod() {
  const [searchTerm, setSearchTerm] = useState("");
  const [brandFilter, setBrandFilter] = useState("all");
  const [fuelFilter, setFuelFilter] = useState("all");
  const [sortBy, setSortBy] = useState("price-asc");

  const { data: vehicles, isLoading } = useQuery<Vehicle[]>({
    queryKey: ['/api/vehicles'],
  });

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

  // Filter and sort vehicles
  const filteredVehicles = vehicles?.filter(vehicle => {
    const matchesSearch = vehicle.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vehicle.model.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBrand = brandFilter === "all" || vehicle.brand === brandFilter;
    const matchesFuel = fuelFilter === "all" || (vehicle.fuel && vehicle.fuel === fuelFilter);
    
    return matchesSearch && matchesBrand && matchesFuel && (vehicle.available !== false) && vehicle.status !== 'gearchiveerd';
  }).sort((a, b) => {
    switch (sortBy) {
      case "price-asc":
        return a.price - b.price;
      case "price-desc":
        return b.price - a.price;
      case "year-desc":
        return b.year - a.year;
      case "year-asc":
        return a.year - b.year;
      case "mileage-asc":
        return a.mileage - b.mileage;
      case "mileage-desc":
        return b.mileage - a.mileage;
      default:
        return 0;
    }
  });

  const uniqueBrands = [...new Set(vehicles?.map(v => v.brand) || [])];
  const uniqueFuels = [...new Set(vehicles?.map(v => v.fuel).filter(f => f && f.trim()) || [])];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-primary">
        <Header />
        <div className="pt-20 pb-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-light mb-4">Ons <span className="text-luxury-gold font-bold">Aanbod</span></h1>
              <p className="text-gray-400 max-w-2xl mx-auto">Ontdek onze volledige collectie van premium occasions</p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} className="bg-dark-secondary rounded-lg overflow-hidden">
                  <Skeleton className="w-full h-48 bg-dark-tertiary" />
                  <div className="p-6">
                    <Skeleton className="h-6 w-3/4 mb-2 bg-dark-tertiary" />
                    <Skeleton className="h-4 w-1/2 mb-4 bg-dark-tertiary" />
                    <Skeleton className="h-5 w-20 mb-4 bg-dark-tertiary" />
                    <Skeleton className="h-10 w-full bg-dark-tertiary" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-primary">
      <Header />
      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-light mb-4">Ons <span className="text-luxury-gold font-bold">Aanbod</span></h1>
            <p className="text-gray-400 max-w-2xl mx-auto">Ontdek onze volledige collectie van premium occasions. Elk voertuig is zorgvuldig geselecteerd en gecontroleerd.</p>
          </div>

          {/* Filters */}
          <div className="bg-dark-secondary rounded-lg p-6 mb-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  placeholder="Zoek merk of model..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-dark-tertiary border-dark-quaternary focus:border-luxury-gold text-white placeholder:text-gray-400"
                />
              </div>
              
              <Select value={brandFilter} onValueChange={setBrandFilter}>
                <SelectTrigger className="bg-dark-tertiary border-dark-quaternary text-white">
                  <SelectValue placeholder="Merk" />
                </SelectTrigger>
                <SelectContent className="bg-dark-tertiary border-dark-quaternary">
                  <SelectItem value="all">Alle merken</SelectItem>
                  {uniqueBrands.filter(brand => brand && brand.trim()).map(brand => (
                    <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={fuelFilter} onValueChange={setFuelFilter}>
                <SelectTrigger className="bg-dark-tertiary border-dark-quaternary text-white">
                  <SelectValue placeholder="Brandstof" />
                </SelectTrigger>
                <SelectContent className="bg-dark-tertiary border-dark-quaternary">
                  <SelectItem value="all">Alle brandstoffen</SelectItem>
                  {uniqueFuels.filter(fuel => fuel && fuel.trim()).map(fuel => (
                    <SelectItem key={fuel} value={fuel}>{fuel}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="bg-dark-tertiary border-dark-quaternary text-white">
                  <SelectValue placeholder="Sorteren" />
                </SelectTrigger>
                <SelectContent className="bg-dark-tertiary border-dark-quaternary">
                  <SelectItem value="price-asc">Prijs: laag → hoog</SelectItem>
                  <SelectItem value="price-desc">Prijs: hoog → laag</SelectItem>
                  <SelectItem value="year-desc">Jaar: nieuw → oud</SelectItem>
                  <SelectItem value="year-asc">Jaar: oud → nieuw</SelectItem>
                  <SelectItem value="mileage-asc">Km-stand: laag → hoog</SelectItem>
                  <SelectItem value="mileage-desc">Km-stand: hoog → laag</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setBrandFilter("all");
                  setFuelFilter("all");
                  setSortBy("price-asc");
                }}
                className="border-luxury-gold text-luxury-gold hover:bg-luxury-gold hover:text-dark-primary transition-colors duration-300"
              >
                <Filter size={16} className="mr-2" />
                Filters wissen
              </Button>
            </div>
          </div>

          {/* Results count */}
          <div className="mb-6">
            <p className="text-gray-400">
              {filteredVehicles?.length || 0} voertuigen gevonden
            </p>
          </div>

          {/* Vehicle grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredVehicles?.map((vehicle) => (
              <Card key={vehicle.id} className="bg-dark-secondary border-dark-quaternary rounded-lg overflow-hidden group hover:transform hover:scale-105 hover:shadow-2xl transition-all duration-500">
                <div className="relative overflow-hidden">
                  {vehicle.images && vehicle.images.length > 0 ? (
                    <img 
                      src={vehicle.images[0]} 
                      alt={`${vehicle.brand} ${vehicle.model}`} 
                      className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-48 bg-dark-tertiary flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-4xl mb-2" style={{color: '#D9C89E'}}>📷</div>
                        <p className="text-sm" style={{color: '#D9C89E'}}>Geen afbeelding beschikbaar</p>
                      </div>
                    </div>
                  )}
                  {vehicle.featured && (
                    <Badge className="absolute top-3 left-3 bg-luxury-gold text-dark-primary font-semibold">
                      Featured
                    </Badge>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-primary/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-semibold text-white group-hover:text-luxury-gold transition-colors duration-300">
                      {vehicle.brand}
                    </h3>
                    <span className="text-sm text-gray-500 flex items-center">
                      <Calendar size={12} className="mr-1" />
                      {vehicle.year}
                    </span>
                  </div>
                  
                  <p className="text-gray-400 mb-4 font-medium">{vehicle.model}</p>
                  
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-luxury-gold font-bold text-lg flex items-center">
                      <Euro size={16} className="mr-1" />
                      {formatPrice(vehicle.price)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm text-gray-400 mb-4">
                    <span className="flex items-center">
                      <Gauge size={14} className="mr-1 text-luxury-gold" />
                      {formatMileage(vehicle.mileage)} km
                    </span>
                    <span className="flex items-center">
                      <Fuel size={14} className="mr-1 text-luxury-gold" />
                      {vehicle.fuel}
                    </span>
                  </div>
                  
                  <div className="mb-4">
                    <Badge variant="outline" className="border-gray-600 text-gray-400">
                      {vehicle.transmission}
                    </Badge>
                    <Badge variant="outline" className="border-gray-600 text-gray-400 ml-2">
                      {vehicle.color}
                    </Badge>
                  </div>
                  
                  <Link href={`/auto/${vehicle.slug}`}>
                    <Button className="w-full bg-luxury-gold text-dark-primary hover:bg-white transition-all duration-300 rounded-full font-semibold group-hover:shadow-lg">
                      Details Bekijken
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* No results message */}
          {filteredVehicles?.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">Geen voertuigen gevonden die voldoen aan uw criteria.</p>
              <Button 
                onClick={() => {
                  setSearchTerm("");
                  setBrandFilter("all");
                  setFuelFilter("all");
                  setSortBy("price-asc");
                }}
                className="mt-4 bg-luxury-gold text-dark-primary hover:bg-white transition-colors duration-300"
              >
                Alle filters wissen
              </Button>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}