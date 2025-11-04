'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Canvas, Circle, Line, Point, Polygon, Image } from 'fabric';
// Import correct event type
import type { TPointerEventInfo } from 'fabric';

type Tool = 'select' | 'polygon' | 'line' | 'dot';

// Relative coordinate types (0-1 range)
interface RelativePoint {
  x: number;
  y: number;
}

interface RelativeShape {
  id: string;
  type: 'dot' | 'line' | 'polygon';
  points: RelativePoint[];
  style?: any;
}

// --- Background image helper ---
async function loadBackgroundImage(
  fabricCanvas: Canvas,
  imageUrl: string,
): Promise<void> {
  console.log('[loadBackgroundImage] Loading from:', imageUrl);

  // Use Fabric's Image.fromURL to load the image
  const fabricImg = await Image.fromURL(imageUrl, {
    crossOrigin: 'anonymous',
  });

  console.log('[loadBackgroundImage] Image loaded:', {
    width: fabricImg.width,
    height: fabricImg.height,
  });

  const canvasWidth = fabricCanvas.getWidth();
  const canvasHeight = fabricCanvas.getHeight();

  // Calculate scaling to fit canvas while maintaining aspect ratio
  const imgWidth = fabricImg.width || 1;
  const imgHeight = fabricImg.height || 1;
  const imgAspectRatio = imgWidth / imgHeight;
  const canvasAspectRatio = canvasWidth / canvasHeight;

  let scale;
  if (imgAspectRatio > canvasAspectRatio) {
    scale = canvasWidth / imgWidth;
  } else {
    scale = canvasHeight / imgHeight;
  }

  // Set image properties
  fabricImg.set({
    scaleX: scale,
    scaleY: scale,
    left: 0,
    top: 0,
    selectable: false,
    evented: false,
  });

  // Set as background using Fabric's property
  fabricCanvas.backgroundImage = fabricImg;
  fabricCanvas.renderAll();
  console.log('[loadBackgroundImage] Background set successfully');
}
// --- end helper ---

interface MapEditorProps {
  imageUrl: string;
  onRegionCreated?: (boundary: [number, number][]) => void;
  onPolygonToolActivated?: () => void;
  activeRegionId?: string | null;
  activatePolygonTool?: boolean;
}

// Helper to convert external URLs to proxied URLs
function getProxiedImageUrl(imageUrl: string): string {
  // Check if it's an external URL that needs proxying
  if (
    imageUrl.includes('oaidalleapiprodscus.blob.core.windows.net') ||
    imageUrl.includes('dalleprodsec.blob.core.windows.net') ||
    imageUrl.includes('cdn.openai.com')
  ) {
    return `/api/images/proxy?url=${encodeURIComponent(imageUrl)}`;
  }
  return imageUrl;
}

