import React, { ReactNode } from 'react';

interface BoxProps {
  title: string;
  children: ReactNode;
  open?: boolean;
}

export const Box: React.FC<BoxProps> = ({ title, children, open = true }) => {
  return (
    <details open={open} className="panel-section">
      <summary>{title}</summary>
      <div className="section-body">{children}</div>
    </details>
  );
};