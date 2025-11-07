import React from 'react';

interface WithHeaderProps {
  header: string;
  subheader?: string;
}

export function withHeader<P extends object>(
  Component: React.ComponentType<P>,
) {
  return function WithHeaderComponent({
    header,
    subheader,
    ...props
  }: P & WithHeaderProps) {
    return (
      <div className="h-full w-full flex flex-col p-6">
        <div className="mb-4 flex-shrink-0">
          <h1 className="text-2xl font-bold">{header}</h1>
          {subheader && (
            <h2 className="text-lg text-muted-foreground mb-2">{subheader}</h2>
          )}
        </div>
        <div className="flex-1 min-h-0">
          <Component {...(props as P)} />
        </div>
      </div>
    );
  };
}
