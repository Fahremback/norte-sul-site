
import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';

const IP_STORAGE_KEY = 'serverIp';

interface IpContextType {
  serverIp: string | null;
  isIpSet: boolean;
  setServerIp: (ip: string) => void;
  clearServerIp: () => void;
  isLoadingIp: boolean;
}

const IpContext = createContext<IpContextType | undefined>(undefined);

export const IpProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [serverIp, setIp] = useState<string | null>(null);
  const [isLoadingIp, setIsLoadingIp] = useState(true);

  useEffect(() => {
    try {
      const storedIp = localStorage.getItem(IP_STORAGE_KEY);
      if (storedIp) {
        setIp(storedIp);
      }
    } catch (error) {
      console.error("Failed to read server IP from localStorage", error);
    } finally {
      setIsLoadingIp(false);
    }
  }, []);

  const setServerIp = useCallback((ip: string) => {
    try {
      const formattedIp = ip.trim();
      localStorage.setItem(IP_STORAGE_KEY, formattedIp);
      setIp(formattedIp);
    } catch (error) {
      console.error("Failed to save server IP to localStorage", error);
    }
  }, []);

  const clearServerIp = useCallback(() => {
    try {
      localStorage.removeItem(IP_STORAGE_KEY);
      setIp(null);
    } catch (error) {
      console.error("Failed to clear server IP from localStorage", error);
    }
  }, []);

  const isIpSet = !!serverIp;

  return (
    <IpContext.Provider value={{ serverIp, isIpSet, setServerIp, clearServerIp, isLoadingIp }}>
      {children}
    </IpContext.Provider>
  );
};

export const useIp = (): IpContextType => {
  const context = useContext(IpContext);
  if (context === undefined) {
    throw new Error('useIp must be used within an IpProvider');
  }
  return context;
};
