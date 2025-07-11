// SEO utility functions
export function generateSlug(brand: string, model: string, year: number): string {
  const baseSlug = `${brand}-${model}-${year}`
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim();
  
  return baseSlug;
}

// Generate a unique slug by checking existing slugs and adding a number suffix if needed
export async function generateUniqueSlug(brand: string, model: string, year: number, checkExists: (slug: string) => Promise<boolean>): Promise<string> {
  const baseSlug = generateSlug(brand, model, year);
  
  // Check if the base slug already exists
  const exists = await checkExists(baseSlug);
  if (!exists) {
    return baseSlug;
  }
  
  // If it exists, try with numbers until we find a unique one
  let counter = 1;
  let uniqueSlug = `${baseSlug}-${counter}`;
  
  while (await checkExists(uniqueSlug)) {
    counter++;
    uniqueSlug = `${baseSlug}-${counter}`;
  }
  
  return uniqueSlug;
}

export function generateMetaTitle(brand: string, model: string, year: number, price: number): string {
  const formattedPrice = new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
  
  return `${brand} ${model} ${year} - ${formattedPrice} | DD Cars Premium Occasions`;
}

export function generateMetaDescription(brand: string, model: string, year: number, mileage: number, fuel: string, transmission: string): string {
  const formattedMileage = new Intl.NumberFormat('nl-NL').format(mileage);
  
  return `${brand} ${model} ${year} te koop bij DD Cars. ${formattedMileage} km, ${fuel}, ${transmission}. Premium occasions met kwaliteitsgarantie. Bekijk nu!`;
}

export function generateStructuredData(vehicle: any) {
  return {
    "@context": "https://schema.org",
    "@type": "Car",
    "name": `${vehicle.brand} ${vehicle.model}`,
    "brand": {
      "@type": "Brand",
      "name": vehicle.brand
    },
    "model": vehicle.model,
    "vehicleModelDate": vehicle.year,
    "mileageFromOdometer": {
      "@type": "QuantitativeValue",
      "value": vehicle.mileage,
      "unitCode": "KMT"
    },
    "fuelType": vehicle.fuel,
    "vehicleTransmission": vehicle.transmission,
    "color": vehicle.color,
    "description": vehicle.description,
    "image": vehicle.imageUrl,
    "offers": {
      "@type": "Offer",
      "price": vehicle.price,
      "priceCurrency": "EUR",
      "availability": vehicle.available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "CarDealer",
        "name": "DD Cars",
        "url": "https://ddcars.nl"
      }
    }
  };
}