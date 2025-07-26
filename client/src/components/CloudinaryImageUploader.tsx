import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { useSafeToast } from '@/hooks/use-toast-safe';

interface CloudinaryImageUploaderProps {
  onImagesChange: (urls: string[]) => void;
  currentImages?: string[];
  maxImages?: number;
  folder?: string;
}

export default function CloudinaryImageUploader({
  onImagesChange,
  currentImages = [],
  maxImages = 10,
  folder = 'ddcars'
}: CloudinaryImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useSafeToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    if (currentImages.length + files.length > maxImages) {
      toast({
        title: "Te veel afbeeldingen",
        description: `Maximum ${maxImages} afbeeldingen toegestaan`,
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    const newImageUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('image', file);
        formData.append('folder', folder);

        // Update progress
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));

        const response = await fetch('/api/admin/upload-cloudinary', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Upload failed for ${file.name}`);
        }

        const result = await response.json();
        newImageUrls.push(result.secure_url);

        // Update progress to 100%
        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));

        toast({
          title: "Afbeelding geüpload",
          description: `${file.name} succesvol geüpload naar Cloudinary`,
        });
      }

      onImagesChange([...currentImages, ...newImageUrls]);
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload mislukt",
        description: error instanceof Error ? error.message : "Er ging iets mis bij het uploaden",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      setUploadProgress({});
    }
  };

  const removeImage = (index: number) => {
    const newImages = currentImages.filter((_, i) => i !== index);
    onImagesChange(newImages);
    
    toast({
      title: "Afbeelding verwijderd",
      description: "Afbeelding is verwijderd uit de lijst",
    });
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="cloudinary-images">Afbeeldingen (Cloudinary)</Label>
        <div className="mt-2">
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />
          
          <Button
            type="button"
            variant="outline"
            onClick={triggerFileSelect}
            disabled={uploading || currentImages.length >= maxImages}
            className="w-full"
          >
            {uploading ? (
              <>
                <Upload className="w-4 h-4 mr-2 animate-spin" />
                Uploaden...
              </>
            ) : (
              <>
                <ImageIcon className="w-4 h-4 mr-2" />
                Afbeeldingen selecteren ({currentImages.length}/{maxImages})
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="space-y-2">
          {Object.entries(uploadProgress).map(([filename, progress]) => (
            <div key={filename} className="text-sm">
              <div className="flex justify-between">
                <span>{filename}</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Current Images */}
      {currentImages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {currentImages.map((url, index) => (
            <div key={index} className="relative group">
              <img
                src={url}
                alt={`Upload ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="text-sm text-gray-500">
        Afbeeldingen worden opgeslagen in Cloudinary en zijn beschikbaar voor beide domeinen.
        Ondersteunde formaten: JPG, PNG, WebP. Maximale bestandsgrootte: 10MB.
      </p>
    </div>
  );
}