import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, GripVertical, Image as ImageIcon } from 'lucide-react';
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
  const { toast } = useToast();

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
          const newImages = prev.map(img => 
            img.id === imageFile.id 
              ? { ...img, url, isUploaded: true }
              : img
          );
          updateParent(newImages);
          return newImages;
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
  }, [images.length, maxImages, toast]);

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
      updateParent(newImages);
      return newImages;
    });
  };

  const updateParent = (newImages: ImageFile[]) => {
    const urls = newImages
      .filter(img => img.isUploaded)
      .map(img => img.url);
    onImagesChange(urls);
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
    updateParent(newImages);
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
          Upload
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
          <p className="text-gray-300 mb-2">Sleep afbeeldingen hierheen of klik op Upload</p>
          <p className="text-sm text-gray-500">PNG, JPG, JPEG tot 10MB</p>
        </CardContent>
      </Card>

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <Card
              key={image.id}
              className={`bg-gray-800 border-gray-700 relative group cursor-move ${
                draggedIndex === index ? 'opacity-50' : ''
              }`}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOverItem(e, index)}
            >
              <CardContent className="p-2">
                <div className="relative aspect-video bg-gray-700 rounded overflow-hidden">
                  <img
                    src={image.preview}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  
                  {!image.isUploaded && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="animate-spin w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full" />
                    </div>
                  )}

                  {/* Controls */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeImage(image.id)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical className="w-4 h-4 text-white" />
                  </div>

                  {/* Main image indicator */}
                  {index === 0 && (
                    <div className="absolute bottom-2 left-2 bg-yellow-500 text-black text-xs px-2 py-1 rounded">
                      Hoofdafbeelding
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {images.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          Nog geen afbeeldingen toegevoegd
        </div>
      )}
    </div>
  );
}