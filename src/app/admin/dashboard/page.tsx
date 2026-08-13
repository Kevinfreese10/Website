'use client';
import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, isPast, isSameDay, subDays } from 'date-fns';
import { Task, User, Order, DemoLead } from '@/lib/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusCircle, CalendarIcon, Loader2, Repeat, Check, Eye, ClipboardList, Edit, CheckSquare, X, Filter, AlertOctagon, ArrowRight, CheckCircle2, LayoutGrid, List, MessageSquare, AlertTriangle, UserIcon, MoreHorizontal, ChevronDown, ChevronUp, Paperclip, Users, ShieldCheck } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, query, orderBy, where, onSnapshot, serverTimestamp, Timestamp, writeBatch, arrayUnion, limit } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { firebaseApp } from '@/lib/firebase';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { generateNextTaskOccurrence } from '@/app/actions';
import TaskForm, { TaskFormValues } from '@/components/admin/TaskForm';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { notifyStaffOfTaskAssignment } from '@/app/actions/notifications';
import { notifyStaffOfAssignment } from '@/app/actions/order-actions';

type RecentCommunication = {
    id: string;
    orderId: string;
    customerName: string;
    text: string;
    date: Date;
    subject?: string | null;
    latestNote?: string;
};

const db = getFirestore(firebaseApp);

const getTaskDate = (task: Task): Date => {
  if (task.dueDate instanceof Date) return task.dueDate;
  if (task.dueDate && typeof (task.dueDate as any).toDate === 'function') return (task.dueDate as any).toDate();
  return new Date(task.dueDate);
};

const userColors = [
  'bg-red-100 text-red-700 border-red-200',
  'bg-blue-100 text-blue-700 border-blue-200',
  'bg-green-100 text-green-700 border-green-200',
  'bg-yellow-100 text-yellow-700 border-yellow-200',
  'bg-purple-100 text-purple-700 border-purple-200',
  'bg-pink-100 text-pink-700 border-pink-200',
];

const getUserColor = (userId: string) => {
  if (!userId) return 'bg-gray-100 text-gray-700';
  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return userColors[hash % userColors.length];
};

const taskTypeLabels: Record<string, string> = {
    'VAT201': 'VAT Submission (VAT201)',
    'EMP201': 'Monthly PAYE (EMP201)',
    'PAYROLL': 'Payroll Preparation',
    'MGMT': 'Management Accounts',
    'AFS': 'Annual Financial Statements',
    'ITR': 'Income Tax Return (ITR14)',
    'ITR12T': 'Trust Tax Return (ITR12T)',
    'ITR12': 'Income Tax Return (ITR12)',
    'IRP6': 'Provisional Tax (IRP6)',
};

