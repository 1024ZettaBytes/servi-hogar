import { createContext, useState, useContext, ReactNode } from 'react';

interface UserBlockedContextType {
  showBlockedModal: () => void;
  hideBlockedModal: () => void;
  isBlockedModalOpen: boolean;
}

const UserBlockedContext = createContext<UserBlockedContextType>({
  showBlockedModal: () => {},
  hideBlockedModal: () => {},
  isBlockedModalOpen: false
});

export const useUserBlocked = () => useContext(UserBlockedContext);

interface UserBlockedProviderProps {
  children: ReactNode;
}

export function UserBlockedProvider({ children }: UserBlockedProviderProps) {
  const [isBlockedModalOpen, setIsBlockedModalOpen] = useState(false);

  const showBlockedModal = () => {
    setIsBlockedModalOpen(true);
  };

  const hideBlockedModal = () => {
    setIsBlockedModalOpen(false);
  };

  return (
    <UserBlockedContext.Provider
      value={{
        showBlockedModal,
        hideBlockedModal,
        isBlockedModalOpen
      }}
    >
      {children}
    </UserBlockedContext.Provider>
  );
}
