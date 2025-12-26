import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, Star, Loader2, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface GymImage {
  id: string;
  gym_id: string;
  image_url: string;
  is_primary: boolean;
  created_at: string;
}

interface GymImageUploadProps {
  gymId: string;
  images: GymImage[];
  onImagesChange: () => void;
}

const GymImageUpload = ({ gymId, images, onImagesChange }: GymImageUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadImage = async (file: File) => {
    setIsUploading(true);
    
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${gymId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('gym-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('gym-images')
        .getPublicUrl(fileName);

      // Save to database
      const isPrimary = images.length === 0; // First image is primary
      const { error: dbError } = await supabase
        .from('gym_images')
        .insert({
          gym_id: gymId,
          image_url: urlData.publicUrl,
          is_primary: isPrimary,
        });

      if (dbError) throw dbError;

      toast.success('Image uploaded successfully');
      onImagesChange();
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }
      uploadImage(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const deleteImage = async (image: GymImage) => {
    setDeletingId(image.id);
    
    try {
      // Extract file path from URL
      const urlParts = image.image_url.split('/gym-images/');
      const filePath = urlParts[1];

      // Delete from storage
      if (filePath) {
        await supabase.storage.from('gym-images').remove([filePath]);
      }

      // Delete from database
      const { error } = await supabase
        .from('gym_images')
        .delete()
        .eq('id', image.id);

      if (error) throw error;

      // If deleting primary, set another as primary
      if (image.is_primary && images.length > 1) {
        const nextImage = images.find(img => img.id !== image.id);
        if (nextImage) {
          await supabase
            .from('gym_images')
            .update({ is_primary: true })
            .eq('id', nextImage.id);
        }
      }

      toast.success('Image deleted');
      onImagesChange();
    } catch (error: any) {
      console.error('Error deleting image:', error);
      toast.error(error.message || 'Failed to delete image');
    } finally {
      setDeletingId(null);
    }
  };

  const setPrimary = async (image: GymImage) => {
    try {
      // Remove primary from all images
      await supabase
        .from('gym_images')
        .update({ is_primary: false })
        .eq('gym_id', gymId);

      // Set new primary
      const { error } = await supabase
        .from('gym_images')
        .update({ is_primary: true })
        .eq('id', image.id);

      if (error) throw error;

      toast.success('Primary image updated');
      onImagesChange();
    } catch (error: any) {
      console.error('Error setting primary:', error);
      toast.error(error.message || 'Failed to set primary image');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Gym Images</h3>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="gap-2"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          Upload Image
        </Button>
      </div>

      {images.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No images uploaded yet
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Upload images to showcase this gym
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {images.map((image) => (
            <div
              key={image.id}
              className="relative group aspect-video rounded-lg overflow-hidden border border-border"
            >
              <img
                src={image.image_url}
                alt="Gym"
                className="w-full h-full object-cover"
              />
              
              {/* Primary badge */}
              {image.is_primary && (
                <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                  <Star className="h-3 w-3" />
                  Primary
                </div>
              )}

              {/* Actions overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {!image.is_primary && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setPrimary(image)}
                    className="gap-1"
                  >
                    <Star className="h-3 w-3" />
                    Set Primary
                  </Button>
                )}
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteImage(image)}
                  disabled={deletingId === image.id}
                >
                  {deletingId === image.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GymImageUpload;
