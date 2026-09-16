import React from "react";
import { AuthProvider } from "../contexts/AuthContext";
import { AuditProvider } from "../contexts/AuditContext";
import { UIShellProvider } from "../contexts/UIShellContext";
import { CRMProvider } from "../contexts/CRMContext";
import { VouchersProvider } from "../contexts/VouchersContext";
import { InventoryProvider } from "../contexts/InventoryContext";
import { SpacesProvider } from "../contexts/SpacesContext";
import { ContractsProvider } from "../contexts/ContractsContext";
import { ServicesProvider } from "../contexts/ServicesContext";
import { HRProvider } from "../contexts/HRContext";
import { AccountingProvider } from "../contexts/AccountingContext";
import { MasterDataProvider } from "../contexts/MasterDataContext";

interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <AuthProvider>
      <AuditProvider>
        <UIShellProvider>
          <CRMProvider>
            <VouchersProvider>
              <InventoryProvider>
                <SpacesProvider>
                  <ContractsProvider>
                    <ServicesProvider>
                      <HRProvider>
                        <AccountingProvider>
                          <MasterDataProvider>{children}</MasterDataProvider>
                        </AccountingProvider>
                      </HRProvider>
                    </ServicesProvider>
                  </ContractsProvider>
                </SpacesProvider>
              </InventoryProvider>
            </VouchersProvider>
          </CRMProvider>
        </UIShellProvider>
      </AuditProvider>
    </AuthProvider>
  );
};
