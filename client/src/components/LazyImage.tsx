import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
  onError?: (e: any) => void;
  priority?: boolean;
  width?: number;
  height?: number;
}

export default function LazyImage({ src, alt, className = "", onClick, onError, priority = false, width, height }: LazyImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = (e: any) => {
    setIsLoading(false);
    setHasError(true);
    if (onError) {
      onError(e);
    }
  };

  if (hasError) {
    return (
      <div className={`bg-dark-tertiary flex items-center justify-center ${className}`}>
        <span className="text-gray-500">Afbeelding niet beschikbaar</span>
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && (
        <Skeleton className={`absolute inset-0 bg-dark-tertiary ${className}`} />
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={handleLoad}
        onError={handleError}
        onClick={onClick}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        width={width}
        height={height}
      />
    </div>
  );
}