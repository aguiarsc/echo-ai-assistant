"use client";

import { useState, useEffect, useCallback } from 'react';
import { useChatStore } from '@/domains/conversations/storage/conversation-store';

export function useSecureApiKey() {
  const { setApiKey: setStoreApiKey } = useChatStore();
  const [isLoading, setIsLoading] = useState(true);
  const [hasStoredKey, setHasStoredKey] = useState(false);
  
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
  
  const loadApiKey = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/apikey/fetch');
      const data = await response.json();
      
      if (data.apiKey) {
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
