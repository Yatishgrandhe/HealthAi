import { supabase } from './supabaseClient';
import { ImageMetadata } from './healthDataService';

export interface ImageUploadResult {
  url: string;
  metadata: {
    fileName: string;
    fileSize: number;
    mimeType: string;
    width?: number;
    height?: number;
  };
}

class ImageUploadService {
  // Check if supabase is available
  private checkSupabase() {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }
  }

  // Convert image file to base64 URL (for demo purposes)
  // In production, you would upload to a cloud storage service like AWS S3, Cloudinary, etc.
  private async fileToDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Get image dimensions from file
  private async getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.src = URL.createObjectURL(file);
    });
  }

  // Upload image to Supabase Storage and return public URL
  async uploadImageToStorage(
    file: File,
    imageType: 'posture' | 'fitness' | 'progress' | 'routine' | 'profile',
    altText?: string,
    tags?: string[]
  ): Promise<ImageUploadResult> {
    this.checkSupabase();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase!.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }
    
    // Generate a unique file path with user ID and timestamp
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `${imageType}-${user.id}-${timestamp}.${fileExtension}`;
    const filePath = `${imageType}/${fileName}`;
    
    // Upload to Supabase Storage
    const { data: storageData, error: storageError } = await supabase!.storage
      .from('user-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (storageError) {
      console.error('Storage upload error:', storageError);
      throw new Error(`Failed to upload image: ${storageError.message}`);
    }
    
    // Get public URL
    const { data: publicUrlData } = supabase!.storage
      .from('user-images')
      .getPublicUrl(filePath);
    
    const publicUrl = publicUrlData?.publicUrl;
    if (!publicUrl) {
      throw new Error('Failed to get public URL for uploaded image');
    }
    
    // Get image dimensions
    const dimensions = await this.getImageDimensions(file);
    
    // Create metadata
    const metadata: ImageMetadata = {
      user_id: user.id,
      image_url: publicUrl,
      image_type: imageType,
      file_name: fileName,
      file_size: file.size,
      mime_type: file.type,
      width: dimensions.width,
      height: dimensions.height,
      alt_text: altText || file.name,
      tags: tags || []
    };
    
    // Save metadata to database
    const { data, error } = await supabase!
      .from('image_metadata')
      .insert(metadata)
      .select()
      .single();
    
    if (error) {
      console.warn('Failed to save image metadata to database:', error);
      // Continue even if metadata save fails
    }
    
    return {
      url: publicUrl,
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        width: dimensions.width,
        height: dimensions.height
      }
    };
  }

  // Upload base64 image to Supabase Storage
  async uploadBase64ImageToStorage(
    base64Image: string,
    imageType: 'posture' | 'fitness' | 'progress' | 'routine' | 'profile',
    fileName?: string,
    altText?: string,
    tags?: string[]
  ): Promise<ImageUploadResult> {
    this.checkSupabase();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase!.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }
    
    // Convert base64 to blob
    const base64Data = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/jpeg' });

    // Generate unique filename
    const timestamp = Date.now();
    const finalFileName = fileName || `${imageType}-${user.id}-${timestamp}.jpg`;
    const filePath = `${imageType}/${finalFileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase!.storage
      .from('user-images')
      .upload(filePath, blob, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading image to Supabase Storage:', uploadError);
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    // Get public URL
    const { data: publicUrlData } = supabase!.storage
      .from('user-images')
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData?.publicUrl;
    if (!publicUrl) {
      throw new Error('Failed to get public URL for uploaded image');
    }

    // Save image metadata
    try {
      const metadata: ImageMetadata = {
        user_id: user.id,
        image_url: publicUrl,
        image_type: imageType,
        file_name: finalFileName,
        file_size: blob.size,
        mime_type: 'image/jpeg',
        alt_text: altText || 'Uploaded image',
        tags: tags || []
      };

      await supabase!
        .from('image_metadata')
        .insert(metadata)
        .select()
        .single();
    } catch (metadataError) {
      console.warn('Failed to save image metadata:', metadataError);
      // Continue even if metadata save fails
    }

    return {
      url: publicUrl,
      metadata: {
        fileName: finalFileName,
        fileSize: blob.size,
        mimeType: 'image/jpeg',
        width: undefined,
        height: undefined
      }
    };
  }

  // Upload image and return URL (legacy method - now uses Supabase Storage)
  async uploadImage(
    file: File, 
    imageType: 'posture' | 'fitness' | 'progress' | 'routine' | 'profile',
    altText?: string,
    tags?: string[]
  ): Promise<ImageUploadResult> {
    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB');
      }

      // Try to upload to Supabase Storage first
      if (supabase) {
        try {
          return await this.uploadImageToStorage(file, imageType, altText, tags);
        } catch (storageError) {
          console.warn('Supabase Storage upload failed, falling back to data URL:', storageError);
        }
      }

      // Fallback to data URL if Supabase is not available or upload fails
      const dimensions = await this.getImageDimensions(file);
      const dataUrl = await this.fileToDataURL(file);

      // Only try to save metadata if supabase is available
      if (supabase) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            // Create metadata
            const metadata: ImageMetadata = {
              user_id: user.id,
              image_url: dataUrl,
              image_type: imageType,
              file_name: file.name,
              file_size: file.size,
              mime_type: file.type,
              width: dimensions.width,
              height: dimensions.height,
              alt_text: altText || file.name,
              tags: tags || []
            };

            // Save metadata to database
            await supabase
              .from('image_metadata')
              .insert(metadata)
              .select()
              .single();
          }
        } catch (dbError) {
          console.warn('Failed to save image metadata to database:', dbError);
          // Continue without saving metadata
        }
      }

      return {
        url: dataUrl,
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          width: dimensions.width,
          height: dimensions.height
        }
      };

    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  // Upload multiple images
  async uploadMultipleImages(
    files: File[],
    imageType: 'posture' | 'fitness' | 'progress' | 'routine' | 'profile',
    altTexts?: string[],
    tags?: string[]
  ): Promise<ImageUploadResult[]> {
    const results: ImageUploadResult[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const altText = altTexts?.[i];
      
      try {
        const result = await this.uploadImage(file, imageType, altText, tags);
        results.push(result);
      } catch (error) {
        console.error(`Error uploading image ${file.name}:`, error);
        // Continue with other files even if one fails
      }
    }

    return results;
  }

  // Delete image (remove from database)
  async deleteImage(imageId: string): Promise<void> {
    try {
      this.checkSupabase();
      
      const { error } = await supabase!
        .from('image_metadata')
        .delete()
        .eq('id', imageId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  }

  // Get images by type
  async getImagesByType(imageType: 'posture' | 'fitness' | 'progress' | 'routine' | 'profile'): Promise<ImageMetadata[]> {
    try {
      this.checkSupabase();
      
      const { data, error } = await supabase!
        .from('image_metadata')
        .select('*')
        .eq('image_type', imageType)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching images:', error);
      throw error;
    }
  }

  // Get all user images
  async getUserImages(): Promise<ImageMetadata[]> {
    try {
      this.checkSupabase();
      
      const { data, error } = await supabase!
        .from('image_metadata')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user images:', error);
      throw error;
    }
  }

  // Update image metadata
  async updateImageMetadata(
    imageId: string, 
    updates: Partial<Pick<ImageMetadata, 'alt_text' | 'tags'>>
  ): Promise<ImageMetadata> {
    try {
      this.checkSupabase();
      
      const { data, error } = await supabase!
        .from('image_metadata')
        .update(updates)
        .eq('id', imageId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating image metadata:', error);
      throw error;
    }
  }

  // Compress image for better performance
  async compressImage(file: File, maxWidth: number = 800, quality: number = 0.8): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              resolve(file); // Fallback to original file
            }
          },
          file.type,
          quality
        );
      };

      img.src = URL.createObjectURL(file);
    });
  }

  // Generate thumbnail URL
  async generateThumbnail(file: File, size: number = 150): Promise<string> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();

      img.onload = () => {
        // Calculate thumbnail dimensions
        let { width, height } = img;
        const aspectRatio = width / height;

        if (width > height) {
          width = size;
          height = size / aspectRatio;
        } else {
          height = size;
          width = size * aspectRatio;
        }

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Draw thumbnail
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to data URL
        const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve(thumbnailUrl);
      };

      img.src = URL.createObjectURL(file);
    });
  }

  // Validate image file
  validateImageFile(file: File): { valid: boolean; error?: string } {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return { valid: false, error: 'File must be an image' };
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return { valid: false, error: 'File size must be less than 5MB' };
    }

    // Check file extension
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!allowedExtensions.includes(fileExtension)) {
      return { valid: false, error: 'File type not supported. Please use JPG, PNG, GIF, or WebP' };
    }

    return { valid: true };
  }
}

export const imageUploadService = new ImageUploadService();
export default imageUploadService; 