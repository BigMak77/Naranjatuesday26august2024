import React from 'react';

interface NeonToolbarProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * NeonToolbar - A standardized neon/orange toolbar for actions, icons, and controls.
 * Usage:
 * <NeonToolbar>
 *   <NeonIconButton ... />
 *   ...other controls...
 * </NeonToolbar>
 */
const NeonToolbar: React.FC<NeonToolbarProps> = ({ children, className = '' }) => {
  return (
    <div className={`neon-toolbar px-2 py-2 rounded center ${className}`.trim()}>
      {children}
    </div>
  );
};

export default NeonToolbar;
