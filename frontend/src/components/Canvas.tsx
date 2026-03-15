import { useEffect, useRef, useState } from 'react';
import { socket } from '../store/gameStore';
import Toolbar, { ColorPalette, type DrawSettings } from './Toolbar';
import clsx from 'clsx';

interface CanvasProps {
  isDrawer: boolean;
}

interface Stroke {
  points: { x: number, y: number }[];
  color: string;
  size: number;
}

export default function Canvas({ isDrawer }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  // History
  const [history, setHistory] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);

  // Settings
  const [settings, setSettings] = useState<DrawSettings>({
    color: '#000000',
    size: 6,
    tool: 'brush'
  });

  const getPos = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    // Map client coordinates to logical canvas coordinates (800x600)
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const drawLine = (ctx: CanvasRenderingContext2D, start: {x:number,y:number}, end: {x:number,y:number}, color: string, size: number) => {
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
  };

  const drawAllLines = (ctx: CanvasRenderingContext2D, strokes: Stroke[]) => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height); // clear with white bg

      strokes.forEach(stroke => {
          if (stroke.points.length < 2) return;
          ctx.beginPath();
          ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
          for (let i = 1; i < stroke.points.length; i++) {
              ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
          }
          ctx.strokeStyle = stroke.color;
          ctx.lineWidth = stroke.size;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.stroke();
      });
  };

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawAllLines(ctx, history);
  };

  // --- Socket Listeners ---
  useEffect(() => {
    const handleDrawMove = (data: { stroke: Stroke }) => {
        setHistory(prev => {
            const next = [...prev];
            // If the last stroke doesn't have the same length (it's new), just append
            // We need a more robust way to sync ongoing strokes, but for simplicity:
            // The server just broadcasts complete stroke segments, or updates the whole history.
            // Let's assume the remote user sends chunks.
            // A simpler approach is to have the remote client send individual line_to commands,
            // but for undo support, it's easier to maintain an array of strokes.
            return next;
        });
    };

    socket.on('draw_start', (data: { point: {x:number, y:number}, color: string, size: number }) => {
      // Create a remote stroke
      setHistory(prev => [...prev, { points: [data.point], color: data.color, size: data.size }]);
    });

    socket.on('draw_move', (data: { point: {x:number, y:number} }) => {
       setHistory(prev => {
           if (prev.length === 0) return prev;
           const newHistory = [...prev];
           const lastStroke = { ...newHistory[newHistory.length - 1] };
           
           const canvas = canvasRef.current;
           const ctx = canvas?.getContext('2d');
           if (ctx && lastStroke.points.length > 0) {
              const lastPoint = lastStroke.points[lastStroke.points.length - 1];
              drawLine(ctx, lastPoint, data.point, lastStroke.color, lastStroke.size);
           }

           lastStroke.points = [...lastStroke.points, data.point];
           newHistory[newHistory.length - 1] = lastStroke;
           return newHistory;
       });
    });

    socket.on('draw_end', () => {
        // Handle end if needed
    });

    socket.on('canvas_clear', () => {
        setHistory([]);
        const canvas = canvasRef.current;
        if (canvas) {
           const ctx = canvas.getContext('2d');
           if (ctx) {
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
           }
        }
    });

    return () => {
       socket.off('draw_start');
       socket.off('draw_move');
       socket.off('draw_end');
       socket.off('canvas_clear');
    };
  }, []);

  // Update canvas on history change for Undo
  useEffect(() => {
     redrawCanvas();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history.length]); 

  // --- Handlers ---
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawer) return;
    setIsDrawing(true);
    const pos = getPos(e);
    
    const actualColor = settings.tool === 'eraser' ? '#ffffff' : settings.color;
    
    const newStroke: Stroke = {
        points: [pos],
        color: actualColor,
        size: settings.size
    };
    
    setCurrentStroke(newStroke);
    setHistory(prev => [...prev, newStroke]);

    socket.emit('draw_start', { point: pos, color: actualColor, size: settings.size });
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawer || !isDrawing || !currentStroke) return;
    
    const pos = getPos(e);
    const lastPoint = currentStroke.points[currentStroke.points.length - 1];

    if (canvasRef.current) {
       const ctx = canvasRef.current.getContext('2d');
       if (ctx) {
          drawLine(ctx, lastPoint, pos, currentStroke.color, currentStroke.size);
       }
    }

    currentStroke.points.push(pos);
    socket.emit('draw_move', { point: pos });
  };

  const stopDrawing = () => {
    if (!isDrawer || !isDrawing) return;
    setIsDrawing(false);
    
    // Finalize stroke in history
    if (currentStroke) {
       setHistory(prev => {
           const newHistory = [...prev];
           newHistory[newHistory.length - 1] = currentStroke;
           return newHistory;
       });
    }
    setCurrentStroke(null);
    socket.emit('draw_end');
  };

  const handleClear = () => {
     setHistory([]);
  };

  const handleUndo = () => {
      setHistory(prev => prev.slice(0, -1));
      socket.emit('canvas_clear'); // Naive undo broadcast: clear and resend history
      // Note: A true production app would have a specific `undo_stroke` event
      // For simplicity, we clear everyone and if we wanted we'd re-emit the entire history.
      // But for now, we'll just clear locally. Properly syncing undo requires more logic.
  };

  // Initial fill
  useEffect(() => {
      if (canvasRef.current) {
         const ctx = canvasRef.current.getContext('2d');
         if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
         }
      }
  }, []);

  return (
    <div className="flex flex-col h-full bg-white relative">
      <div 
         ref={containerRef}
         className="flex-1 w-full bg-neutral-200 overflow-hidden relative cursor-crosshair flex items-center justify-center p-2"
      >
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className={clsx(
            "bg-white shadow-xl max-w-full max-h-full object-contain rounded-lg inset-0",
            !isDrawer && "pointer-events-none"
          )}
          style={{ 
            aspectRatio: '800/600',
            touchAction: 'none' // Prevent scrolling on mobile while drawing
          }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />

        {/* Overlay for Non-drawers */}
        {!isDrawer && (
           <div className="absolute inset-0 pointer-events-none pointer-events-auto" /> 
        )}
      </div>

      {isDrawer && (
        <div className="flex bg-neutral-900 border-t border-white/5 w-full">
            <Toolbar 
                settings={settings} 
                setSettings={(s) => setSettings({...settings, tool: s.tool, size: s.size})} 
                onClear={handleClear}
                onUndo={handleUndo} 
            />
            <ColorPalette 
                current={settings.tool === 'eraser' ? '#ffffff' : settings.color} 
                onChange={(c) => {
                    setSettings({ ...settings, color: c, tool: 'brush' });
                }} 
            />
        </div>
      )}
    </div>
  );
}
