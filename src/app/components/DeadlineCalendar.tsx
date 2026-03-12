import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Calendar, CheckCircle2, Circle, Plus, Pencil, Trash2, X, Check } from 'lucide-react';

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

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');

  const availableColors = [
    'bg-blue-500',
    'bg-purple-500',
    'bg-green-500',
    'bg-orange-500',
    'bg-red-500',
    'bg-pink-500',
    'bg-yellow-500',
    'bg-cyan-500',
  ];

  const toggleDeadline = (id: string) => {
    setDeadlines(deadlines.map(d => 
      d.id === id ? { ...d, completed: !d.completed } : d
    ));
  };

  const startEditing = (deadline: Deadline, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(deadline.id);
    setEditTitle(deadline.title);
    setEditDate(deadline.date);
  };

  const saveEdit = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editTitle.trim() || !editDate.trim()) return;
    
    setDeadlines(deadlines.map(d => 
      d.id === id ? { ...d, title: editTitle, date: editDate } : d
    ));
    setEditingId(null);
    setEditTitle('');
    setEditDate('');
  };

  const cancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
    setEditTitle('');
    setEditDate('');
  };

  const deleteDeadline = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeadlines(deadlines.filter(d => d.id !== id));
  };

  const addNewDeadline = () => {
    if (!newTitle.trim() || !newDate.trim()) return;

    const usedColors = deadlines.map(d => d.color);
    const availableColor = availableColors.find(c => !usedColors.includes(c)) || availableColors[0];

    const newDeadline: Deadline = {
      id: Date.now().toString(),
      title: newTitle,
      date: newDate,
      completed: false,
      color: availableColor,
    };

    setDeadlines([...deadlines, newDeadline]);
    setNewTitle('');
    setNewDate('');
    setIsAddingNew(false);
  };

  const cancelAddNew = () => {
    setNewTitle('');
    setNewDate('');
    setIsAddingNew(false);
  };

  const completedCount = deadlines.filter(d => d.completed).length;

  return (
    <div className="flex flex-col h-full min-h-0 bg-zinc-900">
      <div className="p-4 border-b border-zinc-800 shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-zinc-100">Project Timeline</h2>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-zinc-800 text-zinc-100">
              {completedCount}/{deadlines.length}
            </Badge>
            <Button
              size="sm"
              onClick={() => setIsAddingNew(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="size-4 mr-1" />
              Add Task
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto p-4 space-y-3 bg-zinc-900">
        {isAddingNew && (
          <Card className="p-3 bg-zinc-800 border-zinc-700">
            <div className="space-y-2">
              <Input
                placeholder="Task title..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="bg-zinc-900 border-zinc-700 text-zinc-100"
                autoFocus
              />
              <Input
                placeholder="Date (e.g., Mar 15, 2026)..."
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="bg-zinc-900 border-zinc-700 text-zinc-100"
              />
              <div className="flex gap-2 justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={cancelAddNew}
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                >
                  <X className="size-4 mr-1" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={addNewDeadline}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Check className="size-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>
          </Card>
        )}

        {deadlines.map((deadline) => (
          <Card
            key={deadline.id}
            className={`p-3 transition-all hover:shadow-md bg-zinc-800 border-zinc-700 hover:bg-zinc-750 ${
              deadline.completed ? 'opacity-60' : ''
            } ${editingId === deadline.id ? '' : 'cursor-pointer'}`}
            onClick={() => editingId !== deadline.id && toggleDeadline(deadline.id)}
          >
            {editingId === deadline.id ? (
              <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                <Input
                  placeholder="Task title..."
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="bg-zinc-900 border-zinc-700 text-zinc-100"
                  autoFocus
                />
                <Input
                  placeholder="Date..."
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="bg-zinc-900 border-zinc-700 text-zinc-100"
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={cancelEdit}
                    className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                  >
                    <X className="size-4 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={(e) => saveEdit(deadline.id, e)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Check className="size-4 mr-1" />
                    Save
                  </Button>
                </div>
              </div>
            ) : (
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
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="size-7 p-0 hover:bg-zinc-700"
                        onClick={(e) => startEditing(deadline, e)}
                        title="Edit task"
                      >
                        <Pencil className="size-3 text-zinc-400" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="size-7 p-0 hover:bg-red-900/50 hover:text-red-400"
                        onClick={(e) => deleteDeadline(deadline.id, e)}
                        title="Delete task"
                      >
                        <Trash2 className="size-3 text-zinc-400" />
                      </Button>
                      <div className="flex-shrink-0 ml-1">
                        {deadline.completed ? (
                          <CheckCircle2 className="size-5 text-green-500" />
                        ) : (
                          <Circle className="size-5 text-zinc-600" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}