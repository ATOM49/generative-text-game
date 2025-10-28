import React from 'react';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';

interface EntityLayoutProps {
  header: string;
  subheader?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  children?: React.ReactNode;
  hideHandle?: boolean;
}

export function EntityLayout({
  header,
  subheader,
  left,
  right,
  children,
  hideHandle,
}: EntityLayoutProps) {
  const hasLeft = !!left;
  const hasRight = !!right;
  const hasChildren = !!children;
  return (
    <div className="h-full w-full">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">{header}</h1>
        {subheader && (
          <h2 className="text-lg text-muted-foreground mb-2">{subheader}</h2>
        )}
      </div>
      <ResizablePanelGroup direction="horizontal">
        {hasLeft && (
          <ResizablePanel
            defaultSize={60}
            minSize={40}
            maxSize={60}
            className="p-2 border-r"
          >
            {left}
          </ResizablePanel>
        )}
        {!hideHandle && (hasLeft || hasRight || hasChildren) && (
          <ResizableHandle withHandle />
        )}
        {hasChildren && (
          <ResizablePanel defaultSize={40} minSize={40} className="p-2">
            {children}
          </ResizablePanel>
        )}
        {hasRight && (
          <>
            {!hideHandle && <ResizableHandle withHandle />}
            <ResizablePanel
              defaultSize={20}
              minSize={10}
              maxSize={40}
              className="p-2 border-l overflow-auto"
            >
              <ScrollArea>{right}</ScrollArea>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
}
