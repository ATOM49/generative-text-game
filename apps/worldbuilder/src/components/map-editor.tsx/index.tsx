'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Canvas, Circle, Line, Point, Polygon, Image } from 'fabric';
// Import correct event type
import type { TPointerEventInfo } from 'fabric';
import { useFormContext, useWatch } from 'react-hook-form';

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

interface MapEditorProps {
  imageUrl: string;
  onRegionCreated?: (boundary: [number, number][]) => void;
  onPolygonToolActivated?: () => void;
  activeRegionId?: string | null;
  activatePolygonTool?: boolean;
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
  const backgroundImageRef = useRef<Image | null>(null);
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
  //   console.log({ description });

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
  }, [shapes, toAbsolute]); // Initialize canvas
  useEffect(() => {
    if (!wrapperRef.current) return;

    const canvasEl = document.createElement('canvas');
    wrapperRef.current.appendChild(canvasEl);

    const fabricCanvas = new Canvas(canvasEl, {
      selection: true,
    });

    canvasRef.current = fabricCanvas;

    const setBackgroundImage = (fabricImg: Image) => {
      const canvasWidth = fabricCanvas.width || 1024;
      const canvasHeight = fabricCanvas.height || 768;

      // Calculate scaling to fit the canvas while maintaining aspect ratio
      const imgAspectRatio = fabricImg.width! / fabricImg.height!;
      const canvasAspectRatio = canvasWidth / canvasHeight;

      let scale;
      if (imgAspectRatio > canvasAspectRatio) {
        // Image is wider relative to canvas, scale by width
        scale = canvasWidth / fabricImg.width!;
      } else {
        // Image is taller relative to canvas, scale by height
        scale = canvasHeight / fabricImg.height!;
      }

      fabricImg.set({
        scaleX: scale,
        scaleY: scale,
        left: 0,
        top: 0,
      });

      fabricCanvas.backgroundImage = fabricImg;
      backgroundImageRef.current = fabricImg;
      fabricCanvas.renderAll();
    };

    const resizeCanvas = () => {
      const width = wrapperRef.current!.clientWidth;
      const height = wrapperRef.current!.clientHeight;

      // Store current canvas size for coordinate calculations
      canvasSizeRef.current = { width, height };

      canvasEl.width = width;
      canvasEl.height = height;
      fabricCanvas.setWidth(width);
      fabricCanvas.setHeight(height);

      // Resize background image if it exists
      if (backgroundImageRef.current) {
        setBackgroundImage(backgroundImageRef.current);
      }

      // Redraw all shapes with updated coordinates
      redrawShapes();
    };

    // Load background image
    Image.fromURL(imageUrl)
      .then((fabricImg) => {
        setBackgroundImage(fabricImg);
      })
      .catch(console.error);

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

          // Resize background image
          if (backgroundImageRef.current) {
            const fabricImg = backgroundImageRef.current;
            const imgAspectRatio = fabricImg.width! / fabricImg.height!;
            const canvasAspectRatio = width / height;

            let scale;
            if (imgAspectRatio > canvasAspectRatio) {
              scale = width / fabricImg.width!;
            } else {
              scale = height / fabricImg.height!;
            }

            fabricImg.set({
              scaleX: scale,
              scaleY: scale,
              left: 0,
              top: 0,
            });

            canvas.backgroundImage = fabricImg;
          }

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
  }, [imageUrl]);

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
        console.log({ newShape });
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

  console.log({ shapes });
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
