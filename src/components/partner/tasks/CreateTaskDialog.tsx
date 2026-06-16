'use client';

import React, { useState } from 'react';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { usePartner } from '@/contexts/PartnerContext';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Loader2 } from 'lucide-react';

const db = getFirestore(firebaseApp);

interface StaffMember {
  id: string;
  name: string;
}

interface CreateTaskDialogProps {
  staffList: StaffMember[];
  onTaskCreated?: () => void;
}

export function CreateTaskDialog({ staffList, onTaskCreated }: CreateTaskDialogProps) {
  const { user } = useAuth();
  const { limits, canDo } = usePartner();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState<string[]>([]);
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [dueDate, setDueDate] = useState('');
  const [recurrence, setRecurrence] = useState<'None' | 'Daily' | 'Weekly' | 'Monthly'>('None');

  const partnerId = user?.partnerId || user?.uid || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canDo('tasks', 'full')) {
      toast({ title: 'Permission Denied', description: 'You do not have permission to create tasks.', variant: 'destructive' });
      return;
    }

    if (!title.trim()) {
      toast({ title: 'Validation Error', description: 'Task title is required.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'tasks'), {
        title: title.trim(),
        description: description.trim(),
        assignedTo,
        createdBy: user?.uid || 'system',
        createdAt: serverTimestamp(),
        dueDate: dueDate ? new Date(dueDate) : null,
        priority,
        status: 'To-Do',
        recurrence,
        partnerId,
      });

      toast({ title: 'Task Created', description: 'The task was successfully added to your board.' });
      
      // Reset form
      setTitle('');
      setDescription('');
      setAssignedTo([]);
      setPriority('Medium');
      setDueDate('');
      setRecurrence('None');
      setOpen(false);

      if (onTaskCreated) onTaskCreated();
    } catch (err: any) {
      console.error('Error creating task:', err);
      toast({ title: 'Error', description: err.message || 'Failed to create task.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAssignee = (staffId: string) => {
    if (assignedTo.includes(staffId)) {
      setAssignedTo(assignedTo.filter(id => id !== staffId));
    } else {
      setAssignedTo([...assignedTo, staffId]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Task
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Create New Task</DialogTitle>
          <DialogDescription>
            Add a new item to your practice workflow board.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label htmlFor="title" className="text-xs font-bold uppercase text-muted-foreground">Task Title</Label>
            <Input
              id="title"
              placeholder="e.g. Prepare VAT Return"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="description" className="text-xs font-bold uppercase text-muted-foreground">Description</Label>
            <Textarea
              id="description"
              placeholder="e.g. Reconcile bank statements and compute VAT output/input."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              className="resize-none h-20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="priority" className="text-xs font-bold uppercase text-muted-foreground">Priority</Label>
              <select
                id="priority"
                value={priority}
                onChange={(e: any) => setPriority(e.target.value)}
                disabled={loading}
                className="w-full h-10 px-3 border rounded-md bg-background text-sm text-foreground"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="dueDate" className="text-xs font-bold uppercase text-muted-foreground">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold uppercase text-muted-foreground block mb-2">Assign To</Label>
            <div className="border rounded-md p-3 max-h-32 overflow-y-auto space-y-2">
              {staffList.map((staff) => (
                <label key={staff.id} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={assignedTo.includes(staff.id)}
                    onChange={() => handleToggleAssignee(staff.id)}
                    disabled={loading}
                    className="rounded text-primary focus:ring-primary h-4 w-4"
                  />
                  <span className="text-foreground font-medium">{staff.name}</span>
                </label>
              ))}
              {staffList.length === 0 && (
                <div className="text-xs text-muted-foreground italic text-center py-2">
                  No active staff members. You can assign tasks to yourself.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="recurrence" className="text-xs font-bold uppercase text-muted-foreground">Recurrence</Label>
            <select
              id="recurrence"
              value={recurrence}
              onChange={(e: any) => setRecurrence(e.target.value)}
              disabled={loading}
              className="w-full h-10 px-3 border rounded-md bg-background text-sm text-foreground"
            >
              <option value="None">None</option>
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Task'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
