import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Calendar, CheckCircle2, Circle } from 'lucide-react';

interface Deadline {
  id: string;
  title: string;
  date: string;
  completed: boolean;
  color: string;
}

export function DeadlineCalendar() {
  const [deadlines, setDeadlines] = useState<Deadline[]>([
    {
      id: '1',
      title: 'Initial Design Document',
      date: 'Mar 15, 2026',
      completed: false,
      color: 'bg-blue-500',
    },
    {
      id: '2',
      title: 'DHT Implementation',
      date: 'Mar 22, 2026',
      completed: false,
      color: 'bg-purple-500',
    },
    {
      id: '3',
      title: 'Replication Strategy',
      date: 'Mar 29, 2026',
      completed: false,
      color: 'bg-green-500',
    },
    {
      id: '4',
      title: 'Consistency Model',
      date: 'Apr 5, 2026',
      completed: false,
      color: 'bg-orange-500',
    },
    {
      id: '5',
      title: 'Testing & Documentation',
      date: 'Apr 12, 2026',
      completed: false,
      color: 'bg-red-500',
    },
    {
      id: '6',
      title: 'Final Submission',
      date: 'Apr 19, 2026',
      completed: false,
      color: 'bg-pink-500',
    },
  ]);

  const toggleDeadline = (id: string) => {
    setDeadlines(deadlines.map(d => 
      d.id === id ? { ...d, completed: !d.completed } : d
    ));
  };

  const completedCount = deadlines.filter(d => d.completed).length;

  return (
    <div className="flex flex-col h-full bg-zinc-900">
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-zinc-100">Project Timeline</h2>
          <Badge variant="secondary" className="bg-zinc-800 text-zinc-100">
            {completedCount}/{deadlines.length}
          </Badge>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-3 bg-zinc-900">
        {deadlines.map((deadline) => (
          <Card
            key={deadline.id}
            className={`p-3 cursor-pointer transition-all hover:shadow-md bg-zinc-800 border-zinc-700 hover:bg-zinc-750 ${
              deadline.completed ? 'opacity-60' : ''
            }`}
            onClick={() => toggleDeadline(deadline.id)}
          >
            <div className="flex items-start gap-3">
              <div className={`w-1 h-full ${deadline.color} rounded-full flex-shrink-0`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h3 className={`text-sm font-medium text-zinc-100 ${deadline.completed ? 'line-through' : ''}`}>
                      {deadline.title}
                    </h3>
                    <div className="flex items-center gap-1 mt-1 text-xs text-zinc-400">
                      <Calendar className="size-3" />
                      {deadline.date}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {deadline.completed ? (
                      <CheckCircle2 className="size-5 text-green-500" />
                    ) : (
                      <Circle className="size-5 text-zinc-600" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}