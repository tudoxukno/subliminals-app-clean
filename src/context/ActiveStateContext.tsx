import React, { createContext, useContext, useState } from 'react';

type ActiveStateContextType = {
  shouldActivate: boolean;
  setShouldActivate: (value: boolean) => void;
};

const ActiveStateContext = createContext<ActiveStateContextType | undefined>(undefined);

export const ActiveStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [shouldActivate, setShouldActivate] = useState(false);

  return (
    <ActiveStateContext.Provider value={{ shouldActivate, setShouldActivate }}>
      {children}
    </ActiveStateContext.Provider>
  );
};

export const useActiveState = () => {
  const context = useContext(ActiveStateContext);
  if (context === undefined) {
    throw new Error('useActiveState must be used within an ActiveStateProvider');
  }
  return context;
}; 