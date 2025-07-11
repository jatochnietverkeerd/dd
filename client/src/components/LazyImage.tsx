import { useState, useRef, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
  onError?: (e: any) => void;
}

export default function LazyImage({ src, alt, className = "", onClick, onError }: LazyImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Cleanup function to prevent memory leaks
  useEffect(() => {
    return () => {
      if (imgRef.current) {
        imgRef.current.onload = null;
        imgRef.current.onerror = null;
      }
    };
  }, []);

  const handleLoad = () => {
    if (imgRef.current) {
      setIsLoading(false);
    }
  };

  const handleError = (e: any) => {
    if (imgRef.current) {
      setIsLoading(false);
      setHasError(true);
      if (onError) {
        onError(e);
      }
    }
  };

  if (hasError) {
    return (
      <div className={`bg-dark-tertiary flex items-center justify-center ${className}`}>
        <span className="text-gray-400 text-sm">Afbeelding niet beschikbaar</span>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      {isLoading && (
        <Skeleton className={`absolute inset-0 bg-dark-tertiary ${className}`} />
      )}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={handleLoad}
        onError={handleError}
        onClick={onClick}
        loading="lazy"
      />
    </div>
  );
}