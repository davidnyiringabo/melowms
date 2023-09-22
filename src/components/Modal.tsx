import { PropsWithChildren, useEffect, useRef, useState } from 'react';
import { MdClose } from 'react-icons/md';
import ModalProvider, { ModalSize } from '../context/ModalContext';

type ModalProps = {
  title: string;
  modern?: boolean;
  size?: ModalSize;
  noTitle?: boolean;
  open: boolean;
  onClose: () => void;
} & PropsWithChildren;

const Modal = ({
  modern = false,
  open,
  noTitle = false,
  size: initialSize,
  children,
  title: initialTitle,
  onClose,
}: ModalProps) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [size, setSize] = useState<'lg' | 'xl' | undefined>(initialSize);
  const outerDivRef = useRef<HTMLDivElement>(null);

  const handleClose = () => {
    setModalOpen(false);
    onClose && onClose();
  };

  useEffect(() => setTitle(initialTitle), [initialTitle]);

  const changeSize = (size?: ModalSize) => {
    setSize(size);
  };

  const changeTitle = (newTitle: string) => setTitle(newTitle);

  useEffect(() => {
    setModalOpen(open);
  }, [open]);

  const result = (
    <ModalProvider
      isOpen={modalOpen}
      handleClose={handleClose}
      changeSize={changeSize}
      changeTitle={changeTitle}
    >
      <div
        ref={outerDivRef}
        id="authentication-modal"
        onDoubleClick={(e) => {
          e.stopPropagation();
          e.currentTarget.isSameNode(outerDivRef.current) && handleClose();
        }}
        aria-hidden="true"
        className={`${
          modalOpen ? 'flex' : 'hidden'
        } top-0 left-0 right-0 z-50 items-center fixed justify-center min-h-screen  w-full p-4 overflow-x-hidden  bg-black/20 md:inset-0 md:h-full`}
      >
        <div
          onDoubleClick={(e) => e.stopPropagation()}
          className={`${
            size
              ? size === 'lg'
                ? ' max-w-5xl w-full'
                : 'w-full '
              : 'max-w-full '
          } relative bg-white shadow-md  md:min-w-[450px] max-h-full h-[calc(100%-3rem)] overflow-y-auto rounded-lg md:h-auto ${
            modern
              ? ' inset-x-0 bottom-0 h-[90vh!important] w-full max-w-full'
              : ''
          }`}
        >
          <div className="relative rounded-lg ">
            <button
              type="button"
              onClick={handleClose}
              className={`absolute top-5 right-7 z-10 text-gray-400 bg-transparent border hover:border-red-400 hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center ${
                noTitle
                  ? 'top-1 bg-red-200 font-bold hover:border-red-500 right-1'
                  : ''
              } `}
              data-modal-hide="authentication-modal"
            >
              <MdClose className="text-md font-extrabold text-lg text-red-500" />
              <span className="sr-only">Close modal</span>
            </button>
            <div className="px-6 py-6 lg:px-8">
              {!noTitle && (
                <h3 className="mb-4 text-xl border-b pb-2 sticky font-medium text-gray-900 ">
                  {title}
                </h3>
              )}
              <div className="my-2 max-h-full">{children}</div>
            </div>
          </div>
        </div>
      </div>
    </ModalProvider>
  );

  return result;

  // return createPortal(result, document.getElementById('portal') as Element);
};

export default Modal;
