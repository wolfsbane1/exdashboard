import React, { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Maximize2, X } from 'lucide-react';

interface MaximizeControlProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

const MAXIMIZE_OPEN_EVENT = 'exdash:maximize-open';

export const MaximizeControl: React.FC<MaximizeControlProps> = ({
  title,
  children,
  className = '',
  contentClassName = '',
}) => {
  const controlId = useId();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleOpen = (event: Event) => {
      const { detail } = event as CustomEvent<string>;
      if (detail !== controlId) setOpen(false);
    };

    window.addEventListener(MAXIMIZE_OPEN_EVENT, handleOpen);
    return () => window.removeEventListener(MAXIMIZE_OPEN_EVENT, handleOpen);
  }, [controlId]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const overlay = (
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.section
              role="dialog"
              aria-modal="true"
              aria-label={title}
              className="flex max-h-[92vh] w-[96vw] max-w-7xl flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl"
              initial={{ opacity: 0, scale: 0.96, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 18 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-5 py-4">
                <h2 className="min-w-0 truncate text-base font-semibold text-gray-800">{title}</h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                  aria-label={`Close ${title}`}
                  title={`Close ${title}`}
                >
                  <X size={17} />
                </button>
              </div>
              <div className={`maximized-widget-content flex-1 overflow-auto p-5 ${contentClassName}`}>
                {children}
              </div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
  );

  return (
    <>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          window.dispatchEvent(new CustomEvent(MAXIMIZE_OPEN_EVENT, { detail: controlId }));
          setOpen(true);
        }}
        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white/90 text-gray-500 shadow-sm transition-all duration-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600 ${className}`}
        aria-label={`Maximize ${title}`}
        title={`Maximize ${title}`}
      >
        <Maximize2 size={15} />
      </button>

      {mounted ? createPortal(overlay, document.body) : null}
    </>
  );
};

export default MaximizeControl;
