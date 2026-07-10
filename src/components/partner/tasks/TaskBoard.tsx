'use client';

import React, { useState, useEffect } from 'react';
import { collection, query, where, getFirestore, onSnapshot, doc, updateDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { usePartner } from '@/contexts/PartnerContext';
import { CreateTaskDialog } from './CreateTaskDialog';
import { TaskCard } from './TaskCard';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AlertTriangle, Loader2, ListFilter, User } from 'lucide-react';
import { Task } from '@/lib/types';

const db = getFirestore(firebaseApp);
const COLUMNS: Task['status'][] = ['To-Do', 'In Progress', 'Review', 'Done'];

interface StaffMember {
  id: string;
  name: string;
}

export default function TaskBoard() {
  const { user } = useAuth();
  const { canDo, limits, isOwner } = usePartner();
  const { toast } = useToast();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  const partnerId = user?.partnerId || user?.uid || '';

  // 1. Listen for active staff members
  useEffect(() => {
    if (!partnerId) return;

    // Get the owner
    const ownerName = user?.role === 'partner'
      ? user.companyName || user.name
      : 'Owner';
    const ownerObj: StaffMember = { id: partnerId, name: `${ownerName} (Owner)` };

    // Query active staff
    const q = query(
      collection(db, 'users'),
      where('partnerId', '==', partnerId),
      where('role', 'in', ['partner_staff', 'partner_admin'])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const staff: StaffMember[] = [ownerObj];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.isActive !== false) {
          staff.push({
            id: doc.id,
            name: data.name || 'Unnamed Staff',
          });
        }
      });
      setStaffList(staff);
    }, (error) => {
      console.error('Error listening for staff:', error);
    });

    return () => unsubscribe();
  }, [partnerId, user]);

  // 2. Listen for tasks
  useEffect(() => {
    if (!partnerId) return;

    const q = query(
      collection(db, 'tasks'),
      where('partnerId', '==', partnerId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const taskList: Task[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        taskList.push({
          ...data,
          id: doc.id,
        } as Task);
      });
      setTasks(taskList);
      setLoading(false);
    }, (error) => {
      console.error('Error listening for tasks:', error);
      toast({ title: 'Error', description: 'Failed to load task board.', variant: 'destructive' });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [partnerId, toast]);

  const handleStatusChange = async (taskId: string, newStatus: Task['status']) => {
    if (!canDo('tasks', 'full')) {
      toast({ title: 'Permission Denied', description: 'You do not have permission to modify tasks.', variant: 'destructive' });
      return;
    }
    try {
      await updateDoc(doc(db, 'tasks', taskId), {
        status: newStatus,
      });
    } catch (err: any) {
      console.error('Failed to move task:', err);
      toast({ title: 'Error', description: 'Failed to update task status.', variant: 'destructive' });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!canDo('tasks', 'full')) {
      toast({ title: 'Permission Denied', description: 'You do not have permission to delete tasks.', variant: 'destructive' });
      return;
    }
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
      toast({ title: 'Task Deleted', description: 'Task has been removed.' });
    } catch (err: any) {
      console.error('Failed to delete task:', err);
      toast({ title: 'Error', description: 'Failed to delete task.', variant: 'destructive' });
    }
  };

  // Filter logic
  const filteredTasks = tasks.filter(task => {
    const matchesAssignee = filterAssignee === 'all' || 
      (task.assignedTo && task.assignedTo.includes(filterAssignee));
    const matchesPriority = filterPriority === 'all' || 
      task.priority === filterPriority;
    return matchesAssignee && matchesPriority;
  });

  if (!canDo('tasks', 'view')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <AlertTriangle className="h-12 w-12 text-yellow-500" />
        <h2 className="text-xl font-bold">
          {isOwner ? 'Activate Task & Workflow Manager' : 'Access Restricted'}
        </h2>
        <p className="text-muted-foreground text-sm max-w-md text-center">
          {isOwner 
            ? 'The Task & Workflow Manager add-on is not active. Please activate the Task & Workflow Manager module (R200/month) in your settings to manage tasks and staff workflows.'
            : 'You do not have permission to view the Task Board. Please contact your practice administrator.'}
        </p>
        {isOwner && (
          <Button asChild className="font-bold">
            <Link href="/partner/profile">Go to Settings & Add-ons</Link>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Task Board</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track and manage your practice workflow tasks in columns.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {canDo('tasks', 'full') && (
            <CreateTaskDialog staffList={staffList} />
          )}
        </div>
      </div>

      {/* Filter Panel */}
      <div className="flex flex-wrap items-center gap-4 bg-muted/30 p-4 border rounded-lg">
        <div className="flex items-center gap-2 text-sm text-muted-foreground font-semibold">
          <ListFilter className="h-4 w-4" />
          <span>Filters:</span>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="filter-assignee" className="text-xs font-bold text-muted-foreground uppercase">Assignee</label>
          <select
            id="filter-assignee"
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="h-9 px-3 border rounded-md bg-background text-xs text-foreground font-medium"
          >
            <option value="all">All Assignees</option>
            {staffList.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="filter-priority" className="text-xs font-bold text-muted-foreground uppercase">Priority</label>
          <select
            id="filter-priority"
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="h-9 px-3 border rounded-md bg-background text-xs text-foreground font-medium"
          >
            <option value="all">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>
      </div>

      {/* Kanban Board columns */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
        {loading ? (
          <div className="col-span-4 flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          COLUMNS.map((column) => {
            const columnTasks = filteredTasks.filter(t => t.status === column);
            return (
              <div key={column} className="bg-muted/40 border border-muted rounded-lg p-3 space-y-4 min-h-[500px] flex flex-col">
                <div className="flex justify-between items-center pb-2 border-b border-muted">
                  <h3 className="font-bold text-sm text-foreground">{column}</h3>
                  <Badge variant="secondary" className="font-semibold text-xs">{columnTasks.length}</Badge>
                </div>

                <div className="flex-1 space-y-3">
                  {columnTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      staffList={staffList}
                      onStatusChange={handleStatusChange}
                      onDelete={handleDeleteTask}
                    />
                  ))}
                  {columnTasks.length === 0 && (
                    <div className="text-xs text-muted-foreground/60 italic text-center py-10">
                      No tasks in {column}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
