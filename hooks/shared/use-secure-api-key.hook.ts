"use client";

import { useState, useEffect, useCallback } from 'react';
import { useChatStore } from '@/lib/chat/stores/chat.store';

/**
 * Hook to manage secure API key operations
 * This handles saving, checking, and retrieving API keys via HTTP-only cookies
 */
export function useSecureApiKey() {
  const { setApiKey: setStoreApiKey } = useChatStore();
  const [isLoading, setIsLoading] = useState(true);
  const [hasStoredKey, setHasStoredKey] = useState(false);
  
  // Check if an API key is stored
  const checkApiKey = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/apikey');
      const data = await response.json();
      setHasStoredKey(data.hasApiKey);
      return data.hasApiKey;
    } catch (error) {
      console.error('Error checking API key:', error);
      setHasStoredKey(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Save API key securely
  const saveApiKey = useCallback(async (apiKey: string) => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/apikey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setHasStoredKey(true);
        // Update Zustand store with the key for the current session
        setStoreApiKey(apiKey);
        return true;
      } else {
        console.error('Failed to save API key:', result.message);
        return false;
      }
    } catch (error) {
      console.error('Error saving API key:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [setStoreApiKey]);
  
  // Retrieve API key (only available on the server)
  const loadApiKey = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/apikey/fetch');
      const data = await response.json();
      
      if (data.apiKey) {
        // Update the Zustand store for this session
        setStoreApiKey(data.apiKey);
        setHasStoredKey(true);
        return true;
      } else {
        setHasStoredKey(false);
        return false;
      }
    } catch (error) {
      console.error('Error retrieving API key:', error);
      setHasStoredKey(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [setStoreApiKey]);
  
  // Clear stored API key
  const clearApiKey = useCallback(async () => {
    try {
      setIsLoading(true);
      await fetch('/api/apikey', { method: 'DELETE' });
      setStoreApiKey('');
      setHasStoredKey(false);
      return true;
    } catch (error) {
      console.error('Error clearing API key:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [setStoreApiKey]);
  
  // Load API key on component mount
  useEffect(() => {
    const initialize = async () => {
      await loadApiKey();
    };
    
    initialize();
  }, [loadApiKey]);
  
  return {
    isLoading,
    hasStoredKey,
    saveApiKey,
    loadApiKey,
    clearApiKey,
    checkApiKey,
  };
}
