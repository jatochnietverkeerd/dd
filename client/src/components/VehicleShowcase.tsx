import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import VehicleCard from "./VehicleCard";
import type { Vehicle } from "@shared/schema";

export default function VehicleShowcase() {
  const { data: featuredVehicles, isLoading } = useQuery<Vehicle[]>({
    queryKey: ['/api/vehicles/featured'],
  });

  const { data: allVehicles } = useQuery<Vehicle[]>({
    queryKey: ['/api/vehicles'],
  });

  if (isLoading) {
    return (
      <section id="aanbod" className="py-20 bg-dark-primary">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-light mb-4">Ons <span className="text-luxury-gold font-bold">Aanbod</span></h2>
            <p className="text-gray-400 max-w-2xl mx-auto">Ontdek onze zorgvuldig geselecteerde collectie van premium occasions.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="bg-dark-secondary rounded-lg overflow-hidden">
                <Skeleton className="w-full h-48 bg-dark-tertiary" />
                <div className="p-6">
                  <Skeleton className="h-6 w-3/4 mb-2 bg-dark-tertiary" />
                  <Skeleton className="h-4 w-1/2 mb-4 bg-dark-tertiary" />
                  <div className="flex justify-between items-center mb-4">
                    <Skeleton className="h-5 w-20 bg-dark-tertiary" />
                    <Skeleton className="h-4 w-12 bg-dark-tertiary" />
                  </div>
                  <Skeleton className="h-10 w-full bg-dark-tertiary" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="aanbod" className="py-20 bg-dark-primary">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-light mb-4">Ons <span className="text-luxury-gold font-bold">Aanbod</span></h2>
          <p className="text-gray-400 max-w-2xl mx-auto">Ontdek onze zorgvuldig geselecteerde collectie van premium occasions. Elk voertuig vertelt zijn eigen verhaal van luxe en prestaties.</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredVehicles?.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>
        
        <div className="text-center mt-12">
          <Link href="/aanbod">
            <Button 
              variant="outline"
              className="border-luxury-gold text-luxury-gold px-8 py-3 rounded-full font-semibold hover:bg-luxury-gold hover:text-dark-primary transition-colors duration-300"
            >
              Bekijk Alle Voertuigen ({allVehicles?.length || 0})
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