export default function AdminDashboardPage() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [recentComms, setRecentComms] = useState<RecentCommunication[]>([]);
    const [archivedComms, setArchivedComms] = useState<string[]>([]);
    const [demoLeads, setDemoLeads] = useState<DemoLead[]>([]);
    const [archivedDemoLeads, setArchivedDemoLeads] = useState<string[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [selectedRoadmapIds, setSelectedRoadmapIds] = useState<string[]>([]);
    const [taskTypeFilter, setTaskTypeFilter] = useState('all');
    const [overdueTaskTypeFilter, setOverdueTaskTypeFilter] = useState('all');
    
    // Board Specific Filters
    const [boardScope, setBoardScope] = useState<'all' | 'my'>('all');
    const [boardAssignee, setBoardAssignee] = useState('all');
    
    // View mode: 'list' or 'board' (Kanban)
    const [viewMode, setViewMode] = useState<'list' | 'board'>('board');
    
    // Accordion state for Task Board
    const [isTaskBoardOpen, setIsTaskBoardOpen] = useState(true);

    const { toast } = useToast();
    
    useEffect(() => {
        const savedArchivedComms = localStorage.getItem('adminDashboardArchivedComms');
        if (savedArchivedComms) {
            setArchivedComms(JSON.parse(savedArchivedComms));
        }

        const savedArchivedDemoLeads = localStorage.getItem('adminDashboardArchivedDemoLeads');
        if (savedArchivedDemoLeads) {
            setArchivedDemoLeads(JSON.parse(savedArchivedDemoLeads));
        }

        const savedBoardState = localStorage.getItem('adminDashboardTaskBoardOpen');
        if (savedBoardState !== null) {
            setIsTaskBoardOpen(savedBoardState === 'true');
        }
    }, []);

    const toggleTaskBoard = () => {
        const newState = !isTaskBoardOpen;
        setIsTaskBoardOpen(newState);
        localStorage.setItem('adminDashboardTaskBoardOpen', String(newState));
    };

    const handleArchiveComm = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        const newArchived = [...archivedComms, id];
        setArchivedComms(newArchived);
        localStorage.setItem('adminDashboardArchivedComms', JSON.stringify(newArchived));
    };

    const handleArchiveDemoLead = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        const newArchived = [...archivedDemoLeads, id];
        setArchivedDemoLeads(newArchived);
        localStorage.setItem('adminDashboardArchivedDemoLeads', JSON.stringify(newArchived));
    };

    // Central Command Center State
    const [pendingPosts, setPendingPosts] = useState<any[]>([]);
    const [allOrdersList, setAllOrdersList] = useState<Order[]>([]);
    const [cvLeadsList, setCvLeadsList] = useState<any[]>([]);

    useEffect(() => {
        setIsLoading(true);
        const usersRef = collection(db, "users");
        getDocs(usersRef).then(usersSnapshot => {
            const fetchedUsers = usersSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, uid: doc.id } as User));
            setAllUsers(fetchedUsers.sort((a,b) => (a.name || '').localeCompare(b.name || '')));
        });

        const tasksUnsubscribe = onSnapshot(query(collection(db, 'tasks'), orderBy('dueDate', 'asc')), (snapshot) => {
            setTasks(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Task)));
            setIsLoading(false);
        });

        // 1. Listen for Pending Community Posts
        const postsQ = query(collection(db, 'community_posts'), where('status', '==', 'pending'));
        const postsUnsub = onSnapshot(postsQ, (snap) => {
            setPendingPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }, (err) => console.log('[CommandCenter] community_posts listener:', err));

        // 2. Listen for All Orders
        const ordersAllQ = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(50));
        const ordersAllUnsub = onSnapshot(ordersAllQ, (snap) => {
            setAllOrdersList(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
        }, (err) => console.log('[CommandCenter] orders listener:', err));

        // 3. Listen for CV Leads
        const cvQ = query(collection(db, 'cvLeads'), orderBy('createdAt', 'desc'), limit(10));
        const cvUnsub = onSnapshot(cvQ, (snap) => {
            setCvLeadsList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }, (err) => console.log('[CommandCenter] cvLeads listener:', err));

        // Fetch recent communications from assigned orders
        let ordersUnsubscribe = () => {};
        if (user?.id) {
            const ordersQ = query(
                collection(db, 'orders'),
                where('assignedTo', 'array-contains', user.id)
            );
            ordersUnsubscribe = onSnapshot(ordersQ, (snapshot) => {
                const comms: RecentCommunication[] = [];
                snapshot.docs.forEach(doc => {
                    const order = doc.data() as Order;
                    if (order.status !== 'Processing') return;

                    const emailNotes = Array.isArray(order.notes) ? order.notes.filter(n => n.type === 'email') : [];
                    const otherNotes = Array.isArray(order.notes) ? order.notes.filter(n => n.type !== 'email') : [];
                    
                    emailNotes.sort((a, b) => {
                        const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
                        const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
                        return dateB.getTime() - dateA.getTime();
                    });
                    
                    otherNotes.sort((a, b) => {
                        const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
                        const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
                        return dateB.getTime() - dateA.getTime();
                    });
                    
                    const latestEmail = emailNotes.length > 0 ? emailNotes[0] : null;
                    const latestOther = otherNotes.length > 0 ? otherNotes[0] : null;
                    
                    let emailDate = latestEmail ? (latestEmail.date?.toDate ? latestEmail.date.toDate() : new Date(latestEmail.date)) : null;
                    let otherDate = latestOther ? (latestOther.date?.toDate ? latestOther.date.toDate() : new Date(latestOther.date)) : null;
                    
                    let date = new Date();
                    let text = "No recent communications.";
                    let subject = "Status: Processing";
                    
                    // Determine the main display content (prefer email for the main block, as it was originally "Recent Client Emails")
                    if (latestEmail) {
                        text = latestEmail.text;
                        subject = latestEmail.subject || 'Client Email';
                    } else if (latestOther) {
                        text = latestOther.text;
                        subject = 'Internal Note';
                    }
                    
                    // The date used for sorting and cache-busting (unarchiving) must be the absolute latest date across all notes
                    if (emailDate && otherDate) {
                        date = emailDate.getTime() > otherDate.getTime() ? emailDate : otherDate;
                    } else if (emailDate) {
                        date = emailDate;
                    } else if (otherDate) {
                        date = otherDate;
                    } else if (order.date) {
                        date = order.date?.toDate ? order.date.toDate() : new Date(order.date);
                    }
                    
                    const id = `${doc.id}_${date.getTime()}`;
                    
                    comms.push({
                        id,
                        orderId: doc.id,
                        customerName: order.endCustomerName || order.customerName,
                        text,
                        date,
                        subject,
                        latestNote: latestOther?.text
                    });
                });
                comms.sort((a, b) => b.date.getTime() - a.date.getTime());
                setRecentComms(comms.slice(0, 20)); // Keep more in case some are archived
            });
        }

        const demoLeadsUnsubscribe = onSnapshot(query(collection(db, 'demoLeads'), orderBy('createdAt', 'desc'), limit(10)), (snapshot) => {
            setDemoLeads(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as DemoLead)));
        });

        return () => {
            tasksUnsubscribe();
            ordersUnsubscribe();
            demoLeadsUnsubscribe();
            postsUnsub();
            ordersAllUnsub();
            cvUnsub();
        };
    }, [user?.id]);

    const handleApprovePost = async (postId: string) => {
        try {
            await updateDoc(doc(db, 'community_posts', postId), { status: 'published', approvedAt: serverTimestamp() });
            toast({ title: 'Post Approved', description: 'Post is now live in the community forum.' });
        } catch (err) {
            toast({ title: 'Approval Failed', variant: 'destructive' });
        }
    };

    const handleRejectPost = async (postId: string) => {
        try {
            await updateDoc(doc(db, 'community_posts', postId), { status: 'rejected' });
            toast({ title: 'Post Rejected' });
        } catch (err) {
            toast({ title: 'Action Failed', variant: 'destructive' });
        }
    };

    const handleAssignStaffToOrder = async (orderId: string, staffId: string) => {
        try {
            await updateDoc(doc(db, 'orders', orderId), { assignedTo: [staffId] });
            toast({ title: 'Staff Assigned', description: 'Order assigned successfully.' });
        } catch (err) {
            toast({ title: 'Assignment Failed', variant: 'destructive' });
        }
    };

    const unassignedOutsourcedOrders = useMemo(() => {
        return allOrdersList.filter(o => o.isOutsourced && (!o.assignedTo || o.assignedTo.length === 0));
    }, [allOrdersList]);

    const partnerPractices = useMemo(() => {
        return allUsers.filter(u => u.role === 'partner' || u.role === 'partner_admin');
    }, [allUsers]);

    const unarchivedComms = useMemo(() => {
        return recentComms.filter(c => !archivedComms.includes(c.id)).slice(0, 5);
    }, [recentComms, archivedComms]);

    const unarchivedDemoLeads = useMemo(() => {
        return demoLeads.filter(l => l.id && !archivedDemoLeads.includes(l.id)).slice(0, 5);
    }, [demoLeads, archivedDemoLeads]);

    const overdueTasks = useMemo(() => {
        let filtered = tasks.filter(task => {
            const dueDate = getTaskDate(task);
            return isPast(dueDate) && !isSameDay(dueDate, new Date()) && task.status !== 'Done';
        });

        if (overdueTaskTypeFilter !== 'all') {
            filtered = filtered.filter(task => task.type === overdueTaskTypeFilter);
        }

        return filtered.sort((a, b) => getTaskDate(a).getTime() - getTaskDate(b).getTime());
    }, [tasks, overdueTaskTypeFilter]);

    const myTasks = useMemo(() => {
        if (!user) return [];
        return tasks.filter(task => 
            Array.isArray(task.assignedTo) && 
            task.assignedTo.includes(user.id) &&
            task.status !== 'Done' &&
            !isPast(getTaskDate(task))
        ).sort((a,b) => getTaskDate(a).getTime() - getTaskDate(b).getTime());
    }, [tasks, user]);

    // For the list view roadmap (system tasks only)
    const roadmapTasks = useMemo(() => {
        let filtered = tasks.filter(task => 
            task.createdBy === 'system' && 
            task.status !== 'Done'
        );

        if (taskTypeFilter !== 'all') {
            filtered = filtered.filter(task => task.type === taskTypeFilter);
        }

        return filtered.sort((a,b) => getTaskDate(a).getTime() - getTaskDate(b).getTime());
    }, [tasks, taskTypeFilter]);

    // For the Kanban board (all tasks or filtered by scope/assignee)
    const boardTasks = useMemo(() => {
        let filtered = tasks;
        
        // Scope Filter
        if (boardScope === 'my' && user) {
            filtered = filtered.filter(t => Array.isArray(t.assignedTo) && t.assignedTo.includes(user.id));
        }
        
        // Assignee Filter
        if (boardAssignee !== 'all') {
            filtered = filtered.filter(t => Array.isArray(t.assignedTo) && t.assignedTo.includes(boardAssignee));
        }

        // Service Filter
        if (taskTypeFilter !== 'all') {
            filtered = filtered.filter(task => task.type === taskTypeFilter);
        }

        return filtered.sort((a,b) => getTaskDate(a).getTime() - getTaskDate(b).getTime());
    }, [tasks, taskTypeFilter, boardScope, boardAssignee, user]);

    const boardDoneTasks = useMemo(() => {
        const sevenDaysAgo = subDays(new Date(), 7);
        return boardTasks.filter(t => {
            if (t.status !== 'Done') return false;
            // Only show recently completed tasks
            let updated = new Date();
            if (t.updatedAt && typeof (t.updatedAt as any).toDate === 'function') updated = (t.updatedAt as any).toDate();
            else if (t.createdAt && typeof (t.createdAt as any).toDate === 'function') updated = (t.createdAt as any).toDate();
            
            return updated >= sevenDaysAgo;
        });
    }, [boardTasks]);

    // Practice progress indicator calculations
    const practiceMetrics = useMemo(() => {
        const active = tasks.filter(t => t.status !== 'Done');
        const done = tasks.filter(t => t.status === 'Done');
        const total = active.length + done.length;
        const completionRate = total > 0 ? Math.round((done.length / total) * 100) : 100;
        return { activeCount: active.length, doneCount: done.length, completionRate };
    }, [tasks]);

    const availableTaskTypes = useMemo(() => {
        const types = new Set<string>();
        tasks.forEach(t => {
            if (t.type) {
                types.add(t.type);
            }
        });
        return Array.from(types).sort();
    }, [tasks]);

    const assignableStaff = useMemo(() => {
        return allUsers.filter(u => u.role === 'staff' || u.role === 'admin' || u.role === 'cap_staff' || u.role === 'cap_supervisor');
    }, [allUsers]);

    const staffByDept = useMemo(() => {
        const result: Record<string, User[]> = {};
        ['Accounting and Tax', 'Administration', 'CAP'].forEach(dept => {
            result[dept] = assignableStaff.filter(u => u.department === dept);
        });
        return result;
    }, [assignableStaff]);

    const handleUpdate = async (taskId: string, updates: Partial<Task>) => {
        const originalTask = tasks.find(t => t.id === taskId);
        if (!originalTask || !user) return;
        
        // Optimistically update the UI to make DND feel snappy
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
        
        try {
            await updateDoc(doc(db, 'tasks', taskId), {
                ...updates,
                updatedAt: serverTimestamp()
            });
            if (updates.status === 'Done' && originalTask.recurrence && originalTask.recurrence !== 'None') {
                generateNextTaskOccurrence(originalTask.id);
            }
        } catch (error: any) {
            console.error("Task update failed:", error);
            toast({ title: 'Update failed', description: error.message || 'An error occurred', variant: 'destructive' });
            // Revert on failure by triggering a re-fetch or relying on the snapshot listener
        }
    };

    const handleDrop = (e: React.DragEvent, status: 'To-Do' | 'In Progress' | 'Review' | 'Done') => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('taskId');
        if (taskId) {
            handleUpdate(taskId, { status });
        }
    };

    const handleBulkAssign = async (staffId: string) => {
        if (selectedRoadmapIds.length === 0) return;
        
        setIsLoading(true);
        const batch = writeBatch(db);
        
        selectedRoadmapIds.forEach(taskId => {
            const taskRef = doc(db, 'tasks', taskId);
            batch.update(taskRef, { assignedTo: [staffId], updatedAt: serverTimestamp() });
        });

        try {
            await batch.commit();
            
            selectedRoadmapIds.forEach(taskId => {
                const t = tasks.find(task => task.id === taskId);
                if (t && staffId !== user.uid) {
                    notifyStaffOfTaskAssignment({
                        taskId,
                        taskTitle: t.title,
                        taskDescription: t.description,
                        dueDate: t.dueDate ? new Date((t.dueDate as Timestamp).seconds * 1000).toLocaleDateString() : undefined,
                        assigneeId: staffId,
                        assignedBy: user.name || 'Admin',
                        taskUrl: 'https://www.myacc.co.za/admin/dashboard'
                    }).catch(console.error);
                }
            });

            toast({ 
                title: 'Bulk Assignment Complete', 
                description: `Assigned ${selectedRoadmapIds.length} tasks successfully.` 
            });
            setSelectedRoadmapIds([]);
        } catch (e) {
            console.error(e);
            toast({ title: 'Bulk Update Failed', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleFormSubmit = async (data: TaskFormValues, files?: File[]) => {
        if (!user) return;
        setIsLoading(true);
        
        const { id, newComment, ...restData } = data;
        
        const taskData = {
            ...restData,
            dueDate: Timestamp.fromDate(data.dueDate as Date),
            updatedAt: serverTimestamp(),
        };

        try {
            let taskId = selectedTask?.id;

            if (taskId) {
                const taskRef = doc(db, 'tasks', taskId);
                await updateDoc(taskRef, taskData);

                if (taskData.assignedTo && Array.isArray(taskData.assignedTo)) {
                    const oldAssignees = selectedTask?.assignedTo || [];
                    const newAssignees = taskData.assignedTo.filter((uid: string) => !oldAssignees.includes(uid));
                    newAssignees.forEach((uid: string) => {
                        if (uid !== user.uid) {
                            notifyStaffOfTaskAssignment({
                                taskId,
                                taskTitle: taskData.title || selectedTask?.title || 'Updated Task',
                                taskDescription: taskData.description || selectedTask?.description,
                                dueDate: taskData.dueDate ? new Date((taskData.dueDate as Timestamp).seconds * 1000).toLocaleDateString() : undefined,
                                assigneeId: uid,
                                assignedBy: user.name || 'Admin',
                                taskUrl: 'https://www.myacc.co.za/admin/dashboard'
                            }).catch(console.error);
                        }
                    });
                }
            } else {
                const newTask: Omit<Task, 'id'> = {
                    ...(taskData as any),
                    status: 'To-Do',
                    createdBy: user.uid, 
                    createdAt: serverTimestamp(),
                    comments: [],
                    priority: data.priority || 'Medium',
                };
                const docRef = await addDoc(collection(db, 'tasks'), newTask);
                taskId = docRef.id;

                if (newTask.assignedTo && Array.isArray(newTask.assignedTo) && newTask.assignedTo.length > 0) {
                    newTask.assignedTo.forEach((uid: string) => {
                        if (uid !== user.uid) {
                            notifyStaffOfTaskAssignment({
                                taskId,
                                taskTitle: newTask.title,
                                taskDescription: newTask.description,
                                dueDate: newTask.dueDate ? new Date((newTask.dueDate as Timestamp).seconds * 1000).toLocaleDateString() : undefined,
                                assigneeId: uid,
                                assignedBy: user.name || 'Admin',
                                taskUrl: 'https://www.myacc.co.za/admin/dashboard'
                            }).catch(console.error);
                        }
                    });
                }
            }

            if (files && files.length > 0 && taskId) {
                const storage = getStorage(firebaseApp);
                const newAttachments = [];
                for (const file of files) {
                    const fileRef = ref(storage, `tasks/${taskId}/${Date.now()}_${file.name}`);
                    await uploadBytes(fileRef, file);
                    const url = await getDownloadURL(fileRef);
                    newAttachments.push({ name: file.name, url, path: fileRef.fullPath });
                }
                if (newAttachments.length > 0) {
                    const taskRef = doc(db, 'tasks', taskId);
                    await updateDoc(taskRef, {
                        attachments: arrayUnion(...newAttachments)
                    });
                }
            }

            toast({ title: selectedTask ? 'Task Updated' : 'Task Created', description: 'The task details have been saved.' });
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
        const newComment = {
            text: commentText,
            date: Timestamp.now(),
            authorId: user.uid,
        };

        try {
            const taskRef = doc(db, 'tasks', taskId);
            await updateDoc(taskRef, {
                comments: arrayUnion(newComment),
            });
            
            // Sync with local selected task to update comments UI live
            if (selectedTask && selectedTask.id === taskId) {
                setSelectedTask(prev => prev ? {
                    ...prev,
                    comments: [...(prev.comments || []), { ...newComment, date: new Date() }]
                } : null);
            }
            
            toast({ title: 'Comment Posted', description: 'Your comment has been added.' });
        } catch (error) {
            console.error("Error posting comment:", error);
            toast({ title: 'Error', description: 'Could not post comment.', variant: 'destructive' });
        }
    };

    const getServiceTypeColor = (type?: string) => {
        if (!type) return 'bg-slate-100 text-slate-700 border-slate-200';
        const upper = type.toUpperCase();
        if (upper.includes('VAT')) return 'bg-blue-50 text-blue-700 border-blue-150';
        if (upper.includes('PAYE') || upper.includes('EMP')) return 'bg-emerald-50 text-emerald-700 border-emerald-150';
        if (upper.includes('PAYROLL')) return 'bg-teal-50 text-teal-700 border-teal-150';
        if (upper.includes('MGMT') || upper.includes('MANAGEMENT')) return 'bg-purple-50 text-purple-700 border-purple-150';
        if (upper.includes('AFS') || upper.includes('FINANCIAL')) return 'bg-indigo-50 text-indigo-700 border-indigo-150';
        if (upper.includes('ITR') || upper.includes('INCOME')) return 'bg-rose-50 text-rose-700 border-rose-150';
        if (upper.includes('IRP') || upper.includes('PROVISIONAL')) return 'bg-amber-50 text-amber-700 border-amber-150';
        return 'bg-slate-50 text-slate-650 border-slate-200';
    };

    const parseTaskTitle = (title: string) => {
        const forIndex = title.lastIndexOf(' for ');
        const displayTitle = forIndex > -1 ? title.substring(0, forIndex) : title;
        const clientName = forIndex > -1 ? title.substring(forIndex + 5) : '';
        return { displayTitle, clientName };
    };

    // Helper to render task visual card
    const renderTaskCard = (task: Task) => {
        const dueDate = getTaskDate(task);
        const isOverdue = isPast(dueDate) && !isSameDay(dueDate, new Date()) && task.status !== 'Done';
        
        const priorityColor = 
            task.priority === 'High' ? 'bg-red-50 text-red-700 border-red-200/60' : 
            task.priority === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-200/60' : 
            'bg-slate-50 text-slate-650 border-slate-200/60';

        const leftBorderColor = 
            isOverdue ? 'border-l-red-550' : 
            task.status === 'Done' ? 'border-l-emerald-500' :
            task.status === 'In Progress' ? 'border-l-indigo-500' : 
            task.status === 'Review' ? 'border-l-purple-500' : 
            'border-l-slate-400';
            
        const { displayTitle, clientName } = parseTaskTitle(task.title);

        return (
            <Card 
                key={task.id} 
                draggable
                onDragStart={(e) => {
                    e.dataTransfer.setData('taskId', task.id);
                    e.dataTransfer.effectAllowed = 'move';
                }}
                className={cn(
                    "group relative border-y border-r border-slate-200/70 border-l-[6px] shadow-[0_2px_5px_rgba(0,0,0,0.03)] hover:shadow-md transition-all duration-200 cursor-grab active:cursor-grabbing overflow-hidden bg-white hover:border-slate-350 hover:border-l-[6px]",
                    task.status === 'Done' && 'opacity-70 grayscale-[20%]',
                    leftBorderColor
                )}
                onClick={() => { setSelectedTask(task); setIsFormOpen(true); }}
            >
                <CardContent className="p-4 space-y-2.5">
                    {/* Header: Service type tag + Priority tag */}
                    <div className="flex items-center justify-between gap-2">
                        <Badge variant="outline" className={cn("text-[9px] font-black uppercase px-2 py-0.5 tracking-wider border rounded-md h-5 shrink-0", getServiceTypeColor(task.type))}>
                            {task.type || 'Manual'}
                        </Badge>
                        
                        <div className="flex gap-1.5 items-center shrink-0">
                            {isOverdue && (
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                </span>
                            )}
                            {task.priority && (
                                <Badge variant="outline" className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded-full border h-5", priorityColor)}>
                                    {task.priority}
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Title & Client Name */}
                    <div className="space-y-1 pt-1">
                        <h4 className="text-sm font-extrabold text-slate-800 line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                            {displayTitle}
                        </h4>
                        {clientName && (
                            <p className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5 line-clamp-1 bg-slate-50 border border-slate-100 rounded px-1.5 py-0.5 mt-1.5 w-max max-w-full">
                                <span className="text-[9px] text-slate-400 font-normal uppercase tracking-wider">Client</span>
                                <span className="truncate">{clientName}</span>
                            </p>
                        )}
                    </div>

                    {/* Footer: Date & Assignees */}
                    <div className="flex items-center justify-between pt-2.5 border-t border-slate-50 text-[11px] mt-2">
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 font-bold">
                                <CalendarIcon className={cn("h-3.5 w-3.5", isOverdue ? "text-red-500 animate-pulse" : "text-slate-400")} />
                                <span className={cn(isOverdue ? "text-red-500" : "text-slate-500")}>
                                    {format(dueDate, 'dd MMM yyyy')}
                                </span>
                            </div>
                            {(task.comments?.length ?? 0) > 0 && (
                                <div className="flex items-center gap-1 text-slate-400 font-bold bg-slate-50 px-1.5 py-0.5 rounded-md border border-slate-100">
                                    <MessageSquare className="h-3 w-3" />
                                    <span>{task.comments?.length}</span>
                                </div>
                            )}
                            {(task.attachments?.length ?? 0) > 0 && (
                                <div className="flex items-center gap-1 text-slate-400 font-bold bg-slate-50 px-1.5 py-0.5 rounded-md border border-slate-100">
                                    <Paperclip className="h-3 w-3" />
                                    <span>{task.attachments?.length}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Assigned Avatars */}
                            <div className="flex -space-x-1.5">
                                {task.assignedTo?.slice(0, 3).map(uid => {
                                    const staff = allUsers.find(u => u.uid === uid);
                                    if (!staff) return null;
                                    return (
                                        <div 
                                            key={uid} 
                                            title={staff.name}
                                            className={cn(
                                                "h-5.5 w-5.5 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-black shadow-sm shrink-0", 
                                                getUserColor(staff.uid)
                                            )}
                                        >
                                            {staff.name.charAt(0)}
                                        </div>
                                    );
                                })}
                                {(!task.assignedTo || task.assignedTo.length === 0) && (
                                    <div className="h-5.5 w-5.5 rounded-full border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center" title="Unassigned">
                                        <UserIcon className="h-3 w-3 text-slate-300" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    };

    if (isLoading && tasks.length === 0) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary h-10 w-10" /></div>;

    return (
        <div className="space-y-8">
            {/* Top Title & Quick Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 bg-gradient-to-r from-slate-950 to-slate-700 bg-clip-text text-transparent">Welcome, {user?.name}!</h1>
                    <p className="text-sm font-semibold text-slate-400">Here's your practice overview and compliance schedule for today.</p>
                </div>
                
                <div className="flex items-center gap-3">
                    {/* View Switcher Toggle */}
                    <div className="bg-slate-100 p-0.5 rounded-lg flex items-center border">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className={cn("h-8 text-xs font-bold px-3", viewMode === 'list' ? "bg-white shadow-sm" : "text-slate-500 hover:text-slate-900")}
                            onClick={() => setViewMode('list')}
                        >
                            <List className="mr-1.5 h-3.5 w-3.5" /> List
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className={cn("h-8 text-xs font-bold px-3", viewMode === 'board' ? "bg-white shadow-sm" : "text-slate-500 hover:text-slate-900")}
                            onClick={() => setViewMode('board')}
                        >
                            <LayoutGrid className="mr-1.5 h-3.5 w-3.5" /> Board
                        </Button>
                    </div>

                    <Button className="shadow-md font-bold px-4" onClick={() => { setSelectedTask(null); setIsFormOpen(true); }}>
                        <PlusCircle className="mr-2 h-4.5 w-4.5" />
                        Create Task
                    </Button>
                </div>
            </div>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="sm:max-w-xl w-full flex flex-col max-h-[90vh] bg-white p-0 overflow-hidden">
                    <div className="p-6 border-b bg-gradient-to-r from-slate-900 to-slate-800 text-white relative">
                        <DialogHeader className="text-left mb-0">
                            <DialogTitle className="text-2xl font-black text-white leading-tight">{selectedTask ? 'Edit Task' : 'Create Task'}</DialogTitle>
                            <DialogDescription className="text-slate-300 text-xs font-medium mt-1">
                                {selectedTask ? 'Update task details, change status, or leave comments.' : 'Assign a new task to your team.'}
                            </DialogDescription>
                        </DialogHeader>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6">
                        {isFormOpen && (
                            <TaskForm 
                                task={selectedTask} 
                                allStaff={assignableStaff}
                                staffByDept={staffByDept} 
                                onSubmit={handleFormSubmit}
                                onCancel={() => setIsFormOpen(false)}
                                onCommentSubmit={handleCommentSubmit}
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* CENTRAL COMMAND HUB: Real-Time Operational Action Banners */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Metric 1: Community Moderation */}
                <Card className="border-slate-100 bg-white shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-[10px] font-extrabold uppercase text-amber-600 tracking-wider flex items-center gap-1">
                                <ShieldCheck className="h-3.5 w-3.5" /> Moderation Queue
                            </span>
                            <div className="text-2xl font-black text-slate-850">{pendingPosts.length}</div>
                            <p className="text-[11px] text-slate-400 font-medium">Pending Posts & Flagged Items</p>
                        </div>
                        <Badge variant={pendingPosts.length > 0 ? "default" : "outline"} className={cn("px-2.5 py-1 text-xs font-bold", pendingPosts.length > 0 ? "bg-amber-500 hover:bg-amber-600 text-white" : "text-slate-400")}>
                            {pendingPosts.length > 0 ? 'Needs Action' : 'Clear'}
                        </Badge>
                    </CardContent>
                </Card>

                {/* Metric 2: Unassigned Outsourced Orders */}
                <Card className="border-slate-100 bg-white shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-[10px] font-extrabold uppercase text-blue-600 tracking-wider flex items-center gap-1">
                                <ClipboardList className="h-3.5 w-3.5" /> Outsourced Orders
                            </span>
                            <div className="text-2xl font-black text-slate-850">{unassignedOutsourcedOrders.length}</div>
                            <p className="text-[11px] text-slate-400 font-medium">Unassigned Partner Orders</p>
                        </div>
                        <Badge variant={unassignedOutsourcedOrders.length > 0 ? "destructive" : "outline"} className="px-2.5 py-1 text-xs font-bold">
                            {unassignedOutsourcedOrders.length > 0 ? 'Unassigned' : 'All Set'}
                        </Badge>
                    </CardContent>
                </Card>

                {/* Metric 3: Active Partner Practices */}
                <Card className="border-slate-100 bg-white shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-[10px] font-extrabold uppercase text-indigo-600 tracking-wider flex items-center gap-1">
                                <Users className="h-3.5 w-3.5" /> Partner Practices
                            </span>
                            <div className="text-2xl font-black text-slate-850">{partnerPractices.length}</div>
                            <p className="text-[11px] text-slate-400 font-medium">Registered Practices</p>
                        </div>
                        <Badge variant="outline" className="px-2.5 py-1 text-xs font-bold text-indigo-600 border-indigo-200 bg-indigo-50">
                            Resellers
                        </Badge>
                    </CardContent>
                </Card>

                {/* Metric 4: CV Candidates */}
                <Card className="border-slate-100 bg-white shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-[10px] font-extrabold uppercase text-emerald-600 tracking-wider flex items-center gap-1">
                                <UserIcon className="h-3.5 w-3.5" /> Candidate Applications
                            </span>
                            <div className="text-2xl font-black text-slate-850">{cvLeadsList.length}</div>
                            <p className="text-[11px] text-slate-400 font-medium">CV Submissions</p>
                        </div>
                        <Badge variant="outline" className="px-2.5 py-1 text-xs font-bold text-emerald-600 border-emerald-200 bg-emerald-50">
                            Recruiting
                        </Badge>
                    </CardContent>
                </Card>
            </div>

            {/* ACTION SECTION: Community Moderation & Outsourced Orders Queues */}
            {(pendingPosts.length > 0 || unassignedOutsourcedOrders.length > 0) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Community Moderation Quick Queue */}
                    {pendingPosts.length > 0 && (
                        <Card className="border-amber-200 bg-gradient-to-br from-amber-50/50 to-white shadow-sm">
                            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-base font-black text-slate-850 flex items-center gap-2">
                                        <ShieldCheck className="h-4 w-4 text-amber-600" /> Community Moderation Queue
                                    </CardTitle>
                                    <CardDescription className="text-xs text-slate-500 font-medium">
                                        {pendingPosts.length} post(s) awaiting approval before publishing.
                                    </CardDescription>
                                </div>
                                <Button variant="outline" size="sm" asChild className="text-xs font-bold">
                                    <Link href="/admin/community">View All</Link>
                                </Button>
                            </CardHeader>
                            <CardContent className="p-4 space-y-3">
                                {pendingPosts.slice(0, 3).map(post => (
                                    <div key={post.id} className="p-3 bg-white border border-amber-200/80 rounded-xl space-y-2 shadow-xs">
                                        <div className="flex justify-between items-start gap-2">
                                            <h5 className="text-xs font-bold text-slate-800 line-clamp-1">{post.title || 'Untitled Post'}</h5>
                                            <Badge variant="outline" className="text-[9px] bg-amber-50 text-amber-700 border-amber-200">Pending</Badge>
                                        </div>
                                        <p className="text-[11px] text-slate-500 line-clamp-2">{post.content}</p>
                                        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                                            <span className="text-[10px] text-slate-400 font-medium">{post.authorName || 'Anonymous'}</span>
                                            <div className="flex gap-1.5">
                                                <Button size="xs" variant="destructive" className="h-6 text-[10px] px-2 font-bold" onClick={() => handleRejectPost(post.id)}>Reject</Button>
                                                <Button size="xs" className="h-6 text-[10px] px-2 font-bold bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleApprovePost(post.id)}>Approve</Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* Unassigned Outsourced Orders Queue */}
                    {unassignedOutsourcedOrders.length > 0 && (
                        <Card className="border-blue-200 bg-gradient-to-br from-blue-50/50 to-white shadow-sm">
                            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-base font-black text-slate-850 flex items-center gap-2">
                                        <ClipboardList className="h-4 w-4 text-blue-600" /> Outsourced Orders Needing Staff Assignment
                                    </CardTitle>
                                    <CardDescription className="text-xs text-slate-500 font-medium">
                                        {unassignedOutsourcedOrders.length} order(s) outsourced by partners.
                                    </CardDescription>
                                </div>
                                <Button variant="outline" size="sm" asChild className="text-xs font-bold">
                                    <Link href="/admin/orders">Manage Orders</Link>
                                </Button>
                            </CardHeader>
                            <CardContent className="p-4 space-y-3">
                                {unassignedOutsourcedOrders.slice(0, 3).map(ord => (
                                    <div key={ord.id} className="p-3 bg-white border border-blue-200/80 rounded-xl space-y-2 shadow-xs">
                                        <div className="flex justify-between items-start gap-2">
                                            <div>
                                                <span className="text-xs font-black text-primary">Order #{ord.originalOrderId || ord.id}</span>
                                                <p className="text-[11px] text-slate-600 font-medium">{ord.customerName}</p>
                                            </div>
                                            <Badge variant="outline" className="text-[9px] bg-blue-50 text-blue-700 border-blue-200 font-bold">Unassigned</Badge>
                                        </div>
                                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 gap-2">
                                            <Select onValueChange={(staffId) => handleAssignStaffToOrder(ord.id, staffId)}>
                                                <SelectTrigger className="h-7 text-[11px] font-medium w-48">
                                                    <SelectValue placeholder="Assign Staff Member..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {assignableStaff.map(s => (
                                                        <SelectItem key={s.id} value={s.id} className="text-xs font-medium">{s.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Button size="xs" variant="ghost" asChild className="h-7 text-[10px] font-bold">
                                                <Link href={`/admin/orders/${ord.id}`}>View Details</Link>
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* Practice Metrics & Performance Banner */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <Card className="lg:col-span-2 border-slate-100 bg-gradient-to-br from-white to-slate-50 shadow-sm">
                    <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-6">
                        <div className="flex-1 space-y-2 w-full">
                            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-slate-400">
                                <span>Practice Operations completion rate</span>
                                <span className="text-primary font-black">{practiceMetrics.completionRate}%</span>
                            </div>
                            <Progress value={practiceMetrics.completionRate} className="h-3 bg-slate-100 bg-gradient-to-r from-primary to-emerald-500" />
                            <p className="text-xs text-slate-500 font-medium">
                                Total practice portfolio completion metrics. Real-time updates based on active vs completed system roadmaps.
                            </p>
                        </div>
                        <div className="flex gap-4 shrink-0 justify-center">
                            <div className="text-center bg-white p-3 rounded-xl border shadow-sm w-20">
                                <span className="block text-2xl font-black text-slate-800">{practiceMetrics.activeCount}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Active</span>
                            </div>
                            <div className="text-center bg-white p-3 rounded-xl border shadow-sm w-20">
                                <span className="block text-2xl font-black text-slate-850">{practiceMetrics.doneCount}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Done</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Overdue Alert banner/metrics */}
                <Card className={cn(
                    "border-destructive/10 bg-gradient-to-br from-destructive/5 to-white shadow-sm relative overflow-hidden transition-all duration-300",
                    overdueTasks.length > 0 ? "border-l-4 border-l-destructive" : ""
                )}>
                    <CardContent className="p-6 flex items-center justify-between gap-4">
                        <div className="space-y-1">
                            <span className="text-xs font-black text-destructive uppercase tracking-wider flex items-center gap-1">
                                <AlertTriangle className="h-4 w-4" /> Attention Required
                            </span>
                            <h4 className="text-2xl font-black text-slate-850">{overdueTasks.length} Overdue Tasks</h4>
                            <p className="text-xs text-slate-500 font-medium">Action immediate compliance requirements.</p>
                        </div>
                        {overdueTasks.length > 0 && (
                            <Badge variant="destructive" className="px-3 py-1 font-bold animate-pulse">LATE</Badge>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Overdue Tasks Alert Banner */}
            {overdueTasks.length > 0 && (
                <Card className="border-red-250 bg-gradient-to-r from-red-50/70 to-red-50/20 border-l-4 border-l-red-500 shadow-sm animate-in fade-in duration-300">
                    <CardContent className="p-4.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-red-100 text-red-700 p-2.5 rounded-xl"><AlertOctagon className="h-5.5 w-5.5" /></div>
                            <div>
                                <h4 className="text-sm font-black text-slate-800">You have {overdueTasks.length} Overdue Compliance Tasks</h4>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">These tasks have missed their statutory due dates. Please review them in the To-Do column.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <Select value={overdueTaskTypeFilter} onValueChange={setOverdueTaskTypeFilter}>
                                <SelectTrigger className="w-[180px] h-8.5 text-xs font-bold bg-white border-red-200 text-red-700 focus:ring-red-200">
                                    <SelectValue placeholder="Filter overdue..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Overdue Types</SelectItem>
                                    {availableTaskTypes.map(type => (
                                        <SelectItem key={type} value={type}>{taskTypeLabels[type] || type}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button size="sm" variant="destructive" className="h-8.5 font-bold text-xs px-4" onClick={() => setViewMode('list')}>
                                View List
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
            {/* Recent Communications */}
            {unarchivedComms.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-500 flex items-center gap-2 px-2">
                        <MessageSquare className="h-4 w-4" /> Recent Client Emails
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        {unarchivedComms.map((comm) => (
                            <Card key={comm.id} className="border-primary/10 bg-white shadow-sm flex flex-col">
                                <CardContent className="p-4 space-y-2 flex-1">
                                    <div className="flex justify-between items-start gap-2">
                                        <span className="text-xs font-bold text-slate-800 line-clamp-1">{comm.customerName}</span>
                                        <span className="text-[10px] text-slate-400 font-semibold shrink-0">
                                            {isSameDay(comm.date, new Date()) ? format(comm.date, 'HH:mm') : format(comm.date, 'MMM d')}
                                        </span>
                                    </div>
                                    <p className="text-[11px] font-semibold text-slate-600 line-clamp-1 bg-slate-50 p-1 rounded border border-slate-100">
                                        {comm.subject || 'No Subject'}
                                    </p>
                                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                        {comm.text}
                                    </p>
                                    {comm.latestNote && (
                                        <div className="mt-2 pt-2 border-t border-slate-100">
                                            <p className="text-[10px] font-bold text-slate-400 mb-0.5">LATEST NOTE</p>
                                            <p className="text-[11px] text-slate-600 line-clamp-2 italic">{comm.latestNote}</p>
                                        </div>
                                    )}
                                </CardContent>
                                <div className="p-2 border-t bg-slate-50/50 flex items-center justify-between gap-2 mt-auto">
                                    <Button variant="ghost" size="sm" className="h-7 text-[10px] text-slate-500 hover:text-slate-900 px-2" onClick={(e) => handleArchiveComm(e, comm.id)}>
                                        <X className="h-3 w-3 mr-1" /> Archive
                                    </Button>
                                    <Button variant="outline" size="sm" className="h-7 text-[10px] font-bold px-3" asChild>
                                        <Link href={`/admin/orders/${comm.orderId}`}>
                                            View Order <ArrowRight className="h-3 w-3 ml-1" />
                                        </Link>
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* New Demo Leads */}
            {user?.role === 'admin' && unarchivedDemoLeads.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-500 flex items-center gap-2 px-2">
                        <Users className="h-4 w-4" /> New Demo Leads
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        {unarchivedDemoLeads.map((lead) => (
                            <Card key={lead.id} className="border-primary/10 bg-white shadow-sm flex flex-col">
                                <CardContent className="p-4 space-y-2 flex-1">
                                    <div className="flex justify-between items-start gap-2">
                                        <span className="text-xs font-bold text-slate-800 line-clamp-1">{lead.name} {lead.surname}</span>
                                        <span className="text-[10px] text-slate-400 font-semibold shrink-0">
                                            {lead.createdAt ? (isSameDay(lead.createdAt.toDate ? lead.createdAt.toDate() : new Date(lead.createdAt), new Date()) ? format(lead.createdAt.toDate ? lead.createdAt.toDate() : new Date(lead.createdAt), 'HH:mm') : format(lead.createdAt.toDate ? lead.createdAt.toDate() : new Date(lead.createdAt), 'MMM d')) : ''}
                                        </span>
                                    </div>
                                    <p className="text-[11px] font-semibold text-slate-600 line-clamp-1 bg-slate-50 p-1 rounded border border-slate-100">
                                        Demo Request
                                    </p>
                                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                        {lead.email}
                                        <br/>
                                        {lead.cell}
                                    </p>
                                </CardContent>
                                <div className="p-2 border-t bg-slate-50/50 flex items-center justify-between gap-2 mt-auto">
                                    <Button variant="ghost" size="sm" className="h-7 text-[10px] text-slate-500 hover:text-slate-900 px-2" onClick={(e) => lead.id && handleArchiveDemoLead(e, lead.id)}>
                                        <X className="h-3 w-3 mr-1" /> Hide
                                    </Button>
                                    <Button variant="outline" size="sm" className="h-7 text-[10px] font-bold px-3" asChild>
                                        <Link href={`/admin/demo-leads`}>
                                            View Leads <ArrowRight className="h-3 w-3 ml-1" />
                                        </Link>
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Kanban Board View */}
            {viewMode === 'board' ? (
                <div className="space-y-6 bg-slate-50/70 p-6 rounded-3xl border border-slate-100 shadow-inner animate-in fade-in duration-300">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div 
                            className="flex items-center gap-2 cursor-pointer group select-none" 
                            onClick={toggleTaskBoard}
                        >
                            <h3 className="text-sm font-black uppercase tracking-wider text-slate-500 flex items-center gap-2 group-hover:text-slate-800 transition-colors">
                                <LayoutGrid className="h-4 w-4" /> Interactive Task Board
                            </h3>
                            {isTaskBoardOpen ? 
                                <ChevronUp className="h-4 w-4 text-slate-400 group-hover:text-slate-800" /> : 
                                <ChevronDown className="h-4 w-4 text-slate-400 group-hover:text-slate-800" />
                            }
                        </div>
                        
                        <div className={cn("flex flex-wrap items-center gap-2 transition-opacity duration-300", !isTaskBoardOpen && "opacity-0 pointer-events-none")}>
                            <div className="bg-white p-0.5 rounded-md border flex items-center shadow-sm">
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className={cn("h-7 text-[10px] font-bold px-2.5", boardScope === 'my' ? "bg-primary/10 text-primary" : "text-slate-500 hover:text-slate-900")}
                                    onClick={() => setBoardScope('my')}
                                >
                                    My Tasks
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className={cn("h-7 text-[10px] font-bold px-2.5", boardScope === 'all' ? "bg-primary/10 text-primary" : "text-slate-500 hover:text-slate-900")}
                                    onClick={() => setBoardScope('all')}
                                >
                                    Practice Tasks
                                </Button>
                            </div>

                            <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block"></div>

                            <Select value={boardAssignee} onValueChange={setBoardAssignee}>
                                <SelectTrigger className="w-[140px] h-8 text-xs font-semibold bg-white shadow-sm border-slate-200">
                                    <SelectValue placeholder="Assignee" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Assignees</SelectItem>
                                    {assignableStaff.map(staff => (
                                        <SelectItem key={staff.id} value={staff.id}>{staff.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={taskTypeFilter} onValueChange={setTaskTypeFilter}>
                                <SelectTrigger className="w-[150px] h-8 text-xs font-semibold bg-white shadow-sm border-slate-200">
                                    <SelectValue placeholder="Service Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Services</SelectItem>
                                    {availableTaskTypes.map(type => (
                                        <SelectItem key={type} value={type}>{taskTypeLabels[type] || type}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {isTaskBoardOpen && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 animate-in fade-in slide-in-from-top-4 duration-300">
                        {/* COLUMN 1: To-Do */}
                        <div 
                            className="bg-slate-100/85 border border-slate-200/50 rounded-2xl p-4 flex flex-col h-[720px] shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => handleDrop(e, 'To-Do')}
                        >
                            <div className="flex justify-between items-center border-b border-slate-200/80 pb-3 mb-4">
                                <span className="text-xs font-black text-slate-650 uppercase tracking-widest">To-Do</span>
                                <Badge variant="secondary" className="font-extrabold text-[10px] px-2.5 bg-slate-250/90 text-slate-700">{boardTasks.filter(t => t.status === 'To-Do').length}</Badge>
                            </div>
                            <ScrollArea className="flex-1 -mr-3 pr-3">
                                <div className="space-y-3.5 pb-4">
                                    {boardTasks.filter(t => t.status === 'To-Do').map(task => renderTaskCard(task))}
                                </div>
                            </ScrollArea>
                        </div>

                        {/* COLUMN 2: In Progress */}
                        <div 
                            className="bg-slate-100/85 border border-slate-200/50 rounded-2xl p-4 flex flex-col h-[720px] shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => handleDrop(e, 'In Progress')}
                        >
                            <div className="flex justify-between items-center border-b border-slate-200/80 pb-3 mb-4">
                                <span className="text-xs font-black text-slate-650 uppercase tracking-widest text-indigo-755">In Progress</span>
                                <Badge variant="secondary" className="font-extrabold text-[10px] px-2.5 bg-indigo-100 text-indigo-700 border-indigo-200/50">{boardTasks.filter(t => t.status === 'In Progress').length}</Badge>
                            </div>
                            <ScrollArea className="flex-1 -mr-3 pr-3">
                                <div className="space-y-3.5 pb-4">
                                    {boardTasks.filter(t => t.status === 'In Progress').map(task => renderTaskCard(task))}
                                </div>
                            </ScrollArea>
                        </div>

                        {/* COLUMN 3: Review */}
                        <div 
                            className="bg-slate-100/85 border border-slate-200/50 rounded-2xl p-4 flex flex-col h-[720px] shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => handleDrop(e, 'Review')}
                        >
                            <div className="flex justify-between items-center border-b border-slate-200/80 pb-3 mb-4">
                                <span className="text-xs font-black text-slate-650 uppercase tracking-widest text-purple-755">Review</span>
                                <Badge variant="secondary" className="font-extrabold text-[10px] px-2.5 bg-purple-100 text-purple-700 border-purple-200/50">{boardTasks.filter(t => t.status === 'Review').length}</Badge>
                            </div>
                            <ScrollArea className="flex-1 -mr-3 pr-3">
                                <div className="space-y-3.5 pb-4">
                                    {boardTasks.filter(t => t.status === 'Review').map(task => renderTaskCard(task))}
                                </div>
                            </ScrollArea>
                        </div>

                        {/* COLUMN 4: Done */}
                        <div 
                            className="bg-emerald-50/50 border border-emerald-100/50 rounded-2xl p-4 flex flex-col h-[720px] shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => handleDrop(e, 'Done')}
                        >
                            <div className="flex justify-between items-center border-b border-emerald-200/60 pb-3 mb-4">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-black text-emerald-700 uppercase tracking-widest">Done</span>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger><CheckCircle2 className="h-3 w-3 text-emerald-500" /></TooltipTrigger>
                                            <TooltipContent><p className="text-xs">Showing tasks completed in the last 7 days</p></TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                                <Badge variant="secondary" className="font-extrabold text-[10px] px-2.5 bg-emerald-100 text-emerald-700 border-emerald-200/50">{boardDoneTasks.length}</Badge>
                            </div>
                            <ScrollArea className="flex-1 -mr-3 pr-3">
                                <div className="space-y-3.5 pb-4">
                                    {boardDoneTasks.map(task => renderTaskCard(task))}
                                </div>
                            </ScrollArea>
                        </div>
                    </div>
                    )}
                </div>
            ) : (
                /* Sleek List View */
                <div className="space-y-8 animate-in fade-in duration-300">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 px-2">
                        <div 
                            className="flex items-center gap-2 cursor-pointer group select-none" 
                            onClick={toggleTaskBoard}
                        >
                            <h3 className="text-sm font-black uppercase tracking-wider text-slate-500 flex items-center gap-2 group-hover:text-slate-800 transition-colors">
                                <List className="h-4 w-4" /> Task List View
                            </h3>
                            {isTaskBoardOpen ? 
                                <ChevronUp className="h-4 w-4 text-slate-400 group-hover:text-slate-800" /> : 
                                <ChevronDown className="h-4 w-4 text-slate-400 group-hover:text-slate-800" />
                            }
                        </div>
                    </div>
                    {isTaskBoardOpen && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-300">
                            {/* My Upcoming Tasks */}
                            <Card className="border rounded-2xl shadow-sm bg-white overflow-hidden">
                                <CardHeader className="bg-slate-50/40 border-b pb-4">
                                    <CardTitle className="text-md flex items-center gap-2 text-slate-900 font-extrabold">
                                        <ClipboardList className="h-5 w-5 text-primary" />
                                My Upcoming Assigned Tasks
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-slate-50/10">
                                    <TableRow className="border-b">
                                        <TableHead className="font-bold text-slate-500">Task Details</TableHead>
                                        <TableHead className="font-bold text-slate-500">Due Date</TableHead>
                                        <TableHead className="font-bold text-slate-500">Status</TableHead>
                                        <TableHead className="text-right font-bold text-slate-500 pr-6">Quick Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {myTasks.map(task => {
                                        const date = getTaskDate(task);
                                        return (
                                            <TableRow key={task.id} className="hover:bg-slate-50/30 transition-colors border-b cursor-pointer" onClick={() => { setSelectedTask(task); setIsFormOpen(true); }}>
                                                <TableCell className="font-semibold text-slate-900 py-3">
                                                    <p className="line-clamp-1">{task.title}</p>
                                                    <p className="text-xs text-slate-400 font-medium line-clamp-1 mt-0.5">{task.description}</p>
                                                </TableCell>
                                                <TableCell className="text-xs text-slate-600 font-medium py-3">
                                                    {format(date, 'dd MMM yyyy')}
                                                </TableCell>
                                                <TableCell className="py-3">
                                                    <Badge variant="outline" className="text-[9px] font-black uppercase bg-slate-50 text-slate-600 border-slate-200">
                                                        {task.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right pr-6 py-3" onClick={(e) => e.stopPropagation()}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:bg-emerald-50" onClick={() => handleUpdate(task.id, { status: 'Done' })}>
                                                        <Check className="h-4.5 w-4.5" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    {myTasks.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-10 text-slate-400 font-medium">
                                                No upcoming assigned tasks.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Practice Compliance Roadmap List */}
                    <Card className="border rounded-2xl shadow-sm bg-white overflow-hidden">
                        <CardHeader className="bg-slate-50/40 border-b pb-4">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                <div>
                                    <CardTitle className="text-md flex items-center gap-2 text-slate-900 font-extrabold">
                                        <Repeat className="h-5 w-5 text-primary" />
                                        Practice Compliance Roadmap
                                    </CardTitle>
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="flex items-center gap-2">
                                        <Filter className="h-4 w-4 text-slate-400" />
                                        <Select value={taskTypeFilter} onValueChange={(val) => { setTaskTypeFilter(val); setSelectedRoadmapIds([]); }}>
                                            <SelectTrigger className="w-[180px] h-8 text-xs font-semibold">
                                                <SelectValue placeholder="Filter service..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Services</SelectItem>
                                                {availableTaskTypes.map(type => (
                                                    <SelectItem key={type} value={type}>{taskTypeLabels[type] || type}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {selectedRoadmapIds.length > 0 && (
                                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                                            <Badge variant="secondary" className="px-3 h-8 gap-2 font-bold text-xs">
                                                {selectedRoadmapIds.length} Selected
                                                <X 
                                                    className="h-3 w-3 cursor-pointer hover:text-destructive" 
                                                    onClick={() => setSelectedRoadmapIds([])}
                                                />
                                            </Badge>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button size="sm" className="h-8 gap-1.5 font-bold text-xs">
                                                        <CheckSquare className="h-3.5 w-3.5" />
                                                        Bulk Assign...
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-56">
                                                    <DropdownMenuLabel>Select Staff Member</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <ScrollArea className="h-64">
                                                        {assignableStaff.map(staff => (
                                                            <DropdownMenuItem key={staff.id} onSelect={() => handleBulkAssign(staff.id)}>
                                                                {staff.name}
                                                            </DropdownMenuItem>
                                                        ))}
                                                    </ScrollArea>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-slate-50/10">
                                    <TableRow className="border-b">
                                        <TableHead className="w-12 py-3 pl-4">
                                            <Checkbox 
                                                checked={roadmapTasks.length > 0 && selectedRoadmapIds.length === roadmapTasks.length}
                                                onCheckedChange={(checked) => setSelectedRoadmapIds(checked ? roadmapTasks.map(t => t.id) : [])}
                                            />
                                        </TableHead>
                                        <TableHead className="font-bold text-slate-500 py-3">Service Task</TableHead>
                                        <TableHead className="font-bold text-slate-500 py-3 text-center">Assigned To</TableHead>
                                        <TableHead className="font-bold text-slate-500 py-3">Due Date</TableHead>
                                        <TableHead className="text-right font-bold text-slate-500 pr-6 py-3">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {roadmapTasks.map(task => (
                                        <TableRow key={task.id} className={cn("hover:bg-slate-50/30 transition-colors border-b cursor-pointer", selectedRoadmapIds.includes(task.id) && "bg-primary/5")} onClick={() => { setSelectedTask(task); setIsFormOpen(true); }}>
                                            <TableCell className="py-3 pl-4" onClick={(e) => e.stopPropagation()}>
                                                <Checkbox 
                                                    checked={selectedRoadmapIds.includes(task.id)}
                                                    onCheckedChange={(checked) => setSelectedRoadmapIds(prev => checked ? [...prev, task.id] : prev.filter(id => id !== task.id))}
                                                />
                                            </TableCell>
                                            <TableCell className="font-semibold text-slate-900 py-3">
                                                <p className="line-clamp-1">{task.title}</p>
                                                <div className="flex gap-1.5 mt-1">
                                                    {task.recurrence && <Badge variant="outline" className="text-[8px] h-4.5 font-bold uppercase tracking-tight">{task.recurrence}</Badge>}
                                                    {task.type && <Badge variant="secondary" className="text-[8px] h-4.5 font-bold uppercase tracking-tight">{task.type}</Badge>}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-3" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex justify-center items-center -space-x-1.5">
                                                    {task.assignedTo?.map(uid => {
                                                        const staff = allUsers.find(u => u.uid === uid);
                                                        if (!staff) return null;
                                                        return (
                                                            <TooltipProvider key={uid}>
                                                                <Tooltip>
                                                                    <TooltipTrigger>
                                                                        <div className={cn("h-6 w-6 rounded-full border border-white flex items-center justify-center text-[9px] font-black shadow-sm", getUserColor(staff.uid))}>
                                                                            {staff.name.charAt(0)}
                                                                        </div>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>{staff.name}</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        );
                                                    })}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-xs text-slate-600 font-medium py-3">
                                                {format(getTaskDate(task), 'dd MMM yyyy')}
                                                {isPast(getTaskDate(task)) && !isSameDay(getTaskDate(task), new Date()) && (
                                                    <span className="ml-2 text-[10px] font-bold text-red-500 animate-pulse uppercase tracking-wider">Overdue</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right pr-6 py-3" onClick={(e) => e.stopPropagation()}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => handleUpdate(task.id, { status: 'In Progress' })}>
                                                            Mark In Progress
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleUpdate(task.id, { status: 'Review' })}>
                                                            Send to Review
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50" onClick={() => handleUpdate(task.id, { status: 'Done' })}>
                                                            Mark as Done
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {roadmapTasks.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-10 text-slate-400 font-medium">
                                                No roadmap tasks match the current filter.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
