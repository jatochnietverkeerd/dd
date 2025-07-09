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
    <Card className="bg-dark-secondary border-dark-quaternary rounded-lg overflow-hidden group hover:transform hover:scale-105 transition-all duration-300">
      <div className="relative overflow-hidden">
        <img 
          src={vehicle.imageUrl || "https://images.unsplash.com/photo-1555215695-3004980ad54e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"} 
          alt={`${vehicle.brand} ${vehicle.model}`} 
          className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
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
        <Link href={`/vehicle/${vehicle.id}`}>
          <Button className="w-full bg-luxury-gold text-dark-primary hover:bg-white transition-colors duration-300 rounded-full font-semibold">
            Meer Details
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
