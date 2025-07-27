import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
} from "react";
import { useDevice } from "./DeviceContext";

type ModalButtonRole = "primary" | "error" | "info" | "default";
const getStyle = (role: ModalButtonRole) => {
  if (role === "default") return "btn";
  return "btn-" + role;
};

type ModalButton = {
  label: string;
  role?: ModalButtonRole;
  style?: string; // Only works on desktop
  onClick?: () => void;
};

type ModalOptions = {
  title?: string;
  description?: string;
  showDismissButton?: boolean;
  buttons?: ModalButton[];
};

type ModalContextType = {
  showModal: (options: ModalOptions) => void;
  hideModal: () => void;
};

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal must be used inside ModalProvider");
  return ctx;
};

export const ModalProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [modalOptions, setModalOptions] = useState<ModalOptions>({});
  const modalRef = useRef<HTMLDialogElement>(null);
  const { isMobile } = useDevice();

  const showModal = (options: ModalOptions) => {
    setModalOptions(options);
    setIsOpen(true);
  };

  const hideModal = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    if (isOpen) modalRef.current?.showModal();
    else modalRef.current?.close();
  }, [isOpen]);

  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;

    const handleClose = () => setIsOpen(false);
    modal.addEventListener("close", handleClose);
    return () => modal.removeEventListener("close", handleClose);
  }, []);

  return (
    <ModalContext.Provider value={{ showModal, hideModal }}>
      {children}

      <dialog ref={modalRef} className="modal">
        <div
          className={`bg-base-100 p-6 min-w-xs ${
            isMobile ? "text-center" : ""
          } rounded-2xl max-w-120 shadow-lg transition-all duration-300 origin-center ${
            isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}
        >
          <form method="dialog">
            {modalOptions.showDismissButton && (
              <button
                className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                onClick={hideModal}
              >
                ✕
              </button>
            )}
          </form>

          {modalOptions.title && (
            <h3 className={`font-bold ${!isMobile ? "text-lg" : ""}`}>
              {modalOptions.title}
            </h3>
          )}

          {modalOptions.description && (
            <p className={`py-4 ${isMobile ? "opacity-50" : ""}`}>
              {modalOptions.description}
            </p>
          )}

          <div className={`${isMobile ? "space-y-4" : "modal-action"}`}>
            {modalOptions.buttons?.map((btn, idx) => (
              <button
                key={idx}
                className={
                  isMobile
                    ? `btn ${
                        btn.role != "default"
                          ? getStyle(btn.role ?? "default")
                          : "bg-base-300"
                      } rounded-4xl w-full`
                    : `btn ${btn.style ?? ""}`
                }
                onClick={() => {
                  btn.onClick?.();
                  hideModal();
                }}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </dialog>
    </ModalContext.Provider>
  );
};
