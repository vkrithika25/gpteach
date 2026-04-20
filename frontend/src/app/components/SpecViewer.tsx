import * as React from 'react';
import { useState, useRef, useEffect, type MouseEvent as ReactMouseEvent } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Send, MessageCircle, X, Trash2, Loader2 } from 'lucide-react';
import { useProjects } from '../contexts/ProjectContext';
import { teachRespond } from '../lib/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Annotation {
  id: string;
  type: 'ai' | 'note';
  question: string;
  answer: string;
  highlightedText: string;
  color: string;
  borderColor: string;
  sectionId: string;
  startOffset: number;
  endOffset: number;
}

interface SelectionInfo {
  text: string;
  range: Range;
  startOffset: number;
  endOffset: number;
  pendingMarkId: string;
}

export function SpecViewer() {
  const { currentProject, backendSessionId } = useProjects();
  const [isAsking, setIsAsking] = useState(false);
  const [selectionInfo, setSelectionInfo] = useState<SelectionInfo | null>(null);
  const [showQuestionBox, setShowQuestionBox] = useState(false);
  const [questionBoxPosition, setQuestionBoxPosition] = useState({ top: 0, left: 0 });
  const [composeMode, setComposeMode] = useState<'ask' | 'note'>('ask');
  const [question, setQuestion] = useState('');
  const [note, setNote] = useState('');
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedAnnotation, setSelectedAnnotation] = useState<Annotation | null>(null);
  const [annotationPopupPosition, setAnnotationPopupPosition] = useState({ top: 0, left: 0 });
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const specRef = useRef<HTMLDivElement>(null);

  const storageKey = React.useMemo(() => {
    const projectId = currentProject?.id ?? 'unknown-project';
    return `gpteach:specviewer:annotations:v1:${projectId}`;
  }, [currentProject?.id]);

  const saveAnnotations = React.useCallback(
    (next: Annotation[]) => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch (e) {
        console.warn('Failed to persist annotations:', e);
      }
    },
    [storageKey],
  );

  const wrapRangeWithMark = (range: Range, mark: HTMLElement) => {
    // More robust than surroundContents across multiple text nodes.
    const contents = range.extractContents();
    mark.appendChild(contents);
    range.insertNode(mark);
  };

  const getGlobalOffsetsForRange = (root: HTMLElement, range: Range) => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let index = 0;
    let start: number | null = null;
    let end: number | null = null;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const node = walker.nextNode() as Text | null;
      if (!node) break;

      if (node === range.startContainer) start = index + range.startOffset;
      if (node === range.endContainer) end = index + range.endOffset;

      index += node.nodeValue?.length ?? 0;
    }

    if (start == null || end == null) return null;
    return { start, end };
  };

  const getRangeFromGlobalOffsets = (root: HTMLElement, start: number, end: number) => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let index = 0;
    let startNode: Text | null = null;
    let endNode: Text | null = null;
    let startOffset = 0;
    let endOffset = 0;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const node = walker.nextNode() as Text | null;
      if (!node) break;
      const len = node.nodeValue?.length ?? 0;

      if (startNode == null && start <= index + len) {
        startNode = node;
        startOffset = Math.max(0, start - index);
      }

      if (endNode == null && end <= index + len) {
        endNode = node;
        endOffset = Math.max(0, end - index);
      }

      if (startNode && endNode) break;
      index += len;
    }

    if (!startNode || !endNode) return null;
    const range = document.createRange();
    range.setStart(startNode, startOffset);
    range.setEnd(endNode, endOffset);
    return range;
  };

  const applyAnnotationHighlight = (annotation: Annotation) => {
    const root = specRef.current;
    if (!root) return;
    if (!annotation.startOffset && annotation.startOffset !== 0) return;
    if (!annotation.endOffset && annotation.endOffset !== 0) return;
    if (annotation.endOffset <= annotation.startOffset) return;

    const existing = root.querySelector(`mark[data-annotation-id="${annotation.id}"]`);
    if (existing) return;

    const range = getRangeFromGlobalOffsets(root, annotation.startOffset, annotation.endOffset);
    if (!range) return;

    const mark = document.createElement('mark');
    mark.className = `${annotation.color} text-zinc-100 cursor-pointer rounded px-0.5 border-b-2 transition-opacity hover:opacity-80 relative inline-block`;
    mark.dataset.annotationId = annotation.id;

    try {
      wrapRangeWithMark(range, mark);
    } catch (e) {
      console.warn('Failed to restore highlight range:', e);
      return;
    }

    const icon = document.createElement('span');
    icon.innerHTML = annotation.type === 'ai' ? '💬' : '📝';
    icon.className = 'inline-block ml-1 text-[10px]';
    mark.appendChild(icon);

    mark.onclick = (e) => {
      e.stopPropagation();
      handleAnnotationClick(annotation, e as unknown as ReactMouseEvent);
    };
  };

  const unwrapMarkElement = (element: Element) => {
    const parent = element.parentNode;
    if (!parent) return;
    while (element.firstChild) {
      if (
        element.firstChild.nodeType === Node.ELEMENT_NODE &&
        ['💬', '📝'].includes((element.firstChild as HTMLElement).innerText)
      ) {
        element.removeChild(element.firstChild);
      } else {
        parent.insertBefore(element.firstChild, element);
      }
    }
    parent.removeChild(element);
  };

  const clearPendingHighlight = React.useCallback(() => {
    if (!specRef.current || !selectionInfo?.pendingMarkId) return;
    const el = specRef.current.querySelector(`mark[data-pending-id="${selectionInfo.pendingMarkId}"]`);
    if (el) unwrapMarkElement(el);
  }, [selectionInfo?.pendingMarkId]);

  const applyPendingHighlight = (pendingId: string, range: Range, colorIndex: number) => {
    const root = specRef.current;
    if (!root) return;

    // Don't create duplicates if selection triggers multiple times.
    const existing = root.querySelector(`mark[data-pending-id="${pendingId}"]`);
    if (existing) return;

    const mark = document.createElement('mark');
    mark.className = `${highlightColors[colorIndex]} text-zinc-100 cursor-pointer rounded px-0.5 border-b-2 transition-opacity hover:opacity-80 relative inline-block`;
    mark.dataset.pendingId = pendingId;

    wrapRangeWithMark(range, mark);

    const icon = document.createElement('span');
    icon.innerHTML = composeMode === 'ask' ? '💬' : '📝';
    icon.className = 'inline-block ml-1 text-[10px] opacity-80';
    mark.appendChild(icon);
  };

  const finalizePendingHighlight = (annotation: Annotation) => {
    const root = specRef.current;
    if (!root) return;
    const el = root.querySelector(`mark[data-pending-id="${selectionInfo?.pendingMarkId ?? ''}"]`) as HTMLElement | null;
    if (!el) {
      // Fallback: re-apply from offsets.
      applyAnnotationHighlight(annotation);
      return;
    }

    delete el.dataset.pendingId;
    el.dataset.annotationId = annotation.id;
    el.className = `${annotation.color} text-zinc-100 cursor-pointer rounded px-0.5 border-b-2 transition-opacity hover:opacity-80 relative inline-block`;

    // Ensure correct icon.
    const last = el.lastElementChild as HTMLElement | null;
    if (last && ['💬', '📝'].includes(last.innerText)) last.innerHTML = annotation.type === 'ai' ? '💬' : '📝';

    el.onclick = (e) => {
      e.stopPropagation();
      handleAnnotationClick(annotation, e as unknown as ReactMouseEvent);
    };
  };

  // Load persisted annotations when project changes.
  useEffect(() => {
    if (!currentProject) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) {
        setAnnotations([]);
        return;
      }
      const parsed = JSON.parse(raw) as Annotation[];
      if (Array.isArray(parsed)) setAnnotations(parsed);
    } catch (e) {
      console.warn('Failed to load annotations:', e);
      setAnnotations([]);
    }
  }, [currentProject, storageKey]);

  // Re-apply highlights after render when annotations change.
  useEffect(() => {
    if (!specRef.current) return;
    if (annotations.length === 0) return;

    const id = window.requestAnimationFrame(() => {
      annotations.forEach(applyAnnotationHighlight);
    });
    return () => window.cancelAnimationFrame(id);
  }, [annotations]);

  const colors = [
    'border-yellow-500',
    'border-blue-500',
    'border-green-500',
    'border-purple-500',
    'border-pink-500',
    'border-orange-500',
  ];

  const highlightColors = [
    'bg-yellow-500/30 border-yellow-500',
    'bg-blue-500/30 border-blue-500',
    'bg-green-500/30 border-green-500',
    'bg-purple-500/30 border-purple-500',
    'bg-pink-500/30 border-pink-500',
    'bg-orange-500/30 border-orange-500',
  ];

  const selectionBgByIndex = [
    'rgba(234, 179, 8, 0.30)',  // yellow-500/30
    'rgba(59, 130, 246, 0.30)', // blue-500/30
    'rgba(34, 197, 94, 0.30)',  // green-500/30
    'rgba(168, 85, 247, 0.30)', // purple-500/30
    'rgba(236, 72, 153, 0.30)', // pink-500/30
    'rgba(249, 115, 22, 0.30)', // orange-500/30
  ];

  const handleTextSelect = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();

    if (text && text.length > 0 && selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);

      // Compute popup position BEFORE mutating DOM (wrapping selection in a mark can
      // invalidate the range's client rect and cause the popup to jump to (0,0)).
      const rect = range.getBoundingClientRect();

      const root = specRef.current;
      const offsets = root ? getGlobalOffsetsForRange(root, range) : null;
      if (!offsets) return;

      // Remove any previous pending highlight before creating a new one.
      if (selectionInfo?.pendingMarkId) {
        const prev = root?.querySelector(`mark[data-pending-id="${selectionInfo.pendingMarkId}"]`);
        if (prev) unwrapMarkElement(prev);
      }

      const pendingMarkId = `pending-${Date.now()}`;
      applyPendingHighlight(pendingMarkId, range.cloneRange(), selectedColorIndex);
      
      setSelectionInfo({
        text,
        range: range.cloneRange(),
        startOffset: offsets.start,
        endOffset: offsets.end,
        pendingMarkId,
      });
      
      if (rect && specRef.current) {
        const specRect = specRef.current.getBoundingClientRect();
        setQuestionBoxPosition({
          top: rect.bottom - specRect.top + specRef.current.scrollTop + 10,
          left: rect.left - specRect.left,
        });
        setShowQuestionBox(true);
        setComposeMode('ask');
      }

      // Clear the native browser selection highlight; the pending mark remains visible.
      selection.removeAllRanges();
    } else {
      setShowQuestionBox(false);
    }
  };

  const createHighlight = (annotation: Annotation, colorIndex: number, iconEmoji: string) => {
    if (!selectionInfo) return;

    const span = document.createElement('mark');
    // <mark> has a browser default `color: black`; override to keep text readable on dark UI.
    span.className = `${highlightColors[colorIndex]} text-zinc-100 cursor-pointer rounded px-0.5 border-b-2 transition-opacity hover:opacity-80 relative inline-block`;
    span.dataset.annotationId = annotation.id;

    selectionInfo.range.surroundContents(span);

    const icon = document.createElement('span');
    icon.innerHTML = iconEmoji;
    icon.className = 'inline-block ml-1 text-[10px]';
    span.appendChild(icon);

    span.onclick = (e) => {
      e.stopPropagation();
      handleAnnotationClick(annotation, e as unknown as ReactMouseEvent);
    };
  };

  const handleAskQuestion = async () => {
    if (!question.trim() || !selectionInfo || !backendSessionId) return;

    const colorIndex = selectedColorIndex;
    const annotationId = Date.now().toString();
    const currentQuestion = question;
    const currentSelection = selectionInfo;

    setIsAsking(true);

    try {
      const response = await teachRespond({
        session_id: backendSessionId,
        student_message: `Regarding this part of the spec: "${currentSelection.text}"\n\nMy question: ${currentQuestion}`,
        want_hint_only: true,
      });

      const newAnnotation: Annotation = {
        id: annotationId,
        type: 'ai',
        question: currentQuestion,
        answer: response.assistant_message,
        highlightedText: currentSelection.text,
        color: highlightColors[colorIndex],
        borderColor: colors[colorIndex],
        sectionId: 'dynamic',
        startOffset: currentSelection.startOffset,
        endOffset: currentSelection.endOffset,
      };

      finalizePendingHighlight(newAnnotation);

      setAnnotations((prev) => {
        const next = [...prev, newAnnotation];
        saveAnnotations(next);
        return next;
      });
    } catch (e) {
      console.error('Failed to get answer:', e);
      alert('Could not get an answer. Make sure the backend is running.');
    } finally {
      setIsAsking(false);
      setQuestion('');
      setNote('');
      setShowQuestionBox(false);
      setSelectionInfo(null);
    }
  };

  const handleSaveNote = () => {
    if (!note.trim() || !selectionInfo) return;

    const colorIndex = selectedColorIndex;
    const annotationId = Date.now().toString();
    const currentNote = note;
    const currentSelection = selectionInfo;

    const newAnnotation: Annotation = {
      id: annotationId,
      type: 'note',
      question: '',
      answer: currentNote,
      highlightedText: currentSelection.text,
      color: highlightColors[colorIndex],
      borderColor: colors[colorIndex],
      sectionId: 'dynamic',
      startOffset: currentSelection.startOffset,
      endOffset: currentSelection.endOffset,
    };

    finalizePendingHighlight(newAnnotation);
    setAnnotations((prev) => {
      const next = [...prev, newAnnotation];
      saveAnnotations(next);
      return next;
    });

    setNote('');
    setQuestion('');
    setShowQuestionBox(false);
    setSelectionInfo(null);
  };

  const handleAnnotationClick = (annotation: Annotation, event: ReactMouseEvent) => {
    event.stopPropagation();
    if (specRef.current) {
      const specRect = specRef.current.getBoundingClientRect();
      const targetRect = (event.target as HTMLElement).getBoundingClientRect();
      
      setAnnotationPopupPosition({
        top: targetRect.bottom - specRect.top + specRef.current.scrollTop + 10,
        left: targetRect.left - specRect.left,
      });
      setSelectedAnnotation(annotation);
    }
  };

  const handleDeleteAnnotation = (annotationId: string) => {
    const element = document.querySelector(`mark[data-annotation-id="${annotationId}"]`);
    if (element) {
      const parent = element.parentNode;
      while (element.firstChild) {
        if (
          element.firstChild.nodeType === Node.ELEMENT_NODE &&
          ['💬', '📝'].includes((element.firstChild as HTMLElement).innerText)
        ) {
          element.removeChild(element.firstChild);
        } else {
          parent?.insertBefore(element.firstChild, element);
        }
      }
      parent?.removeChild(element);
    }
    setAnnotations((prev) => {
      const next = prev.filter((a) => a.id !== annotationId);
      saveAnnotations(next);
      return next;
    });
    setSelectedAnnotation(null);
  };

  const handleChangeAnnotationColor = (colorIndex: number) => {
    if (!selectedAnnotation) return;
    
    const element = document.querySelector(`mark[data-annotation-id="${selectedAnnotation.id}"]`);
    if (element) {
      element.className = `${highlightColors[colorIndex]} text-zinc-100 cursor-pointer rounded px-0.5 border-b-2 transition-opacity hover:opacity-80 relative inline-block`;
    }

    const updatedAnnotation = {
      ...selectedAnnotation,
      color: highlightColors[colorIndex],
      borderColor: colors[colorIndex],
    };

    setAnnotations((prev) => {
      const next = prev.map((a) => (a.id === selectedAnnotation.id ? updatedAnnotation : a));
      saveAnnotations(next);
      return next;
    });
    setSelectedAnnotation(updatedAnnotation);
  };

  // If user changes color while the "compose" popup is open, update the pending highlight too.
  useEffect(() => {
    if (!showQuestionBox || !selectionInfo?.pendingMarkId || !specRef.current) return;
    const el = specRef.current.querySelector(`mark[data-pending-id="${selectionInfo.pendingMarkId}"]`) as HTMLElement | null;
    if (!el) return;
    el.className = `${highlightColors[selectedColorIndex]} text-zinc-100 cursor-pointer rounded px-0.5 border-b-2 transition-opacity hover:opacity-80 relative inline-block`;
  }, [showQuestionBox, selectionInfo?.pendingMarkId, selectedColorIndex]);

  if (!currentProject) {
    return (
      <div className="flex flex-col h-full bg-zinc-900">
        <div className="p-4 border-b border-zinc-800">
          <h2 className="font-semibold text-zinc-100">Project Specification</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-zinc-400">No project loaded</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-zinc-900" onClick={() => setSelectedAnnotation(null)}>
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-zinc-100">Project Specification</h2>
          {annotations.length > 0 && (
            <div className="flex items-center gap-2">
              <MessageCircle className="size-4 text-zinc-400" />
              <span className="text-sm text-zinc-400">{annotations.length} annotations</span>
            </div>
          )}
        </div>
      </div>
      
      <div
        ref={specRef}
        className="spec-selection flex-1 overflow-auto p-6 relative bg-zinc-900 text-zinc-100"
        style={{
          ['--spec-selection-bg' as unknown as string]: selectionBgByIndex[selectedColorIndex],
          ['--spec-selection-fg' as unknown as string]: '#ffffff',
        }}
        onMouseUp={handleTextSelect}
      >
        <div className="max-w-3xl prose prose-invert prose-zinc prose-sm sm:prose-base prose-headings:text-zinc-50 prose-p:text-zinc-300 prose-strong:text-zinc-100 prose-ul:text-zinc-300 prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ node, ...props }) => (
                <a 
                  {...props} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  onClick={(e) => e.stopPropagation()} 
                />
              )
            }}
          >
            {currentProject.spec}
          </ReactMarkdown>
        </div>

        {showQuestionBox && (
          <div
            className="absolute z-10 w-96"
            style={{ top: questionBoxPosition.top, left: questionBoxPosition.left }}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="p-4 shadow-lg bg-zinc-800 border-zinc-700">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setComposeMode('ask')}
                    className={`text-xs px-2 py-1 rounded border transition-colors ${
                      composeMode === 'ask'
                        ? 'bg-zinc-900 border-zinc-600 text-zinc-100'
                        : 'bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-900/50'
                    }`}
                  >
                    Ask AI
                  </button>
                  <button
                    type="button"
                    onClick={() => setComposeMode('note')}
                    className={`text-xs px-2 py-1 rounded border transition-colors ${
                      composeMode === 'note'
                        ? 'bg-zinc-900 border-zinc-600 text-zinc-100'
                        : 'bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-900/50'
                    }`}
                  >
                    Note
                  </button>
                  <div className="ml-auto text-[11px] text-zinc-500">
                    {composeMode === 'ask' ? 'AI annotation' : 'Local note'}
                  </div>
                </div>
                <p className="text-xs text-zinc-400">
                  Selected: "{selectionInfo?.text.slice(0, 50)}..."
                </p>
                {composeMode === 'ask' ? (
                  <Textarea
                    placeholder="Ask a question about this section..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    className="min-h-20 bg-zinc-900 border-zinc-700 text-zinc-100"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAskQuestion();
                      }
                    }}
                    autoFocus
                  />
                ) : (
                  <Textarea
                    placeholder="Write a note about this section..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="min-h-20 bg-zinc-900 border-zinc-700 text-zinc-100"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSaveNote();
                      }
                    }}
                    autoFocus
                  />
                )}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-zinc-400 mr-1">Color:</span>
                    {highlightColors.map((_, index) => {
                      const colorMap = ['bg-yellow-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-orange-500'];
                      return (
                        <button
                          key={index}
                          onClick={() => setSelectedColorIndex(index)}
                          className={`size-6 rounded ${colorMap[index]} hover:opacity-80 transition-opacity ${
                            selectedColorIndex === index ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-800' : ''
                          }`}
                          title={colorMap[index].replace('bg-', '').replace('-500', '')}
                        />
                      );
                    })}
                  </div>
                  <div className="flex gap-2 ml-auto">
                    {composeMode === 'ask' ? (
                      <Button onClick={handleAskQuestion} size="sm" disabled={isAsking || !question.trim()}>
                        {isAsking ? <Loader2 className="size-4 mr-1 animate-spin" /> : <Send className="size-4 mr-1" />}
                        {isAsking ? 'Asking...' : 'Ask'}
                      </Button>
                    ) : (
                      <Button onClick={handleSaveNote} size="sm" disabled={!note.trim()}>
                        <Send className="size-4 mr-1" />
                        Save
                      </Button>
                    )}
                    <Button 
                      onClick={() => {
                        clearPendingHighlight();
                        setShowQuestionBox(false);
                        setSelectionInfo(null);
                        setQuestion('');
                        setNote('');
                      }} 
                      size="sm" 
                      variant="outline"
                      className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {selectedAnnotation && (
          <div
            className="absolute z-20 w-96"
            style={{ top: annotationPopupPosition.top, left: annotationPopupPosition.left }}
            onClick={(e) => e.stopPropagation()}
          >
            <Card className={`p-4 shadow-xl border-2 bg-zinc-800 ${selectedAnnotation.borderColor}`}>
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <MessageCircle className="size-5 flex-shrink-0 text-zinc-100 mt-0.5" />
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="size-6 p-0 text-zinc-200 hover:bg-red-900/50 hover:text-red-300"
                      onClick={() => handleDeleteAnnotation(selectedAnnotation.id)}
                      title="Delete annotation"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="size-6 p-0 text-zinc-200 hover:bg-zinc-700/60 hover:text-zinc-50"
                      onClick={() => setSelectedAnnotation(null)}
                      title="Close"
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1">
                  {selectedAnnotation.type === 'ai' ? (
                    <>
                      <p className="text-xs font-medium text-zinc-400">QUESTION</p>
                      <p className="text-sm text-zinc-100">{selectedAnnotation.question}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-xs font-medium text-zinc-400">NOTE</p>
                      <p className="text-sm text-zinc-100">Personal note</p>
                    </>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-zinc-400">
                    {selectedAnnotation.type === 'ai' ? 'AI ANSWER' : 'NOTE'}
                  </p>
                  <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">{selectedAnnotation.answer}</p>
                </div>
                <div className="pt-2 border-t border-zinc-700">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-zinc-400">Change color:</span>
                    {highlightColors.map((_, index) => {
                      const colorMap = ['bg-yellow-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-orange-500'];
                      return (
                        <button
                          key={index}
                          onClick={() => handleChangeAnnotationColor(index)}
                          className={`size-5 rounded ${colorMap[index]} hover:opacity-80 transition-opacity ${
                            selectedAnnotation.color === highlightColors[index] ? 'ring-2 ring-white ring-offset-1 ring-offset-zinc-800' : ''
                          }`}
                          title={colorMap[index].replace('bg-', '').replace('-500', '')}
                        />
                      );
                    })}
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
