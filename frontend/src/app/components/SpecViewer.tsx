import { useState, useRef, useEffect } from 'react';
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
}

export function SpecViewer() {
  const { currentProject, backendSessionId } = useProjects();
  const [isAsking, setIsAsking] = useState(false);
  const [selectionInfo, setSelectionInfo] = useState<SelectionInfo | null>(null);
  const [showQuestionBox, setShowQuestionBox] = useState(false);
  const [questionBoxPosition, setQuestionBoxPosition] = useState({ top: 0, left: 0 });
  const [question, setQuestion] = useState('');
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedAnnotation, setSelectedAnnotation] = useState<Annotation | null>(null);
  const [annotationPopupPosition, setAnnotationPopupPosition] = useState({ top: 0, left: 0 });
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const specRef = useRef<HTMLDivElement>(null);

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

  const handleTextSelect = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();

    if (text && text.length > 0 && selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      
      setSelectionInfo({
        text,
        range: range.cloneRange(),
      });
      
      const rect = range.getBoundingClientRect();
      
      if (rect && specRef.current) {
        const specRect = specRef.current.getBoundingClientRect();
        setQuestionBoxPosition({
          top: rect.bottom - specRect.top + specRef.current.scrollTop + 10,
          left: rect.left - specRect.left,
        });
        setShowQuestionBox(true);
      }
    } else {
      setShowQuestionBox(false);
    }
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

      const span = document.createElement('mark');
      span.className = `${highlightColors[colorIndex]} cursor-pointer rounded px-0.5 border-b-2 transition-opacity hover:opacity-80 relative inline-block`;
      span.dataset.annotationId = annotationId;

      const newAnnotation: Annotation = {
        id: annotationId,
        question: currentQuestion,
        answer: response.assistant_message,
        highlightedText: currentSelection.text,
        color: highlightColors[colorIndex],
        borderColor: colors[colorIndex],
        sectionId: 'dynamic',
        startOffset: 0,
        endOffset: 0,
      };

      currentSelection.range.surroundContents(span);

      const icon = document.createElement('span');
      icon.innerHTML = '\uD83D\uDCAC';
      icon.className = 'inline-block ml-1 text-[10px]';
      span.appendChild(icon);

      span.onclick = (e) => {
        e.stopPropagation();
        handleAnnotationClick(newAnnotation, e as unknown as React.MouseEvent);
      };

      setAnnotations(prev => [...prev, newAnnotation]);
    } catch (e) {
      console.error('Failed to get answer:', e);
      alert('Could not get an answer. Make sure the backend is running.');
    } finally {
      setIsAsking(false);
      setQuestion('');
      setShowQuestionBox(false);
      setSelectionInfo(null);
      window.getSelection()?.removeAllRanges();
    }
  };

  const handleAnnotationClick = (annotation: Annotation, event: React.MouseEvent) => {
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
        if (element.firstChild.nodeType === Node.ELEMENT_NODE && (element.firstChild as HTMLElement).innerText === '💬') {
          element.removeChild(element.firstChild);
        } else {
          parent?.insertBefore(element.firstChild, element);
        }
      }
      parent?.removeChild(element);
    }
    setAnnotations(prev => prev.filter(a => a.id !== annotationId));
    setSelectedAnnotation(null);
  };

  const handleChangeAnnotationColor = (colorIndex: number) => {
    if (!selectedAnnotation) return;
    
    const element = document.querySelector(`mark[data-annotation-id="${selectedAnnotation.id}"]`);
    if (element) {
      element.className = `${highlightColors[colorIndex]} cursor-pointer rounded px-0.5 border-b-2 transition-opacity hover:opacity-80 relative inline-block`;
    }

    const updatedAnnotation = {
      ...selectedAnnotation,
      color: highlightColors[colorIndex],
      borderColor: colors[colorIndex],
    };

    setAnnotations(prev => prev.map(a => 
      a.id === selectedAnnotation.id ? updatedAnnotation : a
    ));
    setSelectedAnnotation(updatedAnnotation);
  };

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
      
      <div ref={specRef} className="flex-1 overflow-auto p-6 relative bg-zinc-900 text-zinc-100" onMouseUp={handleTextSelect}>
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
                <p className="text-xs text-zinc-400">
                  Selected: "{selectionInfo?.text.slice(0, 50)}..."
                </p>
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
                    <Button onClick={handleAskQuestion} size="sm" disabled={isAsking}>
                      {isAsking ? <Loader2 className="size-4 mr-1 animate-spin" /> : <Send className="size-4 mr-1" />}
                      {isAsking ? 'Asking...' : 'Ask'}
                    </Button>
                    <Button 
                      onClick={() => {
                        setShowQuestionBox(false);
                        setSelectionInfo(null);
                        window.getSelection()?.removeAllRanges();
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
                      className="size-6 p-0 hover:bg-red-900/50 hover:text-red-400"
                      onClick={() => handleDeleteAnnotation(selectedAnnotation.id)}
                      title="Delete annotation"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="size-6 p-0"
                      onClick={() => setSelectedAnnotation(null)}
                      title="Close"
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-zinc-400">QUESTION</p>
                  <p className="text-sm text-zinc-100">{selectedAnnotation.question}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-zinc-400">AI ANSWER</p>
                  <p className="text-sm text-zinc-200 leading-relaxed">{selectedAnnotation.answer}</p>
                </div>
                <div className="pt-2 border-t border-zinc-700">
                  <p className="text-xs text-zinc-500 italic">"{selectedAnnotation.highlightedText}"</p>
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
