import { useState, useRef } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Send, MessageCircle, X, Trash2 } from 'lucide-react';

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

  return (
    <div className="flex flex-col h-full min-h-0 bg-zinc-900" onClick={() => setSelectedAnnotation(null)}>
      <div className="p-4 border-b border-zinc-800 shrink-0">
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
      
      <div ref={specRef} className="flex-1 min-h-0 overflow-auto p-6 relative bg-zinc-900 text-zinc-100" onMouseUp={handleTextSelect}>
        <div className="max-w-3xl space-y-4">
          <h1 className="font-bold text-xl text-zinc-50">CS 401: Distributed Systems Project</h1>
          
          <section>
            <h3 className="font-semibold mb-2 text-zinc-100">Overview</h3>
            <p className="text-sm leading-relaxed text-zinc-300" data-section-id="overview">
              {renderTextWithHighlights(
                "In this project, you will design and implement a distributed key-value store that supports concurrent read and write operations across multiple nodes. The system must ensure data consistency, fault tolerance, and efficient data replication.",
                "overview"
              )}
            </p>
          </section>

          <section>
            <h3 className="font-semibold mb-2 text-zinc-100">Requirements</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium text-zinc-200">1. Data Storage and Retrieval</p>
                <p className="leading-relaxed ml-4 text-zinc-300" data-section-id="requirement-1">
                  {renderTextWithHighlights(
                    "Implement a distributed hash table (DHT) that can store and retrieve key-value pairs. Each node should be responsible for a portion of the keyspace using consistent hashing.",
                    "requirement-1"
                  )}
                </p>
              </div>
              
              <div>
                <p className="font-medium text-zinc-200">2. Replication Strategy</p>
                <p className="leading-relaxed ml-4 text-zinc-300" data-section-id="requirement-2">
                  {renderTextWithHighlights(
                    "Each key-value pair must be replicated across at least three nodes to ensure fault tolerance. Use a quorum-based approach for read and write operations to maintain consistency.",
                    "requirement-2"
                  )}
                </p>
              </div>
              
              <div>
                <p className="font-medium text-zinc-200">3. Consistency Model</p>
                <p className="leading-relaxed ml-4 text-zinc-300" data-section-id="requirement-3">
                  {renderTextWithHighlights(
                    "Implement eventual consistency with vector clocks to detect and resolve conflicts. The system should handle network partitions gracefully and reconcile data when partitions heal.",
                    "requirement-3"
                  )}
                </p>
              </div>
              
              <div>
                <p className="font-medium text-zinc-200">4. Failure Detection</p>
                <p className="leading-relaxed ml-4 text-zinc-300" data-section-id="requirement-4">
                  {renderTextWithHighlights(
                    "Implement a gossip-based failure detection mechanism. Nodes should periodically exchange heartbeat messages and update their view of the cluster membership.",
                    "requirement-4"
                  )}
                </p>
              </div>

              <div>
                <p className="font-medium text-zinc-200">5. Client API</p>
                <p className="leading-relaxed ml-4 text-zinc-300" data-section-id="requirement-5">
                  {renderTextWithHighlights(
                    "Provide a RESTful API that allows clients to perform GET, PUT, and DELETE operations. The API should handle requests efficiently and return appropriate error messages for failed operations.",
                    "requirement-5"
                  )}
                </p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="font-semibold mb-2 text-zinc-100">Deliverables</h3>
            <ul className="list-disc list-inside text-sm space-y-1 ml-4 text-zinc-300">
              <li data-section-id="deliverable-1">{renderTextWithHighlights("Source code with documentation", "deliverable-1")}</li>
              <li data-section-id="deliverable-2">{renderTextWithHighlights("Design document explaining architecture decisions", "deliverable-2")}</li>
              <li data-section-id="deliverable-3">{renderTextWithHighlights("Test suite covering edge cases", "deliverable-3")}</li>
              <li data-section-id="deliverable-4">{renderTextWithHighlights("Performance analysis report", "deliverable-4")}</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold mb-2 text-zinc-100">Evaluation Criteria</h3>
            <p className="text-sm leading-relaxed text-zinc-300" data-section-id="evaluation">
              {renderTextWithHighlights(
                "Your project will be evaluated on correctness, performance, code quality, and the depth of your design document. Pay special attention to how your system handles concurrent operations and network failures.",
                "evaluation"
              )}
            </p>
          </section>
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
