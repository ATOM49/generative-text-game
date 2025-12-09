import React from 'react';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { withHeader } from './withHeader';

interface EntityLayoutProps {
  left?: React.ReactNode;
  right?: React.ReactNode;
  children?: React.ReactNode;
  hideHandle?: boolean;
}

export function EntityLayoutBase({
  left,
  right,
  children,
  hideHandle,
}: EntityLayoutProps) {
  const hasLeft = !!left;
  const hasRight = !!right;
  const hasChildren = !!children;

  return (
    <ResizablePanelGroup direction="horizontal" className="h-full">
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
  );
}
export const EntityLayout = withHeader(EntityLayoutBase);
