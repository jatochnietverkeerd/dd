import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Gauge, Fuel } from "lucide-react";
import { Link } from "wouter";
import type { Vehicle } from "@shared/schema";

interface VehicleCardProps {
  vehicle: Vehicle;
}

export default function VehicleCard({ vehicle }: VehicleCardProps) {

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
    <Card className="bg-dark-secondary border-dark-quaternary rounded-lg overflow-hidden">
      <div className="relative overflow-hidden">
        <img
          src={vehicle.images?.[0] || "https://images.unsplash.com/photo-1555215695-3004980ad54e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"}
          alt={`${vehicle.brand} ${vehicle.model}`}
          className="w-full h-48 object-cover"
          loading="lazy"
          decoding="async"
          width="800"
          height="600"
        />
      </div>
      <CardContent className="p-6">
        <h3 className="text-xl font-semibold mb-2" style={{color: '#D9C89E'}}>{vehicle.brand}</h3>
        <p className="mb-4" style={{color: '#D9C89E'}}>{vehicle.model}</p>
        <div className="flex justify-between items-center mb-4">
          <span className="font-bold text-lg" style={{color: '#D9C89E'}}>{formatPrice(Number(vehicle.price))}</span>
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
