'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Canvas, Circle, Line, Point, Polygon, Image } from 'fabric';
// Import correct event type
import type { TPointerEventInfo } from 'fabric';
import { Button } from '@/components/ui/button';
import { MapPin, Square } from 'lucide-react';

type Tool = 'select' | 'polygon' | 'location';

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
  maxWidth: number,
  maxHeight: number,
): Promise<{ width: number; height: number }> {
  console.log('[loadBackgroundImage] Loading from:', imageUrl);

  try {
    // Create a promise that waits for the actual image to load
    const img = new window.Image();
    img.crossOrigin = 'anonymous';

    const imageLoadPromise = new Promise<HTMLImageElement>(
      (resolve, reject) => {
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = imageUrl;
      },
    );

    // Wait for the image to fully load
    const loadedImg = await imageLoadPromise;

    console.log('[loadBackgroundImage] Native image loaded:', {
      width: loadedImg.naturalWidth,
      height: loadedImg.naturalHeight,
    });

    // Now create Fabric image from the loaded image element
    const fabricImg = new Image(loadedImg);

    console.log('[loadBackgroundImage] Fabric image created:', {
      width: fabricImg.width,
      height: fabricImg.height,
    });

    // Get image dimensions
    const imgWidth = fabricImg.width || 1;
    const imgHeight = fabricImg.height || 1;

    // Calculate aspect ratio
    const aspectRatio = imgWidth / imgHeight;

    // Calculate scaled dimensions to fit within maxWidth and maxHeight
    let canvasWidth = maxWidth;
    let canvasHeight = maxHeight;

    // Scale to fit height, then adjust width based on aspect ratio
    canvasHeight = maxHeight;
    canvasWidth = Math.floor(canvasHeight * aspectRatio);

    // If width exceeds maxWidth, scale down based on width instead
    if (canvasWidth > maxWidth) {
      canvasWidth = maxWidth;
      canvasHeight = Math.floor(canvasWidth / aspectRatio);
    }

    console.log('[loadBackgroundImage] Calculated canvas dimensions:', {
      imgWidth,
      imgHeight,
      aspectRatio,
      maxWidth,
      maxHeight,
      canvasWidth,
      canvasHeight,
    });

    // Resize canvas to the calculated dimensions
    fabricCanvas.setWidth(canvasWidth);
    fabricCanvas.setHeight(canvasHeight);

    // Calculate scale factor to fit image in canvas
    const scale = canvasWidth / imgWidth;

    console.log('[loadBackgroundImage] Scale factor:', scale);

    // Set image properties with scaling
    fabricImg.set({
      selectable: false,
      evented: false,
      left: 0,
      top: 0,
      originX: 'left',
      originY: 'top',
      scaleX: scale,
      scaleY: scale,
    });

    // Set as background
    fabricCanvas.backgroundImage = fabricImg;
    fabricCanvas.renderAll();

    console.log('[loadBackgroundImage] Background set successfully');

    return { width: canvasWidth, height: canvasHeight };
  } catch (error) {
    console.error('[loadBackgroundImage] Error loading image:', error);
    throw error;
  }
}
// --- end helper ---

interface MapEditorProps {
  imageUrl: string;
  onRegionCreated?: (geom: { outer: { u: number; v: number }[] }) => void;
  onLocationCreated?: (coordRel: { u: number; v: number }) => void;
  onPolygonToolActivated?: () => void;
  activeRegionId?: string | null;
  activatePolygonTool?: boolean;
}

