import * as React from 'react';
import { useRef, useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { ChevronDown, ChevronUp, Eraser, PenTool, Square, Circle, ArrowRight, Sparkles } from 'lucide-react';
import { useProjects } from '../contexts/ProjectContext';
import { getCanvasFeedback } from '../lib/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Tool = 'pen' | 'eraser' | 'rectangle' | 'circle' | 'arrow';

export function DiagramCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { backendSessionId, currentProject } = useProjects();
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<Tool>('pen');
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(true);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [isGettingFeedback, setIsGettingFeedback] = useState(false);
  const saveTimerRef = useRef<number | null>(null);

  const canvasStorageKey = React.useMemo(() => {
    const projectId = currentProject?.id ?? 'unknown-project';
    return `gpteach:canvas:v1:${projectId}`;
  }, [currentProject?.id]);

  const persistCanvasSoon = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      try {
        localStorage.setItem(canvasStorageKey, canvas.toDataURL('image/png'));
      } catch (e) {
        console.warn('Failed to persist canvas:', e);
      }
    }, 250);
  }, [canvasStorageKey]);

  const clearPersistedCanvas = React.useCallback(() => {
    try {
      localStorage.removeItem(canvasStorageKey);
    } catch (e) {
      console.warn('Failed to clear persisted canvas:', e);
    }
  }, [canvasStorageKey]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const setDefaultStyles = () => {
      ctx.strokeStyle = '#fff';
      ctx.fillStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    };

    const drawStoredImage = () => {
      try {
        const dataUrl = localStorage.getItem(canvasStorageKey);
        if (!dataUrl) return;
        const img = new Image();
        img.onload = () => {
          // Draw scaled to fit current canvas size.
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          setDefaultStyles();
        };
        img.src = dataUrl;
      } catch (e) {
        console.warn('Failed to load persisted canvas:', e);
      }
    };

    // Set canvas size (called by ResizeObserver); keep bitmap content.
    const updateCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      const nextW = Math.max(1, Math.floor(rect.width));
      const nextH = Math.max(1, Math.floor(rect.height));
      if (canvas.width === nextW && canvas.height === nextH) return;

      // Save current pixels by snapshotting to an image.
      const snapshotUrl = canvas.width > 0 && canvas.height > 0 ? canvas.toDataURL('image/png') : null;

      canvas.width = nextW;
      canvas.height = nextH;

      setDefaultStyles();

      if (snapshotUrl) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          setDefaultStyles();
        };
        img.src = snapshotUrl;
      } else {
        drawStoredImage();
      }
    };

    // Initial sizing + restore persisted drawing.
    updateCanvasSize();
    drawStoredImage();
    setContext(ctx);

    // Track size changes from pane toggles/resizing and feedback collapse/expand.
    const ro = new ResizeObserver(() => updateCanvasSize());
    ro.observe(canvas);

    return () => {
      ro.disconnect();
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, [canvasStorageKey]);

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
    persistCanvasSoon();
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
    clearPersistedCanvas();
  };

  const getFeedback = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !backendSessionId) {
      setFeedback("Couldn’t request feedback. Make sure the backend session is ready.");
      return;
    }

    setIsGettingFeedback(true);
    setFeedback(null);

    try {
      const imageDataUrl = canvas.toDataURL('image/png');
      const resp = await getCanvasFeedback({
        session_id: backendSessionId,
        image_data_url: imageDataUrl,
      });
      const md = (resp.feedback_markdown ?? '').trim();
      setFeedback(md.length > 0 ? md : 'No feedback returned. Try again, or add more detail/labels to the diagram.');
      setShowFeedback(true);
    } catch (e) {
      console.error('Failed to get canvas feedback:', e);
      setFeedback("Sorry — I couldn’t get feedback right now. Please make sure the backend is running and try again.");
      setShowFeedback(true);
    } finally {
      setIsGettingFeedback(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900 overflow-hidden">
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-zinc-100">Flow Diagram Canvas</h2>
          <div className="flex items-center gap-2">
            {feedback !== null && (
              <Button
                type="button"
                onClick={() => setShowFeedback((v) => !v)}
                size="sm"
                variant="outline"
                className="border-zinc-600 bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:text-zinc-100"
              >
                {showFeedback ? <ChevronDown className="size-4 mr-1" /> : <ChevronUp className="size-4 mr-1" />}
                {showFeedback ? 'Hide Feedback' : 'Show Feedback'}
              </Button>
            )}
            <Button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                getFeedback();
              }} 
              size="sm" 
              variant="outline" 
              className="border-zinc-600 bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:text-zinc-100"
              disabled={isGettingFeedback}
            >
              <Sparkles className="size-4 mr-1" />
              {isGettingFeedback ? 'Getting feedback...' : 'Get Feedback'}
            </Button>
          </div>
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

      <div className="flex-1 min-h-0 flex flex-col bg-zinc-950">
        <div className="flex-1 min-h-0 p-4">
          <canvas
            ref={canvasRef}
            className="w-full h-full bg-zinc-900 rounded border-2 border-zinc-800 cursor-crosshair"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={() => setIsDrawing(false)}
          />
        </div>

        {feedback !== null && showFeedback && (
          <div className="border-t border-zinc-800 bg-zinc-950 p-4 max-h-72 overflow-auto">
            <Card className="p-3 bg-blue-950 border-blue-900">
              <div className="flex gap-2">
                <Sparkles className="size-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm mb-1 text-blue-100">AI Feedback</p>
                  <div className="text-sm text-blue-200 max-w-none prose prose-invert prose-sm prose-headings:text-blue-100 prose-p:text-blue-200 prose-strong:text-blue-100 prose-ul:text-blue-200 prose-ol:text-blue-200 prose-a:text-blue-300 prose-a:no-underline hover:prose-a:underline">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{feedback}</ReactMarkdown>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}