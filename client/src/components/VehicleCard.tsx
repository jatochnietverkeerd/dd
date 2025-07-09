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
        <LazyImage
          src={vehicle.imageUrl || "https://images.unsplash.com/photo-1555215695-3004980ad54e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"}
          alt={`${vehicle.brand} ${vehicle.model}`}
          className="w-full h-48 object-cover image-zoom"
        />
      </div>
      <CardContent className="p-6">
        <h3 className="text-xl font-semibold mb-2 text-white">{vehicle.brand}</h3>
        <p className="text-gray-400 mb-4">{vehicle.model}</p>
        <div className="flex justify-between items-center mb-4">
          <span className="text-luxury-gold font-bold text-lg">{formatPrice(vehicle.price)}</span>
          <span className="text-gray-500">{vehicle.year}</span>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-400 mb-4">
          <span className="flex items-center">
            <Gauge size={14} className="mr-1" />
            {formatMileage(vehicle.mileage)} km
          </span>
          <span className="flex items-center">
            <Fuel size={14} className="mr-1" />
            {vehicle.fuel}
          </span>
        </div>
        <Link href={`/auto/${vehicle.slug}`}>
          <Button className="luxury-button w-full bg-luxury-gold text-dark-primary hover:bg-white rounded-full font-semibold">
            Meer Details
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
