'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

interface ButtonLoaderProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

function ButtonLoader({
  loading = false,
  loadingText,
  children,
  disabled,
  className,
  ...props
}: ButtonLoaderProps) {
  return (
    <Button
      disabled={disabled || loading}
      className={cn(loading && 'cursor-wait', className)}
      {...props}
    >
      {loading && <Spinner size="sm" className="mr-2" />}
      {loading && loadingText ? loadingText : children}
    </Button>
  );
}

ButtonLoader.displayName = 'ButtonLoader';

interface ConfirmButtonProps extends Omit<ButtonLoaderProps, 'onClick'> {
  onConfirm: () => void | Promise<void>;
  confirmMessage?: string;
  requireDoubleClick?: boolean;
}

function ConfirmButton({
  onConfirm,
  confirmMessage = 'Click again to confirm',
  requireDoubleClick = false,
  children,
  ...props
}: ConfirmButtonProps) {
  const [needsConfirm, setNeedsConfirm] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const handleClick = async () => {
    if (requireDoubleClick && !needsConfirm) {
      setNeedsConfirm(true);
      setTimeout(() => setNeedsConfirm(false), 3000);
      return;
    }

    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
      setNeedsConfirm(false);
    }
  };

  return (
    <ButtonLoader loading={loading} onClick={handleClick} {...props}>
      {needsConfirm ? confirmMessage : children}
    </ButtonLoader>
  );
}

ConfirmButton.displayName = 'ConfirmButton';

export { ButtonLoader, ConfirmButton };
