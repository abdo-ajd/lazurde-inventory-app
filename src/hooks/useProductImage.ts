
// src/hooks/useProductImage.ts
"use client";

import { useState, useEffect } from 'react';
import { getImage as getImageFromDB } from '@/lib/indexedDBService';

interface UseProductImageReturn {
  imageUrl: string | null;
  isLoading: boolean;
  error: string | null;
}

export const useProductImage = (productId: string | undefined, fallbackImageUrl: string | undefined | null): UseProductImageReturn => {
  const [imageUrl, setImageUrl] = useState<string | null>(fallbackImageUrl || null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;

    const loadImage = async () => {
      if (!productId) {
        setImageUrl(fallbackImageUrl || null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const blob = await getImageFromDB(productId);
        if (blob) {
          objectUrl = URL.createObjectURL(blob);
          setImageUrl(objectUrl);
        } else {
          // If no blob in IDB, use the fallback (which might be from initial product data or an empty string)
          setImageUrl(fallbackImageUrl || null);
        }
      } catch (err) {
        console.error(`Error loading image for product ${productId} from IndexedDB:`, err);
        setError(err instanceof Error ? err.message : 'Failed to load image from local database.');
        setImageUrl(fallbackImageUrl || null); // Fallback on error
      } finally {
        setIsLoading(false);
      }
    };

    loadImage();

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [productId, fallbackImageUrl]); // Re-run if productId or the fallback itself changes

  return { imageUrl, isLoading, error };
};
