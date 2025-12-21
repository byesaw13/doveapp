import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';
import { cssVars } from '@/lib/design-tokens-utils';

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm',
        outline:
          'border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-sm',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'px-4 py-2',
        sm: 'rounded-md px-3 text-xs',
        lg: 'rounded-md px-8',
        icon: 'w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const heightStyle =
      size === 'sm'
        ? { height: 'var(--button-height-sm)' }
        : size === 'lg'
          ? { height: 'var(--button-height-lg)' }
          : { height: 'var(--button-height-md)' };

    const buttonElement = (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        style={heightStyle}
        ref={ref}
        {...props}
      />
    );

    if (asChild) {
      // For asChild usage, we'd need Slot, but since we're removing it,
      // let's just return a button for now
      return buttonElement;
    }
    return buttonElement;
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
