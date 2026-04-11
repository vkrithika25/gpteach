import { useRef, useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Eraser, PenTool, Square, Circle, ArrowRight, Sparkles } from 'lucide-react';

type Tool = 'pen' | 'eraser' | 'rectangle' | 'circle' | 'arrow';

export function DiagramCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<Tool>('pen');
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [feedback, setFeedback] = useState<string | null>(null);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const updateCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      
      // Save existing image data only if canvas has valid dimensions
      let imageData = null;
      if (canvas.width > 0 && canvas.height > 0) {
        imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      }
      
      canvas.width = rect.width;
      canvas.height = rect.height;
      
      // Restore the image data if it was saved
      if (imageData && imageData.width > 0) {
        ctx.putImageData(imageData, 0, 0);
      }
      
      // Set default styles
      ctx.strokeStyle = '#fff';
      ctx.fillStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    };

    updateCanvasSize();
    setContext(ctx);
    window.addEventListener('resize', updateCanvasSize);

    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getCanvasCoordinates(e);
    setIsDrawing(true);
    setStartPos(pos);

    if (!context) return;

    if (tool === 'pen') {
      context.strokeStyle = '#fff';
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(pos.x, pos.y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !context) return;

    const pos = getCanvasCoordinates(e);

    if (tool === 'pen') {
      context.lineTo(pos.x, pos.y);
      context.stroke();
    } else if (tool === 'eraser') {
      context.clearRect(pos.x - 10, pos.y - 10, 20, 20);
    }
  };

  const stopDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !context) return;

    const pos = getCanvasCoordinates(e);

    if (tool === 'rectangle') {
      const width = pos.x - startPos.x;
      const height = pos.y - startPos.y;
      context.strokeStyle = '#fff';
      context.lineWidth = 2;
      context.strokeRect(startPos.x, startPos.y, width, height);
    } else if (tool === 'circle') {
      const radius = Math.sqrt(
        Math.pow(pos.x - startPos.x, 2) + Math.pow(pos.y - startPos.y, 2)
      );
      context.strokeStyle = '#fff';
      context.lineWidth = 2;
      context.beginPath();
      context.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
      context.stroke();
    } else if (tool === 'arrow') {
      drawArrow(context, startPos.x, startPos.y, pos.x, pos.y);
    } else if (tool === 'pen') {
      context.closePath();
    }

    setIsDrawing(false);
  };

  const drawArrow = (
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number
  ) => {
    const headLength = 15;
    const angle = Math.atan2(toY - fromY, toX - fromX);

    ctx.strokeStyle = '#fff';
    ctx.fillStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headLength * Math.cos(angle - Math.PI / 6),
      toY - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      toX - headLength * Math.cos(angle + Math.PI / 6),
      toY - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.lineTo(toX, toY);
    ctx.fill();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!context || !canvas) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    setFeedback(null);
  };

  const getFeedback = () => {
    const feedbackOptions = [
      "Great start! Consider adding more detail to your data flow. How does information move between components?",
      "Your diagram shows good structure. Try adding labels to your arrows to clarify the relationships.",
      "Nice work! Don't forget to show error handling paths in your flow diagram.",
      "Good organization! Consider using different shapes to distinguish between processes, data stores, and external entities.",
      "Your flow is logical. Make sure to indicate which operations are synchronous vs asynchronous.",
      "Excellent! You might want to add decision points (diamonds) to show conditional logic.",
    ];

    const randomFeedback = feedbackOptions[Math.floor(Math.random() * feedbackOptions.length)];
    setFeedback(randomFeedback);
    
    // Auto-hide feedback after 15 seconds
    setTimeout(() => {
      setFeedback(null);
    }, 15000);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900">
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-zinc-100">Flow Diagram Canvas</h2>
          <Button 
            type="button"
            onClick={(e) => {
              e.preventDefault();
              getFeedback();
            }} 
            size="sm" 
            variant="outline" 
            className="border-zinc-600 bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:text-zinc-100"
          >
            <Sparkles className="size-4 mr-1" />
            Get Feedback
          </Button>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={tool === 'pen' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTool('pen')}
            className={tool !== 'pen' ? 'border-zinc-600 bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:text-zinc-100' : ''}
          >
            <PenTool className="size-4" />
          </Button>
          <Button
            variant={tool === 'rectangle' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTool('rectangle')}
            className={tool !== 'rectangle' ? 'border-zinc-600 bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:text-zinc-100' : ''}
          >
            <Square className="size-4" />
          </Button>
          <Button
            variant={tool === 'circle' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTool('circle')}
            className={tool !== 'circle' ? 'border-zinc-600 bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:text-zinc-100' : ''}
          >
            <Circle className="size-4" />
          </Button>
          <Button
            variant={tool === 'arrow' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTool('arrow')}
            className={tool !== 'arrow' ? 'border-zinc-600 bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:text-zinc-100' : ''}
          >
            <ArrowRight className="size-4" />
          </Button>
          <Button
            variant={tool === 'eraser' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTool('eraser')}
            className={tool !== 'eraser' ? 'border-zinc-600 bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:text-zinc-100' : ''}
          >
            <Eraser className="size-4" />
          </Button>
          <div className="ml-auto">
            <Button onClick={clearCanvas} size="sm" variant="destructive">
              Clear
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 bg-zinc-950 relative">
        <canvas
          ref={canvasRef}
          className="w-full h-full bg-zinc-900 rounded border-2 border-zinc-800 cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={() => setIsDrawing(false)}
        />
      </div>

      {feedback && (
        <div className="p-4 border-t border-zinc-800 bg-zinc-950">
          <Card className="p-3 bg-blue-950 border-blue-900">
            <div className="flex gap-2">
              <Sparkles className="size-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm mb-1 text-blue-100">AI Feedback</p>
                <p className="text-sm text-blue-200">{feedback}</p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}