import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Gauge, Fuel } from "lucide-react";
import { Link } from "wouter";
import { useFadeInOnScroll } from "@/hooks/useScrollAnimation";
import LazyImage from "@/components/LazyImage";
import type { Vehicle } from "@shared/schema";

interface VehicleCardProps {
  vehicle: Vehicle;
}

export default function VehicleCard({ vehicle }: VehicleCardProps) {
  const { elementRef, fadeInClass } = useFadeInOnScroll(0.2);

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

  return (
    <Card 
      ref={elementRef}
      className={`bg-dark-secondary border-dark-quaternary rounded-lg overflow-hidden group scale-on-hover transition-all duration-500 ${fadeInClass}`}
    >
      <div className="relative overflow-hidden">
        {vehicle.images && vehicle.images.length > 0 ? (
          <LazyImage
            src={vehicle.images[0]}
            alt={`${vehicle.brand} ${vehicle.model}`}
            className="w-full h-48 object-cover image-zoom"
          />
        ) : (
          <div className="w-full h-48 bg-dark-tertiary flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-2" style={{color: '#D9C89E'}}>📷</div>
              <p className="text-sm" style={{color: '#D9C89E'}}>Geen afbeelding beschikbaar</p>
            </div>
          </div>
        )}
      </div>
      <CardContent className="p-6">
        <h3 className="text-xl font-semibold mb-2" style={{color: '#D9C89E'}}>{vehicle.brand}</h3>
        <p className="mb-4" style={{color: '#D9C89E'}}>{vehicle.model}</p>
        <div className="flex justify-between items-center mb-4">
          <span className="font-bold text-lg" style={{color: '#D9C89E'}}>{formatPrice(vehicle.price)}</span>
          <span style={{color: '#D9C89E'}}>{vehicle.year}</span>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <span className="flex items-center" style={{color: '#D9C89E'}}>
            <Gauge size={14} className="mr-1" />
            {formatMileage(vehicle.mileage)} km
          </span>
          <span className="flex items-center" style={{color: '#D9C89E'}}>
            <Fuel size={14} className="mr-1" />
            {vehicle.fuel}
          </span>
        </div>
        <Link href={`/auto/${vehicle.slug}`}>
          <Button className="luxury-button w-full rounded-full font-semibold hover:bg-white" style={{backgroundColor: '#D9C89E', color: '#1a1a1a'}}>
            Meer Details
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
