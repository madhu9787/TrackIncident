/**
 * Global Toast Context — wraps antd message API so any component
 * can call toast.success / toast.error without prop drilling.
 */
import { createContext, useContext } from 'react';
import { message } from 'antd';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [msgApi, contextHolder] = message.useMessage();

  const toast = {
    success: (content, duration = 3) => msgApi.success({ content, duration }),
    error:   (content, duration = 5) => msgApi.error({ content, duration }),
    info:    (content, duration = 3) => msgApi.info({ content, duration }),
    warning: (content, duration = 4) => msgApi.warning({ content, duration }),
    loading: (content, key)          => msgApi.loading({ content, key, duration: 0 }),
    destroy: (key)                   => msgApi.destroy(key),
  };

  return (
    <ToastContext.Provider value={toast}>
      {contextHolder}
      {children}
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
};
