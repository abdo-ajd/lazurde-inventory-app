
// src/hooks/useProductImage.ts
"use client";

// With Firebase Storage, the image URL is directly available on the product object.
// This hook now primarily acts as a simple pass-through for the URL,
// making components that use it compatible without major refactoring.
// The fetching logic has moved to the ProductContext.
export const useProductImage = (productId: string | undefined, imageUrlFromProduct: string | undefined | null) => {
  return {
    // Return the URL from the product data directly.
    // If it's null or undefined, the consuming component will use a placeholder.
    imageUrl: imageUrlFromProduct || null,
    // Loading is now handled at the context level, so we can set this to false.
    isLoading: false, 
    error: null,
  };
};
