import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, XCircle, Info, CheckCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import MaximizeControl from '../utility/MaximizeControl';

interface AlertCardProps {
  type: 'warning' | 'critical' | 'info' | 'success';
  title: string;
  message: string;
  metric?: string;
  value?: string;
}

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

interface AlertTheme {
  bg: string;
  border: string;
  borderLeft: string;
  text: string;
  icon: LucideIcon;
}

const alertThemes: Record<string, AlertTheme> = {
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    borderLeft: 'border-l-amber-500',
    text: 'text-amber-800',
    icon: AlertTriangle,
  },
  critical: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    borderLeft: 'border-l-red-500',
    text: 'text-red-800',
    icon: XCircle,
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    borderLeft: 'border-l-blue-500',
    text: 'text-blue-800',
    icon: Info,
  },
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    borderLeft: 'border-l-green-500',
    text: 'text-green-800',
    icon: CheckCircle,
  },
};

const AlertCard: React.FC<AlertCardProps> = ({
  type,
  title,
  message,
  metric,
  value,
}) => {
  const theme = alertThemes[type];
  const IconComponent = theme.icon;
  const content = (
    <div className="flex items-start gap-3">
      <IconComponent size={18} className={`${theme.text} flex-shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        <h4 className={`font-semibold text-sm ${theme.text}`}>{title}</h4>
        <p className={`text-sm ${theme.text} opacity-80 mt-1`}>{message}</p>
        {metric && value && (
          <div className={`mt-2 flex items-center gap-2 text-sm ${theme.text}`}>
            <span className="font-medium">{metric}:</span>
            <span className="font-bold">{value}</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <motion.div
      initial={fadeIn.initial}
      animate={fadeIn.animate}
      transition={fadeIn.transition}
      className={`rounded-xl border ${theme.border} border-l-4 ${theme.borderLeft} ${theme.bg} p-4`}
    >
      <div className="mb-2 flex justify-end">
        <MaximizeControl title={title} contentClassName="flex min-h-[50vh] items-center justify-center">
          <div className={`w-full max-w-2xl rounded-xl border ${theme.border} border-l-4 ${theme.borderLeft} ${theme.bg} p-8 shadow-sm`}>
            {content}
          </div>
        </MaximizeControl>
      </div>
      {content}
    </motion.div>
  );
};

export default AlertCard;

export { AlertCard };
