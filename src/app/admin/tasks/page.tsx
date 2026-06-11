'use client';
import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreHorizontal, PlusCircle, Loader2, Calendar, ClipboardList, Edit, Check, Trash2 } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Task, User, TaskComment } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, arrayUnion, Timestamp, where, serverTimestamp } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import TaskForm from '@/components/admin/TaskForm';
import { generateNextTaskOccurrence } from '@/app/actions';

const db = getFirestore(firebaseApp);

const departments = ['Accounting and Tax', 'Administration', 'CAP'] as const;

const userColors = [
  'bg-red-100 text-red-700 border-red-200',
  'bg-blue-100 text-blue-700 border-blue-200',
  'bg-green-100 text-green-700 border-green-200',
  'bg-yellow-100 text-yellow-700 border-yellow-200',
  'bg-purple-100 text-purple-700 border-purple-200',
  'bg-pink-100 text-pink-700 border-pink-200',
];

const getUserColor = (userId: string) => {
  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return userColors[hash % userColors.length];
};

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allStaff, setAllStaff] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskTypeFilter, setTaskTypeFilter] = useState('all');
  const { toast } = useToast();
  const { user } = useAuth();
  
  const fetchTasks = async () => {
    setIsLoading(true);
    try {
        const tasksQuery = query(collection(db, 'tasks'), orderBy('dueDate', 'asc'));
        const tasksSnapshot = await getDocs(tasksQuery);
        const fetchedTasks = tasksSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Task));
        setTasks(fetchedTasks);

        const staffQuery = query(collection(db, "users"), where('role', 'in', ['staff', 'admin']));
        const staffSnapshot = await getDocs(staffQuery);
        const fetchedStaff = staffSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, uid: doc.id } as User));
        setAllStaff(fetchedStaff);

    } catch (error) {
        console.error("Error fetching tasks:", error);
        toast({ title: "Error", description: "Could not fetch tasks.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const staffByDept = useMemo(() => {
    const result: Record<string, User[]> = {};
    departments.forEach(dept => {
        result[dept] = allStaff.filter(u => u.department === dept);
    });
    return result;
  }, [allStaff]);

  const taskTypes = useMemo(() => {
    const types = new Set(tasks.map(task => {
        const title = task.title;
        const forIndex = title.lastIndexOf(' for ');
        if (forIndex > -1) {
            return title.substring(0, forIndex);
        }
        return title;
    }));
    return ['All Tasks', ...Array.from(types)];
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    let tasksToFilter = tasks;
    if (user?.role === 'staff') {
        tasksToFilter = tasks.filter(task => Array.isArray(task.assignedTo) && task.assignedTo.includes(user.id));
    }
    
    if (taskTypeFilter !== 'all' && taskTypeFilter !== 'All Tasks') {
        return tasksToFilter.filter(task => task.title.startsWith(taskTypeFilter));
    }

    return tasksToFilter;
  }, [tasks, user, taskTypeFilter]);

  const handleAdd = () => {
    setSelectedTask(null);
    setIsFormOpen(true);
  };

  const handleEdit = (task: Task) => {
    setSelectedTask(task);
    setIsFormOpen(true);
  };
  
  const handleDelete = async (taskId: string) => {
    try {
        await deleteDoc(doc(db, 'tasks', taskId));
        fetchTasks();
        setIsFormOpen(false);
        toast({
            title: 'Task Deleted',
            description: 'The task has been successfully removed.',
            variant: 'destructive',
        });
    } catch (error) {
        console.error("Error deleting task:", error);
        toast({ title: 'Error', description: 'Could not delete task.', variant: 'destructive'});
    }
  };

   const handleUpdateStatus = async (taskId: string, status: Task['status']) => {
    try {
        const taskRef = doc(db, 'tasks', taskId);
        await updateDoc(taskRef, { status });
        
        if (status === 'Done') {
            const task = tasks.find(t => t.id === taskId);
            if (task?.recurrence && task.recurrence !== 'None') {
                await generateNextTaskOccurrence(taskId);
            }
            toast({
                title: 'Task Completed!',
                description: 'The task has been successfully marked as complete.',
            });
        } else {
             toast({
                title: 'Task Status Updated',
                description: `The task has been marked as "${status}".`,
            });
        }
        fetchTasks();
    } catch (error) {
        console.error("Error updating status:", error);
        toast({ title: 'Error', description: 'Could not update status.', variant: 'destructive'});
    }
  };

  const handleFormSubmit = async (data: any) => {
    if (!user) return;
    setIsLoading(true);
    
    const taskData = {
        ...data,
        dueDate: Timestamp.fromDate(data.dueDate as Date),
    };

    try {
        if (selectedTask?.id) {
            const taskRef = doc(db, 'tasks', selectedTask.id);
            await updateDoc(taskRef, { ...taskData });
            toast({ title: 'Task Updated', description: 'The task details have been saved.' });
        } else {
            const newTask: Omit<Task, 'id' | 'priority'> = {
                ...taskData,
                status: 'To-Do',
                createdBy: user.uid, 
                createdAt: serverTimestamp(),
                comments: [],
                priority: 'Medium',
                dueMonthOffset: 0,
                dueDay: 1,
            };
            await addDoc(collection(db, 'tasks'), newTask);
            toast({ title: 'Task Created', description: `Task assigned.` });
        }
        fetchTasks();
        setIsFormOpen(false);
        setSelectedTask(null);
    } catch (error) {
        console.error("Error saving task:", error);
        toast({ title: 'Error', description: 'Could not save the task.', variant: 'destructive'});
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleCommentSubmit = async (taskId: string, commentText: string) => {
    if (!user) return;
    
    const newComment: TaskComment = {
        text: commentText,
        date: Timestamp.now(),
        authorId: user.uid,
    };

    try {
        const taskRef = doc(db, 'tasks', taskId);
        await updateDoc(taskRef, {
            comments: arrayUnion(newComment),
        });
        
        const newCommentForState = { ...newComment, date: new Date() };

        if (selectedTask) {
             const updatedComments = [...(selectedTask.comments || []), newCommentForState];
             setSelectedTask({ ...selectedTask, comments: updatedComments });
        }
       
        fetchTasks();
        toast({ title: 'Comment Posted', description: 'Your comment has been added.' });
    } catch (error) {
        console.error("Error posting comment:", error);
        toast({ title: 'Error', description: 'Could not post comment.', variant: 'destructive' });
    }
  };

  const getAssignee = (userId?: string): User | undefined => {
    if (!userId) return undefined;
    return allStaff.find(u => u.id === userId);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between border-b pb-5">
        <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Manage Practice Tasks</h1>
            <p className="text-sm font-semibold text-slate-400">Add, reassign, or monitor task compliance roadmap objectives.</p>
        </div>
        <Button className="shadow-md font-bold px-4" onClick={handleAdd}>
            <PlusCircle className="mr-2 h-4.5 w-4.5" />
            Create Task
        </Button>
      </div>

      <Card className="border shadow-md rounded-2xl bg-white overflow-hidden">
        <CardHeader className="bg-slate-50/50 p-6 border-b">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <CardTitle className="text-md font-bold text-slate-800">Practice Log</CardTitle>
              <CardDescription className="text-xs font-semibold text-slate-400">View, edit, and complete tasks currently active.</CardDescription>
            </div>
            <div className="w-full sm:w-auto">
                <Select onValueChange={setTaskTypeFilter} defaultValue="all">
                    <SelectTrigger className="w-full sm:w-[240px] h-9 text-xs font-semibold bg-white border-slate-200">
                        <SelectValue placeholder="Filter by task type..." />
                    </SelectTrigger>
                    <SelectContent>
                        {taskTypes.map(type => (
                            <SelectItem key={type} value={type === 'All Tasks' ? 'all' : type}>
                                {type}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
          <Table>
            <TableHeader className="bg-slate-50/20">
              <TableRow className="border-b">
                <TableHead className="font-bold text-slate-500 py-4 pl-6">Task Description</TableHead>
                <TableHead className="font-bold text-slate-500 py-4">Assigned Staff</TableHead>
                <TableHead className="font-bold text-slate-500 py-4">Due Date</TableHead>
                <TableHead className="font-bold text-slate-500 py-4">Status</TableHead>
                <TableHead className="text-right font-bold text-slate-500 py-4 pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={5} className="text-center text-slate-400 py-16 font-medium">No tasks to display.</TableCell>
                </TableRow>
              ) : (
                filteredTasks.map(task => {
                    const assignees = Array.isArray(task.assignedTo) ? task.assignedTo : [task.assignedTo];
                    const dueDate = task.dueDate?.toDate ? task.dueDate.toDate() : (task.dueDate ? new Date(task.dueDate) : null);
                    
                    const forIndex = task.title.lastIndexOf(' for ');
                    const displayTitle = forIndex > -1 ? task.title.substring(0, forIndex) : task.title;
                    const clientName = forIndex > -1 ? task.title.substring(forIndex + 5) : '';

                    return (
                      <TableRow key={task.id} className="hover:bg-slate-50/30 transition-colors border-b cursor-pointer" onClick={() => handleEdit(task)}>
                        <TableCell className="font-semibold text-slate-900 py-4 pl-6 max-w-xs">
                            <p className="line-clamp-1">{displayTitle}</p>
                            {clientName && (
                                <p className="text-[10px] font-bold text-slate-500 mt-0.5 truncate flex items-center gap-1">
                                    <span className="text-[8px] text-slate-400 font-normal uppercase tracking-wider bg-slate-100 border border-slate-200/50 px-1 rounded">Client</span>
                                    <span>{clientName}</span>
                                </p>
                            )}
                            <p className="text-xs text-slate-400 font-medium line-clamp-1 mt-1">{task.description}</p>
                        </TableCell>
                        <TableCell className="py-4" onClick={(e) => e.stopPropagation()}>
                             <div className="flex items-center -space-x-1.5">
                                {assignees.slice(0, 3).map(userId => {
                                    const assignee = getAssignee(userId);
                                    if (!assignee) return null;
                                    return (
                                        <TooltipProvider key={userId}>
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <span className={cn("h-6 w-6 border border-white rounded-full flex items-center justify-center text-[10px] font-black shadow-sm", getUserColor(assignee.id))}>
                                                        {assignee.name.charAt(0)}
                                                    </span>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p className="text-xs font-semibold">{assignee.name}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    );
                                })}
                                {assignees.length === 0 && (
                                    <span className="text-[10px] font-bold text-slate-400 italic">Unassigned</span>
                                )}
                            </div>
                        </TableCell>
                        <TableCell className="py-4">
                            <div className="flex items-center gap-1 text-xs text-slate-600 font-semibold">
                                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                <span>{dueDate ? format(dueDate, 'dd/MM/yyyy') : 'N/A'}</span>
                            </div>
                        </TableCell>
                        <TableCell className="py-4">
                            <Badge 
                              variant="outline" 
                              className={cn("text-[9px] font-black uppercase tracking-tight", 
                                task.status === 'Done' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                task.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-600'
                              )}
                            >
                                {task.status}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-6 py-4" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-800" onClick={() => handleEdit(task)}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:bg-emerald-50" onClick={() => handleUpdateStatus(task.id, 'Done')}>
                                    <Check className="h-4.5 w-4.5" />
                                </Button>
                            </div>
                        </TableCell>
                      </TableRow>
                    );
                })
              )}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>

      {/* Task Drawer Sheet */}
      <Sheet open={isFormOpen} onOpenChange={(isOpen) => { setIsFormOpen(isOpen); if (!isOpen) setSelectedTask(null);}}>
         <SheetContent className="sm:max-w-xl w-full flex flex-col h-full bg-white p-0 overflow-hidden">
              <div className="p-6 border-b bg-gradient-to-r from-slate-900 to-slate-800 text-white relative">
                  <SheetHeader className="text-left">
                      <div className="flex justify-between items-center">
                          <Badge className="bg-primary hover:bg-primary text-[10px] uppercase font-black tracking-wide w-fit">Task Details</Badge>
                          {selectedTask && (
                              <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:bg-white/10 hover:text-white">
                                          <Trash2 className="h-4.5 w-4.5" />
                                      </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                      <AlertDialogHeader>
                                          <AlertDialogTitle className="text-lg font-bold">Delete Task?</AlertDialogTitle>
                                          <AlertDialogDescription className="text-sm text-slate-500">
                                              Are you sure you want to permanently delete task: <span className="font-bold text-slate-900">{selectedTask.title}</span>? This cannot be undone.
                                          </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                          <AlertDialogCancel className="font-semibold">Cancel</AlertDialogCancel>
                                          <AlertDialogAction className="bg-destructive hover:bg-destructive/90 text-white font-bold" onClick={() => handleDelete(selectedTask.id)}>Delete</AlertDialogAction>
                                      </AlertDialogFooter>
                                  </AlertDialogContent>
                              </AlertDialog>
                          )}
                      </div>
                      <SheetTitle className="text-2xl font-black text-white mt-2 leading-tight">
                          {selectedTask ? 'Update Task' : 'Create Task'}
                      </SheetTitle>
                      <SheetDescription className="text-slate-300 text-xs font-medium mt-1">
                          {selectedTask ? 'Update fields or add logs to this compliance object.' : 'Fill out the form to add a new task.'}
                      </SheetDescription>
                  </SheetHeader>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                  <TaskForm 
                      task={selectedTask} 
                      onSubmit={handleFormSubmit}
                      onCancel={() => setIsFormOpen(false)}
                      onCommentSubmit={handleCommentSubmit}
                      allStaff={allStaff}
                      staffByDept={staffByDept}
                  />
              </div>
         </SheetContent>
      </Sheet>
    </div>
  );
}
