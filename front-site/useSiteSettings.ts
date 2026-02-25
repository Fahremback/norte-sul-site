
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { SiteSettings } from '../types';
import { fetchSiteSettings as apiFetchSiteSettings } from '../services/api'; 

interface SiteSettingsContextType {
  settings: SiteSettings | null;
  isLoading: boolean;
  error: string | null;
  fetchSiteSettings: () => Promise<void>; 
}

const SiteSettingsContext = createContext<SiteSettingsContextType | undefined>(undefined);

// Default values used ONLY if backend somehow fails catastrophically or for initial render before fetch.
// Backend should be the source of truth.
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
  asaasApiKey: '', // Placeholder, will be populated from backend
  asaasWebhookSecret: '', // Placeholder, will be populated from backend
};


export const SiteSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSiteSettings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiFetchSiteSettings();
      setSettings(data);
    } catch (err) {
      console.error("Failed to load site settings from backend, using client fallback:", err);
      setError(err instanceof Error ? err.message : "Falha ao carregar configurações do site.");
      setSettings(clientFallbackDefaults); // Fallback to client-side defaults on critical error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSiteSettings();
  }, []); // Fetch on initial mount

  useEffect(() => {
    // Update document head whenever settings change (or on initial load)
    const currentSettings = settings || clientFallbackDefaults; // Use fallback if settings still null

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
      faviconTag.setAttribute('rel', 'icon'); // or 'shortcut icon'
      document.head.appendChild(faviconTag);
    }
    faviconTag.setAttribute('href', currentSettings.faviconUrl);
    
    if (currentSettings.maintenanceMode) {
      console.warn("SITE EM MODO MANUTENÇÃO ATIVADO PELAS CONFIGURAÇÕES.");
      // For a real maintenance mode, you might redirect or show a global banner here
      // This could involve setting a body class or dispatching a global state event
    }

  }, [settings]);

  return React.createElement(
    SiteSettingsContext.Provider,
    { value: { settings, isLoading, error, fetchSiteSettings } },
    children
  );
};

export const useSiteSettings = (): SiteSettingsContextType => {
  const context = useContext(SiteSettingsContext);
  if (context === undefined) {
    throw new Error('useSiteSettings must be used within a SiteSettingsProvider');
  }
  return context;
};