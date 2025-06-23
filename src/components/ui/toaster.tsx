
"use client"

import React, { useEffect, useRef } from "react"
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()
  const playedToastsRef = useRef(new Set<string>())

  useEffect(() => {
    const newDestructiveToast = toasts.find(
      (t) => t.variant === "destructive" && !playedToastsRef.current.has(t.id)
    );

    if (newDestructiveToast) {
      try {
        // Play the hardcoded sound for a rejected operation
        const audio = new Audio('/sounds/operation-rejected.mp3');
        audio.play().catch(error => console.warn("Error playing rejected operation sound:", error));
      } catch (error) {
        console.warn("Could not play rejected operation sound:", error);
      }
      playedToastsRef.current.add(newDestructiveToast.id);
    }
    
    // Clean up old toast IDs from the set to prevent it from growing indefinitely
    const currentToastIds = new Set(toasts.map(t => t.id));
    playedToastsRef.current.forEach(id => {
        if (!currentToastIds.has(id)) {
            playedToastsRef.current.delete(id);
        }
    });

  }, [toasts]);

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}

    