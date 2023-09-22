import React, { PropsWithChildren } from 'react';

export type ModalSize = 'lg' | 'xl';
export type ModalControlProps = {
  isOpen: boolean;
  handleClose: () => void;
  changeSize: (size: ModalSize) => void;
  changeTitle: (newTitle: string) => void;
};

const ModalContext = React.createContext<ModalControlProps>({
  isOpen: false,
  handleClose: () => undefined,
  changeSize: (size: ModalSize) => undefined,
  changeTitle: (newTitle: string) => undefined,
});

export const useModalContext = () => React.useContext(ModalContext);

const ModalProvider = ({
  isOpen,
  changeSize,
  handleClose,
  changeTitle,
  children,
}: PropsWithChildren<ModalControlProps>) => {
  return (
    <ModalContext.Provider
      value={{ isOpen, changeTitle, changeSize, handleClose }}
    >
      {children}
    </ModalContext.Provider>
  );
};

export default ModalProvider;
