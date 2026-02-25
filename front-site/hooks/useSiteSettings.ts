import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SiteSettings } from '../types';
import { fetchSiteSettings as apiFetchSiteSettings } from '../services/api'; 

interface SiteSettingsContextType {
  settings: SiteSettings | null;
  isLoading: boolean;
  error: Error | null;
  refetchSiteSettings: () => void; 
}

const SiteSettingsContext = createContext<SiteSettingsContextType | undefined>(undefined);

const clientFallbackDefaults: SiteSettings = {
  siteName: "Norte Sul Informática",
  siteDescription: "Norte Sul Informática: Tecnologia e Assessoria.",
  logoUrl: '',
  faviconUrl: '/favicon.ico',
  contactPhone: '(XX) XXXXX-XXXX',
  contactEmail: 'contato@example.com',
  storeAddress: 'Endereço não carregado',
  storeHours: 'Horário não carregado',
  facebookUrl: '',
  instagramUrl: '',
  maintenanceMode: false,
  asaasApiKey: '',
  asaasWebhookSecret: '',
};

export const SiteSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { data: settings, isLoading, error, refetch } = useQuery<SiteSettings, Error>({
    queryKey: ['siteSettings'],
    queryFn: apiFetchSiteSettings,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (isLoading) {
      document.title = "Carregando...";
      return;
    }
    
    const currentSettings = settings || clientFallbackDefaults;
    document.title = currentSettings.siteName;

    let descriptionTag = document.querySelector('meta[name="description"]');
    if (!descriptionTag) {
      descriptionTag = document.createElement('meta');
      descriptionTag.setAttribute('name', 'description');
      document.head.appendChild(descriptionTag);
    }
    descriptionTag.setAttribute('content', currentSettings.siteDescription);

    let faviconTag = document.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
    if (!faviconTag) {
      faviconTag = document.createElement('link');
      faviconTag.setAttribute('rel', 'icon');
      document.head.appendChild(faviconTag);
    }
    faviconTag.setAttribute('href', currentSettings.faviconUrl);
    
    if (currentSettings.maintenanceMode) {
      console.warn("SITE EM MODO MANUTENÇÃO ATIVADO PELAS CONFIGURAÇÕES.");
    }
  }, [settings, isLoading]);

  const contextValue = {
    settings: settings || null,
    isLoading,
    error: error || null,
    refetchSiteSettings: refetch,
  };

  return React.createElement(SiteSettingsContext.Provider, { value: contextValue }, children);
};

export const useSiteSettings = (): SiteSettingsContextType => {
  const context = useContext(SiteSettingsContext);
  if (context === undefined) {
    throw new Error('useSiteSettings must be used within a SiteSettingsProvider');
  }
  return context;
};
