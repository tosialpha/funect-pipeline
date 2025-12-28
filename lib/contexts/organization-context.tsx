"use client";

import { createContext, useContext, ReactNode } from "react";

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

interface OrganizationContextType {
  organization: Organization;
  organizationId: string;
  slug: string;
}

const OrganizationContext = createContext<OrganizationContextType | null>(null);

interface OrganizationProviderProps {
  organization: Organization;
  children: ReactNode;
}

export function OrganizationProvider({
  organization,
  children,
}: OrganizationProviderProps) {
  return (
    <OrganizationContext.Provider
      value={{
        organization,
        organizationId: organization.id,
        slug: organization.slug,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error(
      "useOrganization must be used within an OrganizationProvider"
    );
  }
  return context;
}

// Optional hook that doesn't throw if outside provider
export function useOrganizationOptional() {
  return useContext(OrganizationContext);
}
