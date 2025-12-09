'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { ChevronUp } from 'lucide-react';

import { cn } from '@/lib/utils';

const horizontalNavButtonVariants = cva(
  'relative inline-flex flex-col items-center justify-center gap-1 whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/70 transition-colors duration-200',
  {
    variants: {
      intent: {
        default:
          'hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-accent',
        ghost: 'text-muted-foreground hover:text-foreground',
      },
      isActive: {
        true: 'text-sidebar-accent-foreground',
        false: '',
      },
    },
    defaultVariants: {
      intent: 'default',
      isActive: false,
    },
  },
);

function HorizontalNav({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="horizontal-nav"
      className={cn(
        'flex w-full items-center gap-4 bg-sidebar/40 px-4 py-2 text-sidebar-foreground backdrop-blur',
        className,
      )}
      {...props}
    />
  );
}

function HorizontalNavHeader({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="horizontal-nav-header"
      className={cn('flex flex-none items-center justify-start', className)}
      {...props}
    />
  );
}

function HorizontalNavContent({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="horizontal-nav-content"
      className={cn('flex flex-1 items-center justify-center', className)}
      {...props}
    />
  );
}

function HorizontalNavFooter({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="horizontal-nav-footer"
      className={cn('flex flex-none items-center justify-end', className)}
      {...props}
    />
  );
}

function HorizontalNavScrollArea({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="horizontal-nav-scroll-area"
      className={cn(
        'flex flex-1 items-center justify-center overflow-x-auto',
        '[&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-sidebar-border',
        className,
      )}
      {...props}
    />
  );
}

function HorizontalNavMenu({
  className,
  ...props
}: React.ComponentProps<'ul'>) {
  return (
    <ul
      data-slot="horizontal-nav-menu"
      className={cn('flex items-center justify-center gap-6', className)}
      {...props}
    />
  );
}

function HorizontalNavMenuItem({
  className,
  ...props
}: React.ComponentProps<'li'>) {
  return (
    <li
      data-slot="horizontal-nav-menu-item"
      className={cn('relative', className)}
      {...props}
    />
  );
}

function HorizontalNavMenuButton({
  asChild = false,
  isActive = false,
  showIndicator = false,
  intent,
  className,
  children,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof horizontalNavButtonVariants> & {
    asChild?: boolean;
    showIndicator?: boolean;
  }) {
  const renderContent = (label: React.ReactNode) => (
    <span className="flex flex-col items-center justify-center gap-1">
      {showIndicator && (
        <span
          aria-hidden
          className="block size-1 rounded-full bg-destructive"
        />
      )}
      <span className="leading-none">{label}</span>
      {isActive && (
        <ChevronUp
          aria-hidden
          className="h-3 w-3 text-sidebar-accent-foreground"
        />
      )}
    </span>
  );

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<{
      className?: string;
      children?: React.ReactNode;
    }>;

    return React.cloneElement(child, {
      ...props,
      className: cn(
        horizontalNavButtonVariants({ intent, isActive }),
        className,
        child.props.className,
      ),
      children: renderContent(child.props.children),
    });
  }

  return (
    <button
      data-slot="horizontal-nav-menu-button"
      data-active={isActive}
      className={cn(
        horizontalNavButtonVariants({ intent, isActive }),
        className,
      )}
      {...props}
    >
      {renderContent(children)}
    </button>
  );
}

function HorizontalNavMenuBadge({
  className,
  ...props
}: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="horizontal-nav-menu-badge"
      className={cn(
        'ml-1 rounded-full border border-sidebar-border px-2 py-0.5 text-[10px] uppercase text-sidebar-foreground/70',
        className,
      )}
      {...props}
    />
  );
}

export {
  HorizontalNav,
  HorizontalNavContent,
  HorizontalNavFooter,
  HorizontalNavHeader,
  HorizontalNavMenu,
  HorizontalNavMenuBadge,
  HorizontalNavMenuButton,
  HorizontalNavMenuItem,
  HorizontalNavScrollArea,
};