export default function MapEditor({
  imageUrl,
  onRegionCreated,
  onPolygonToolActivated,
  activeRegionId,
  activatePolygonTool = false,
}: MapEditorProps) {
  const canvasRef = useRef<Canvas | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [tool, setTool] = useState<Tool>('select');
  const [isDrawingPolygon, setIsDrawingPolygon] = useState(false);
  const [polygonPoints, setPolygonPoints] = useState<Point[]>([]);

  // Store shapes with relative coordinates
  const [shapes, setShapes] = useState<RelativeShape[]>([]);
  const canvasSizeRef = useRef({ width: 0, height: 0 });

  // Effect to activate polygon tool when requested
  useEffect(() => {
    if (activatePolygonTool) {
      setTool('polygon');
      if (onPolygonToolActivated) {
        onPolygonToolActivated();
      }
    }
  }, [activatePolygonTool, onPolygonToolActivated]);

  //   const { control } = useFormContext();

  //   const description = useWatch({ control, name: 'description' });

  // Helper functions for coordinate conversion
  const toRelative = useCallback(
    (absolutePoint: { x: number; y: number }): RelativePoint => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };

      return {
        x: absolutePoint.x / canvas.width!,
        y: absolutePoint.y / canvas.height!,
      };
    },
    [],
  );

  const toAbsolute = useCallback(
    (relativePoint: RelativePoint): { x: number; y: number } => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };

      return {
        x: relativePoint.x * canvas.width!,
        y: relativePoint.y * canvas.height!,
      };
    },
    [],
  );

  // Function to redraw all shapes from relative coordinates
  const redrawShapes = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Clear existing shapes (keep background image)
    // Only remove objects that have shapeId (our drawn shapes)
    const objects = canvas.getObjects().filter((obj) => (obj as any).shapeId);
    objects.forEach((obj) => canvas.remove(obj));

    // Redraw all shapes from stored relative coordinates
    shapes.forEach((shape) => {
      if (shape.type === 'dot' && shape.points.length > 0) {
        const point = toAbsolute(shape.points[0]);
        const circle = new Circle({
          left: point.x,
          top: point.y,
          radius: 5,
          fill: 'red',
          selectable: false,
        });
        (circle as any).shapeId = shape.id; // Store reference to shape
        canvas.add(circle);
      } else if (shape.type === 'line' && shape.points.length === 2) {
        const point1 = toAbsolute(shape.points[0]);
        const point2 = toAbsolute(shape.points[1]);
        const line = new Line([point1.x, point1.y, point2.x, point2.y], {
          stroke: 'blue',
          strokeWidth: 2,
          selectable: false,
        });
        (line as any).shapeId = shape.id;
        canvas.add(line);
      } else if (shape.type === 'polygon' && shape.points.length > 2) {
        const points = shape.points.map((p) => {
          const abs = toAbsolute(p);
          return new Point(abs.x, abs.y);
        });
        const poly = new Polygon(points, {
          fill: 'rgba(0,0,255,0.2)',
          stroke: 'blue',
          strokeWidth: 2,
          selectable: false,
        });
        (poly as any).shapeId = shape.id;
        canvas.add(poly);
      }
    });

    canvas.renderAll();
  }, [shapes, toAbsolute]);

  // Initialize canvas
  useEffect(() => {
    if (!wrapperRef.current) return;

    const canvasEl = document.createElement('canvas');
    wrapperRef.current.appendChild(canvasEl);

    // Get initial dimensions
    const width = wrapperRef.current.clientWidth;
    const height = wrapperRef.current.clientHeight;

    const fabricCanvas = new Canvas(canvasEl, {
      width,
      height,
      selection: true,
      enableRetinaScaling: false,
      imageSmoothingEnabled: true,
    });

    canvasRef.current = fabricCanvas;
    canvasSizeRef.current = { width, height };

    // Use proxied URL to avoid CORS issues
    const proxiedImageUrl = getProxiedImageUrl(imageUrl);
    console.log('[MapEditor] Initial load', { imageUrl, proxiedImageUrl });

    // Load background image using simplified Fabric.js method
    loadBackgroundImage(fabricCanvas, proxiedImageUrl).catch((error) => {
      console.error('[MapEditor] Failed to load background image:', error);
    });

    // Add ResizeObserver to detect when the wrapper element resizes
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const canvas = canvasRef.current;

        if (
          canvas &&
          (width !== canvasSizeRef.current.width ||
            height !== canvasSizeRef.current.height)
        ) {
          // Update canvas size
          canvasSizeRef.current = { width, height };
          canvas.setWidth(width);
          canvas.setHeight(height);

          // Reload background image for the new canvas size
          const proxiedImageUrl = getProxiedImageUrl(imageUrl);
          loadBackgroundImage(canvas, proxiedImageUrl).catch(console.error);

          // Redraw all shapes
          redrawShapes();
        }
      }
    });

    resizeObserver.observe(wrapperRef.current);

    return () => {
      resizeObserver.disconnect();
      fabricCanvas.dispose();
    };
  }, [imageUrl, redrawShapes]);

  // Handle redrawing only when importing shapes
  const isImporting = useRef(false);

  useEffect(() => {
    if (canvasRef.current && isImporting.current) {
      redrawShapes();
      isImporting.current = false;
    }
  }, [shapes, redrawShapes]);

  // Drawing logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    console.log('drawing');
    const handleClick = (opt: TPointerEventInfo) => {
      const pointer = opt.pointer || { x: 0, y: 0 };
      const relativePoint = toRelative(pointer);

      if (tool === 'dot') {
        const circle = new Circle({
          left: pointer.x,
          top: pointer.y,
          radius: 5,
          fill: 'red',
          selectable: false,
        });
        canvas.add(circle);

        // Store the shape with relative coordinates
        const newShape: RelativeShape = {
          id: crypto.randomUUID(),
          type: 'dot',
          points: [relativePoint],
        };
        setShapes((prev) => [...prev, newShape]);
        (circle as any).shapeId = newShape.id;
      }

      if (tool === 'line') {
        const prev = (canvas as any).__lastLinePoint;
        const prevRelative = (canvas as any).__lastLinePointRelative;

        if (prev && prevRelative) {
          const line = new Line([prev.x, prev.y, pointer.x, pointer.y], {
            stroke: 'blue',
            strokeWidth: 2,
            selectable: false,
          });
          canvas.add(line);

          // Store the shape with relative coordinates
          const newShape: RelativeShape = {
            id: crypto.randomUUID(),
            type: 'line',
            points: [prevRelative, relativePoint],
          };
          setShapes((prev) => [...prev, newShape]);
          (line as any).shapeId = newShape.id;

          delete (canvas as any).__lastLinePoint;
          delete (canvas as any).__lastLinePointRelative;
        } else {
          (canvas as any).__lastLinePoint = pointer;
          (canvas as any).__lastLinePointRelative = relativePoint;
        }
      }

      if (tool === 'polygon') {
        setPolygonPoints((prev) => [...prev, new Point(pointer.x, pointer.y)]);
        setIsDrawingPolygon(true);
      }

      canvas.renderAll();
    };

    const handleDoubleClick = () => {
      if (tool === 'polygon' && polygonPoints.length > 2) {
        const poly = new Polygon(polygonPoints, {
          fill: 'rgba(0,0,255,0.2)',
          stroke: 'blue',
          strokeWidth: 2,
          selectable: false,
        });
        canvas.add(poly);

        // Convert polygon points to relative coordinates
        const relativePoints = polygonPoints.map((point) =>
          toRelative({ x: point.x, y: point.y }),
        );

        const newShape: RelativeShape = {
          id: crypto.randomUUID(),
          type: 'polygon',
          points: relativePoints,
        };
        setShapes((prev) => [...prev, newShape]);
        (poly as any).shapeId = newShape.id;

        // Convert relative points to boundary format and call callback
        if (onRegionCreated) {
          const boundary: [number, number][] = relativePoints.map((point) => [
            point.x,
            point.y,
          ]);
          onRegionCreated(boundary);
        }

        setPolygonPoints([]);
        setIsDrawingPolygon(false);
        setTool('select'); // Switch back to select tool after creating region
        canvas.renderAll();
      }
    };

    canvas.on('mouse:down', handleClick);
    canvas.on('mouse:dblclick', handleDoubleClick);

    return () => {
      canvas.off('mouse:down', handleClick);
      canvas.off('mouse:dblclick', handleDoubleClick);
    };
  }, [tool, polygonPoints, toRelative]); // Add dependencies

  // Add functions to save/load shape data
  const exportShapes = useCallback(() => {
    return JSON.stringify(shapes, null, 2);
  }, [shapes]);

  const importShapes = useCallback((shapesJson: string) => {
    try {
      const importedShapes = JSON.parse(shapesJson) as RelativeShape[];
      isImporting.current = true;
      setShapes(importedShapes);
    } catch (error) {
      console.error('Error importing shapes:', error);
    }
  }, []);

  // Expose functions for parent components
  useEffect(() => {
    // You can expose these functions through a ref or callback props if needed
    (window as any).__mapEditor = {
      exportShapes,
      importShapes,
      shapes,
    };
  }, [exportShapes, importShapes, shapes]);

  return (
    <div className="w-full h-screen relative">
      <div className="absolute top-4 left-4 z-10 bg-white rounded shadow-md p-2 space-x-2 flex flex-wrap items-center">
        {(['select', 'polygon', 'line', 'dot'] as Tool[]).map((t) => (
          <button
            key={t}
            className={`px-2 py-1 rounded ${tool === t ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            onClick={() => {
              setTool(t);
              if (t !== 'polygon') setPolygonPoints([]);
            }}
          >
            {t}
          </button>
        ))}
        <button
          className="px-2 py-1 rounded bg-red-500 text-white hover:bg-red-600"
          onClick={() => {
            setShapes([]);
            setPolygonPoints([]);
            setIsDrawingPolygon(false);
            // Clear shapes from canvas
            const canvas = canvasRef.current;
            if (canvas) {
              const objects = canvas
                .getObjects()
                .filter((obj) => (obj as any).shapeId);
              objects.forEach((obj) => canvas.remove(obj));
              canvas.renderAll();
            }
          }}
        >
          Clear
        </button>
        <button
          className="px-2 py-1 rounded bg-green-500 text-white hover:bg-green-600"
          onClick={() => {
            const data = exportShapes();
            navigator.clipboard.writeText(data);
            alert('Shape data copied to clipboard!');
          }}
        >
          Export
        </button>
        <button
          className="px-2 py-1 rounded bg-blue-500 text-white hover:bg-blue-600"
          onClick={() => {
            const data = prompt('Paste shape data:');
            if (data) {
              importShapes(data);
            }
          }}
        >
          Import
        </button>
        {tool === 'polygon' && isDrawingPolygon && (
          <span className="ml-2 text-sm text-gray-700">
            Double click to finish polygon
          </span>
        )}
        {tool === 'polygon' && !isDrawingPolygon && (
          <span className="ml-2 text-sm text-blue-700 font-medium">
            Click to start drawing region boundary
          </span>
        )}
        <div className="text-xs text-gray-600 ml-2">
          Shapes: {shapes.length}
        </div>
      </div>
      <div ref={wrapperRef} className="w-full h-full" />
    </div>
  );
}
