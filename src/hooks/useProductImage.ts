
// src/hooks/useProductImage.ts
"use client";

import { useState, useEffect } from 'react';
import { getImage, blobToDataUri } from '@/lib/indexedDBService';

// This hook is responsible for fetching an image from IndexedDB for a given product ID.
// It returns a data URI for the image, a loading state, and any error.
export const useProductImage = (productId: string | undefined, imageUrlFromProduct: string | undefined | null) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // If no product ID is provided, we can't fetch from IndexedDB.
    if (!productId) {
      // If there's an external URL on the product, use it. Otherwise, null.
      setImageUrl(imageUrlFromProduct || null);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    const fetchImage = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Always try to fetch from IndexedDB first
        const imageBlob = await getImage(productId);
        if (isMounted) {
          if (imageBlob) {
            const dataUri = await blobToDataUri(imageBlob);
            setImageUrl(dataUri);
          } else {
            // No image in DB, fallback to the URL on the product object (if any)
            setImageUrl(imageUrlFromProduct || null);
          }
        }
      } catch (err) {
        console.error("Error fetching product image from IndexedDB:", err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch image'));
          // Fallback to external URL even on error
          setImageUrl(imageUrlFromProduct || null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchImage();

    return () => {
      isMounted = false;
    };
  }, [productId, imageUrlFromProduct]);

  return { imageUrl, isLoading, error };
};