export default function MapEditor({
  imageUrl,
  onRegionCreated,
  onLocationCreated,
  onPolygonToolActivated,
  activeRegionId,
  activatePolygonTool = false,
}: MapEditorProps) {
  const canvasRef = useRef<Canvas | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [tool, setTool] = useState<Tool>('select');
  const [isDrawingPolygon, setIsDrawingPolygon] = useState(false);
  const [polygonPoints, setPolygonPoints] = useState<Point[]>([]);
  const [imageLoadError, setImageLoadError] = useState<string | null>(null);

  // Store shapes with relative coordinates
  const [shapes, setShapes] = useState<RelativeShape[]>([]);
  const canvasSizeRef = useRef({ width: 0, height: 0 });
  const isLoadingImageRef = useRef(false);

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
  const redrawShapesRef = useRef<() => void>(() => {});

  redrawShapesRef.current = () => {
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
  };

  const redrawShapes = useCallback(() => {
    redrawShapesRef.current?.();
  }, []);

  // Initialize canvas
  useEffect(() => {
    if (!wrapperRef.current) return;

    const canvasEl = document.createElement('canvas');
    wrapperRef.current.appendChild(canvasEl);

    // Get the parent container dimensions to constrain the canvas
    const parent = wrapperRef.current.parentElement;
    const maxWidth = parent?.clientWidth || 800;
    const maxHeight = parent?.clientHeight || 600;

    console.log('[MapEditor] Initializing canvas with constraints:', {
      maxWidth,
      maxHeight,
    });

    const fabricCanvas = new Canvas(canvasEl, {
      width: 100, // Temporary size, will be updated when image loads
      height: 100,
      selection: true,
      enableRetinaScaling: false,
      imageSmoothingEnabled: true,
      backgroundColor: '#f0f0f0', // Light gray to show canvas bounds
      renderOnAddRemove: true,
    });

    canvasRef.current = fabricCanvas;

    console.log('[MapEditor] Initial load', {
      imageUrl,
    });

    // Load the image and resize canvas to fit within constraints
    const loadTimeout = setTimeout(() => {
      isLoadingImageRef.current = true;
      setImageLoadError(null);
      loadBackgroundImage(fabricCanvas, imageUrl, maxWidth, maxHeight)
        .then(({ width, height }) => {
          console.log('[MapEditor] Canvas sized to image:', { width, height });
          canvasSizeRef.current = { width, height };
          // Redraw any existing shapes
          redrawShapes();
        })
        .catch((error) => {
          console.error('[MapEditor] Failed to load background image:', error);
          setImageLoadError(
            'Failed to load map image. The image URL may have expired. Please regenerate the map.',
          );
        })
        .finally(() => {
          isLoadingImageRef.current = false;
        });
    }, 50);

    return () => {
      clearTimeout(loadTimeout);
      if (canvasRef.current) {
        canvasRef.current.dispose();
      }
    };
  }, [imageUrl, redrawShapes]);

  // Handle redrawing only when importing shapes
  const isImporting = useRef(false);

  useEffect(() => {
    if (canvasRef.current && isImporting.current) {
      redrawShapesRef.current?.();
      isImporting.current = false;
    }
  }, [shapes]);

  // Drawing logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    console.log('drawing');
    const handleClick = (opt: TPointerEventInfo) => {
      const pointer = opt.pointer || { x: 0, y: 0 };
      const relativePoint = toRelative(pointer);

      if (tool === 'location') {
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

        // Call callback with location data
        if (onLocationCreated) {
          onLocationCreated({ u: relativePoint.x, v: relativePoint.y });
        }

        setTool('select'); // Switch back to select tool after creating location
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

        // Convert relative points to geom format and call callback
        if (onRegionCreated) {
          const outer = relativePoints.map((point) => ({
            u: point.x,
            v: point.y,
          }));
          onRegionCreated({ outer });
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
  }, [tool, polygonPoints, toRelative, onRegionCreated, onLocationCreated]); // Add dependencies

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
    <div className="w-full h-full relative overflow-auto bg-gray-100">
      {imageLoadError && (
        <div className="absolute top-20 left-4 right-4 z-20 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{imageLoadError}</span>
        </div>
      )}
      <div className="absolute top-4 left-4 z-10 bg-white rounded shadow-md p-2 space-x-2 flex flex-wrap items-center">
        <Button
          variant={tool === 'polygon' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setTool('polygon');
            setPolygonPoints([]);
          }}
        >
          <Square className="mr-2 h-4 w-4" />
          Add Region
        </Button>
        <Button
          variant={tool === 'location' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setTool('location');
            setPolygonPoints([]);
          }}
        >
          <MapPin className="mr-2 h-4 w-4" />
          Add Location
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setTool('select');
            setPolygonPoints([]);
          }}
        >
          Select
        </Button>
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
        {tool === 'location' && (
          <span className="ml-2 text-sm text-blue-700 font-medium">
            Click on the map to place a location
          </span>
        )}
      </div>
      <div
        ref={wrapperRef}
        className="w-full h-full flex items-center justify-center"
      />
    </div>
  );
}
