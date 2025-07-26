import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { useFadeInOnScroll } from "@/hooks/useScrollAnimation";
import VehicleCard from "./VehicleCard";
import type { Vehicle } from "@shared/schema";

export default function VehicleShowcase() {
  const { elementRef: titleRef, fadeInClass: titleFadeClass } = useFadeInOnScroll(0.2);
  const { elementRef: buttonRef, fadeInClass: buttonFadeClass } = useFadeInOnScroll(0.2);
  
  const { data: featuredVehicles, isLoading } = useQuery<Vehicle[]>({
    queryKey: ['/api/vehicles/featured'],
  });

  const { data: allVehicles } = useQuery<Vehicle[]>({
    queryKey: ['/api/vehicles'],
  });

  // Calculate available vehicles for display and count
  const availableVehicles = allVehicles?.filter(v => 
    (v.available !== false && v.status !== 'gearchiveerd' && v.status !== 'verkocht') || 
    (!v.status || v.status === 'beschikbaar')
  ) || [];

  if (isLoading) {
    return (
      <section id="aanbod" className="py-20 bg-dark-primary">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-light mb-4">Ons <span className="font-bold" style={{color: '#D9C89E'}}>Aanbod</span></h2>
            <p className="max-w-2xl mx-auto" style={{color: '#D9C89E'}}>Ontdek onze zorgvuldig geselecteerde collectie van premium occasions.</p>
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
        <div 
          ref={titleRef}
          className={`text-center mb-16 transition-all duration-700 ${titleFadeClass}`}
        >
          <h2 className="text-4xl font-light mb-4">Ons <span className="font-bold" style={{color: '#D9C89E'}}>Aanbod</span></h2>
          <p className="max-w-2xl mx-auto" style={{color: '#D9C89E'}}>Ontdek onze zorgvuldig geselecteerde collectie van premium occasions. Elk voertuig vertelt zijn eigen verhaal van luxe en prestaties.</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {(() => {
            // Show featured vehicles first, then fill with recent non-featured vehicles if needed
            const featured = featuredVehicles || [];
            const nonFeatured = availableVehicles.filter(v => !v.featured);
            const displayVehicles = [...featured];
            
            // Add non-featured vehicles to fill up to 6 vehicles total
            const remainingSlots = Math.max(0, 6 - featured.length);
            displayVehicles.push(...nonFeatured.slice(0, remainingSlots));
            
            return displayVehicles.slice(0, 6).map((vehicle, index) => (
              <div 
                key={vehicle.id} 
                className={`stagger-delay-${Math.min(index * 100 + 100, 400)}`}
              >
                <VehicleCard vehicle={vehicle} />
              </div>
            ));
          })()}
        </div>
        
        <div 
          ref={buttonRef}
          className={`text-center mt-12 transition-all duration-700 delay-600 ${buttonFadeClass}`}
        >
          <Link href="/aanbod">
            <Button 
              variant="outline"
              className="luxury-button px-8 py-3 rounded-full font-semibold"
              style={{borderColor: '#D9C89E', color: '#D9C89E'}}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#D9C89E';
                e.currentTarget.style.color = '#1a1a1a';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#D9C89E';
              }}
            >
              Bekijk al onze auto's ({availableVehicles?.length || 0})
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
