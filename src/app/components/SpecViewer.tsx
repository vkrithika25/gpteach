import { useState, useRef, useMemo } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Send, MessageCircle, X, Trash2 } from 'lucide-react';
import { useProjects } from '../contexts/ProjectContext';

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
  sectionId: string;
  startOffset: number;
  endOffset: number;
}

export function SpecViewer() {
  const { currentProject } = useProjects();
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

    if (text && text.length > 0 && selection) {
      const range = selection.getRangeAt(0);
      
      // Find the section element
      let sectionElement = range.startContainer.parentElement;
      while (sectionElement && !sectionElement.getAttribute('data-section-id')) {
        sectionElement = sectionElement.parentElement;
      }

      if (!sectionElement) return;

      const sectionId = sectionElement.getAttribute('data-section-id') || '';
      const sectionText = sectionElement.textContent || '';
      
      // Get the text before the selection to calculate offset
      const preRange = document.createRange();
      preRange.setStart(sectionElement, 0);
      preRange.setEnd(range.startContainer, range.startOffset);
      const startOffset = preRange.toString().length;
      const endOffset = startOffset + text.length;

      setSelectionInfo({
        text,
        sectionId,
        startOffset,
        endOffset,
      });
      
      const rect = range.getBoundingClientRect();
      
      if (rect && specRef.current) {
        const specRect = specRef.current.getBoundingClientRect();
        setQuestionBoxPosition({
          top: rect.bottom - specRect.top + 10,
          left: rect.left - specRect.left,
        });
        setShowQuestionBox(true);
      }
    } else {
      setShowQuestionBox(false);
    }
  };

  const handleAskQuestion = () => {
    if (!question.trim() || !selectionInfo) return;

    const colorIndex = selectedColorIndex;
    const newAnnotation: Annotation = {
      id: Date.now().toString(),
      question: question,
      answer: generateMockResponse(question, selectionInfo.text),
      highlightedText: selectionInfo.text,
      color: highlightColors[colorIndex],
      borderColor: colors[colorIndex],
      sectionId: selectionInfo.sectionId,
      startOffset: selectionInfo.startOffset,
      endOffset: selectionInfo.endOffset,
    };

    setAnnotations([...annotations, newAnnotation]);
    setQuestion('');
    setShowQuestionBox(false);
    setSelectionInfo(null);
    
    // Clear selection
    window.getSelection()?.removeAllRanges();
  };

  const generateMockResponse = (q: string, context: string): string => {
    const responses = [
      `Based on "${context}", this requirement focuses on implementing a key feature. I'd suggest breaking this down into smaller tasks: 1) Set up the data structure, 2) Implement the core logic, 3) Add error handling.`,
      `This part of the spec deals with "${context}". You should start by creating a class diagram to model the relationships between components before coding.`,
      `The highlighted section "${context}" indicates a functional requirement. Make sure to write unit tests for this before moving to the next feature.`,
      `This requirement about "${context}" seems to depend on other parts of the system. I recommend tackling the dependencies first.`,
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleAnnotationClick = (annotation: Annotation, event: React.MouseEvent) => {
    event.stopPropagation();
    if (specRef.current) {
      const specRect = specRef.current.getBoundingClientRect();
      const targetRect = (event.target as HTMLElement).getBoundingClientRect();
      
      setAnnotationPopupPosition({
        top: targetRect.bottom - specRect.top + 10,
        left: targetRect.left - specRect.left,
      });
      setSelectedAnnotation(annotation);
    }
  };

  const handleDeleteAnnotation = (annotationId: string) => {
    setAnnotations(annotations.filter(a => a.id !== annotationId));
    setSelectedAnnotation(null);
  };

  const handleChangeAnnotationColor = (colorIndex: number) => {
    if (!selectedAnnotation) return;
    
    const updatedAnnotation = {
      ...selectedAnnotation,
      color: highlightColors[colorIndex],
      borderColor: colors[colorIndex],
    };

    setAnnotations(annotations.map(a => 
      a.id === selectedAnnotation.id ? updatedAnnotation : a
    ));
    setSelectedAnnotation(updatedAnnotation);
  };
  
  const renderTextWithHighlights = (text: string, sectionId: string) => {
    const sectionAnnotations = annotations.filter(a => a.sectionId === sectionId);

    if (sectionAnnotations.length === 0) return text;

    const parts: { text: string; annotation?: Annotation }[] = [];
    let currentIndex = 0;

    // Create a sorted list of annotation positions
    const annotationMatches: { start: number; end: number; annotation: Annotation }[] =
      sectionAnnotations.map(annotation => ({
        start: annotation.startOffset,
        end: annotation.endOffset,
        annotation: annotation,
      }));

    // Sort by start position
    annotationMatches.sort((a, b) => a.start - b.start);

    // Build the text parts
    annotationMatches.forEach(match => {
      if (match.start > currentIndex) {
        parts.push({ text: text.substring(currentIndex, match.start) });
      }
      parts.push({
        text: text.substring(match.start, match.end),
        annotation: match.annotation
      });
      currentIndex = match.end;
    });

    if (currentIndex < text.length) {
      parts.push({ text: text.substring(currentIndex) });
    }

    if (parts.length === 0) {
      return text;
    }

    return (
      <>
        {parts.map((part, index) => {
          if (part.annotation) {
            return (
              <mark
                key={index}
                className={`${part.annotation.color} cursor-pointer rounded px-0.5 border-b-2 transition-opacity hover:opacity-80 relative`}
                onClick={(e) => handleAnnotationClick(part.annotation!, e)}
              >
                {part.text}
                <MessageCircle className="inline-block size-3 ml-0.5 mb-0.5" />
              </mark>
            );
          }
          return <span key={index}>{part.text}</span>;
        })}
      </>
    );
  };

  // Parse the spec content into sections
  const parsedSections = useMemo(() => {
    if (!currentProject) return [];

    const lines = currentProject.spec.split('\n');
    const sections: { id: string; type: 'heading' | 'paragraph' | 'list-item'; content: string; level?: number }[] = [];
    let currentId = 0;

    lines.forEach((line, index) => {
      if (line.trim() === '') return;

      // Check for markdown headers
      const h1Match = line.match(/^# (.+)$/);
      const h2Match = line.match(/^## (.+)$/);
      const h3Match = line.match(/^### (.+)$/);
      const listMatch = line.match(/^(\d+\.|[-*]) (.+)$/);

      if (h1Match) {
        sections.push({ id: `section-${currentId++}`, type: 'heading', content: h1Match[1], level: 1 });
      } else if (h2Match) {
        sections.push({ id: `section-${currentId++}`, type: 'heading', content: h2Match[1], level: 2 });
      } else if (h3Match) {
        sections.push({ id: `section-${currentId++}`, type: 'heading', content: h3Match[1], level: 3 });
      } else if (listMatch) {
        sections.push({ id: `section-${currentId++}`, type: 'list-item', content: listMatch[2] });
      } else {
        sections.push({ id: `section-${currentId++}`, type: 'paragraph', content: line.trim() });
      }
    });

    return sections;
  }, [currentProject]);

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
        <div className="max-w-3xl space-y-4">
          {parsedSections.map((section) => {
            if (section.type === 'heading') {
              const HeadingTag = section.level === 1 ? 'h1' : section.level === 2 ? 'h2' : 'h3';
              const className = section.level === 1
                ? 'font-bold text-xl text-zinc-50'
                : section.level === 2
                ? 'font-semibold text-lg text-zinc-100 mt-6'
                : 'font-semibold text-zinc-100 mt-4';
              return (
                <HeadingTag key={section.id} className={className} data-section-id={section.id}>
                  {renderTextWithHighlights(section.content, section.id)}
                </HeadingTag>
              );
            }
            if (section.type === 'list-item') {
              return (
                <div key={section.id} className="flex gap-2 text-sm ml-4">
                  <span className="text-zinc-400">•</span>
                  <p className="leading-relaxed text-zinc-300 flex-1" data-section-id={section.id}>
                    {renderTextWithHighlights(section.content, section.id)}
                  </p>
                </div>
              );
            }
            return (
              <p key={section.id} className="text-sm leading-relaxed text-zinc-300" data-section-id={section.id}>
                {renderTextWithHighlights(section.content, section.id)}
              </p>
            );
          })}
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
                    <Button onClick={handleAskQuestion} size="sm">
                      <Send className="size-4 mr-1" />
                      Ask
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
