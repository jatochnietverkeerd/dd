import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImageFile {
  id: string;
  file?: File;
  url: string;
  preview: string;
  isUploaded: boolean;
}

interface ImageUploaderProps {
  initialImages?: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  token?: string;
}

export default function ImageUploader({ 
  initialImages = [], 
  onImagesChange, 
  maxImages = 10,
  token 
}: ImageUploaderProps) {
  const [images, setImages] = useState<ImageFile[]>(() => 
    initialImages.map((url, index) => ({
      id: `initial-${index}`,
      url,
      preview: url,
      isUploaded: true
    }))
  );

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  
  // Update images when initialImages changes
  useEffect(() => {
    setImages(initialImages.map((url, index) => ({
      id: `initial-${index}`,
      url,
      preview: url,
      isUploaded: true
    })));
  }, [initialImages]);
  const { toast } = useToast();

  const updateParent = useCallback((newImages: ImageFile[]) => {
    const urls = newImages
      .filter(img => img.isUploaded)
      .map(img => img.url);
    onImagesChange(urls);
  }, [onImagesChange]);

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);

    try {
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Upload failed' }));
        throw new Error(errorData.message || 'Upload failed');
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const handleFileSelect = useCallback(async (files: FileList) => {
    if (images.length + files.length > maxImages) {
      toast({
        title: "Te veel afbeeldingen",
        description: `Maximum ${maxImages} afbeeldingen toegestaan`,
        variant: "destructive",
      });
      return;
    }

    const newImages: ImageFile[] = [];
    
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Ongeldig bestand",
          description: "Alleen afbeeldingen zijn toegestaan",
          variant: "destructive",
        });
        continue;
      }

      const id = `new-${Date.now()}-${Math.random()}`;
      const preview = URL.createObjectURL(file);
      
      newImages.push({
        id,
        file,
        url: '',
        preview,
        isUploaded: false
      });
    }

    setImages(prev => [...prev, ...newImages]);

    // Upload images in background
    for (const imageFile of newImages) {
      try {
        const url = await uploadImage(imageFile.file!);
        setImages(prev => {
          const updated = prev.map(img => 
            img.id === imageFile.id 
              ? { ...img, url, isUploaded: true }
              : img
          );
          // Schedule updateParent to run after this render
          setTimeout(() => updateParent(updated), 0);
          return updated;
        });
      } catch (error) {
        console.error('Upload error:', error);
        toast({
          title: "Upload fout",
          description: `Kon afbeelding niet uploaden: ${imageFile.file?.name}`,
          variant: "destructive",
        });
        setImages(prev => prev.filter(img => img.id !== imageFile.id));
      }
    }
  }, [images.length, maxImages, toast, updateParent]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const removeImage = (id: string) => {
    setImages(prev => {
      const newImages = prev.filter(img => img.id !== id);
      setTimeout(() => updateParent(newImages), 0);
      return newImages;
    });
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleDragOverItem = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newImages = [...images];
    const draggedItem = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedItem);

    setImages(newImages);
    setDraggedIndex(index);
    setTimeout(() => updateParent(newImages), 0);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Afbeeldingen ({images.length}/{maxImages})</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => document.getElementById('file-input')?.click()}
          className="border-gray-700 text-white hover:bg-gray-800"
        >
          <Upload className="w-4 h-4 mr-2" />
          Meerdere Uploaden
        </Button>
      </div>

      <input
        id="file-input"
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
        className="hidden"
      />

      {/* Drop Zone */}
      <Card
        className="border-2 border-dashed border-gray-700 bg-gray-800/50 hover:bg-gray-800/70 transition-colors"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <CardContent className="p-8 text-center">
          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-300 mb-2">Sleep <strong>meerdere afbeeldingen</strong> hierheen of klik op "Meerdere Uploaden"</p>
          <p className="text-sm text-gray-500">Selecteer meerdere bestanden tegelijk • PNG, JPG, JPEG tot 10MB per bestand</p>
          <p className="text-xs text-yellow-400 mt-2">💡 TIP: Houd Ctrl/Cmd ingedrukt om meerdere bestanden te selecteren</p>
        </CardContent>
      </Card>

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div
              key={image.id}
              className={`relative group bg-gray-800 rounded-lg overflow-hidden ${
                draggedIndex === index ? 'opacity-50' : ''
              }`}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOverItem(e, index)}
            >
              <img
                src={image.preview}
                alt={`Upload ${index + 1}`}
                className="w-full h-32 object-cover"
              />
              
              {!image.isUploaded && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full"></div>
                </div>
              )}

              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 p-0"
                onClick={() => removeImage(image.id)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}