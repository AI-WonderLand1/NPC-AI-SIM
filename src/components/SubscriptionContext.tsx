import React, { createContext, useContext, useState } from 'react';

export interface Subscription {
  id: string;
  email: string;
  subscribed: boolean;
  tier: 'free' | 'basic' | 'premium';
  expiresAt?: string;
}

export interface SubscriptionContextType {
  subscription: Subscription | null;
  isSubscribed: boolean;
  isLoading: boolean;
  subscribe: (email: string, tier?: 'basic' | 'premium') => Promise<void>;
  checkSubscription: (email: string) => Promise<boolean>;
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkSubscription = async (email: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/subscriptions/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
        setIsSubscribed(data.subscribed);
        return data.subscribed;
      }
      return false;
    } catch (error) {
      console.error('Error checking subscription:', error);
      return false;
    }
  };

  const subscribe = async (email: string, tier: 'basic' | 'premium' = 'basic'): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, tier }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
        setIsSubscribed(data.subscription?.subscribed || false);
      }
    } catch (error) {
      console.error('Error subscribing:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SubscriptionContext.Provider value={{
      subscription,
      isSubscribed,
      isLoading,
      subscribe,
      checkSubscription,
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export interface SubscriptionAPI {
  checkStatus: (email: string) => Promise<{ subscribed: boolean; tier: string | null }>;
  createSubscription: (email: string, tier: string) => Promise<{ success: boolean; subscription?: Subscription }>;
  cancelSubscription: (subscriptionId: string) => Promise<{ success: boolean }>;
}

export const subscriptionAPI: SubscriptionAPI = {
  checkStatus: async (email: string) => {
    const response = await fetch('/api/subscriptions/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    
    if (response.ok) {
      const data = await response.json();
      return { 
        subscribed: data.subscribed, 
        tier: data.subscription?.tier || null 
      };
    }
    return { subscribed: false, tier: null };
  },

  createSubscription: async (email: string, tier: string) => {
    const response = await fetch('/api/subscriptions/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, tier }),
    });
    
    if (response.ok) {
      const data = await response.json();
      return { success: true, subscription: data.subscription };
    }
    return { success: false };
  },

  cancelSubscription: async (subscriptionId: string) => {
    const response = await fetch(`/api/subscriptions/${subscriptionId}`, {
      method: 'DELETE',
    });
    
    if (response.ok) {
      return { success: true };
    }
    return { success: false };
  },
};