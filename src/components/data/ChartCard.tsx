import React from 'react';
import { motion } from 'framer-motion';
import MaximizeControl from '../utility/MaximizeControl';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  children,
  className = '',
}) => {
  return (
    <motion.div
      initial={fadeIn.initial}
      animate={fadeIn.animate}
      transition={fadeIn.transition}
      className={`bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-200 ${className}`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-gray-800">{title}</h3>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
          )}
        </div>
        <MaximizeControl title={title} contentClassName="min-h-[68vh]">
          <div className="min-h-[68vh] w-full">
            {children}
          </div>
        </MaximizeControl>
      </div>
      <div className="min-h-[320px] w-full">
        {children}
      </div>
    </motion.div>
  );
};

export default ChartCard;

export { ChartCard };
