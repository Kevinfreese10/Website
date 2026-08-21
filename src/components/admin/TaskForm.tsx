'use client';
import { useState, useMemo } from 'react';

import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Task, User, TaskComment } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, MoreHorizontal, Check, Paperclip, X } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn, isStaffActive } from '@/lib/utils';
import { format } from 'date-fns';
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList, CommandGroup } from '@/components/ui/command';
import { Separator } from '@/components/ui/separator';

const taskRecurrences = ['None', 'Daily', 'Weekly', 'Monthly', 'Bi-Monthly', 'Semi-Annually', 'Annually'] as const;

export const taskTypes: Record<string, string> = {
    'GENERAL': 'General',
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

const taskPriorities = ['Low', 'Medium', 'High'] as const;

export const formSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(5, 'Title is required.'),
  description: z.string().min(10, 'Description is required.'),
  assignedTo: z.array(z.string()).min(1, 'Please assign a staff member.'),
  tags: z.array(z.string()).optional(),
  dueDate: z.date({ required_error: 'A due date is required.'}),
  recurrence: z.enum(taskRecurrences).optional(),
  type: z.string().optional(),
  priority: z.enum(taskPriorities).optional(),
  orderId: z.string().optional(),
  newComment: z.string().optional(),
});

export type TaskFormValues = z.infer<typeof formSchema>;

export default function TaskForm({ 
    task, 
    onSubmit, 
    onCancel, 
    onCommentSubmit, 
    allStaff, 
    staffByDept,
    isSubmitting
}: { 
    task: Partial<Task> | null, 
    onSubmit: (data: any, files?: File[]) => void, 
    onCancel: () => void, 
    onCommentSubmit: (taskId: string, commentText: string) => void, 
    allStaff: User[], 
    staffByDept: Record<string, User[]>,
    isSubmitting?: boolean
}) {
    const { user } = useAuth();
    const [isCommenting, setIsCommenting] = useState(false);
    const [pendingFiles, setPendingFiles] = useState<File[]>([]);

    const assignableStaff = useMemo(() => {
        const active = allStaff.filter(isStaffActive);
        const currentAssigned = task?.assignedTo || [];
        const inactiveCurrent = allStaff.filter(s => currentAssigned.includes(s.id) && !isStaffActive(s));
        return [...active, ...inactiveCurrent];
    }, [allStaff, task?.assignedTo]);

    const getTaskDate = (task: Partial<Task>): Date => {
      if (!task?.dueDate) return new Date();
      if (task.dueDate instanceof Date) {
          return task.dueDate;
      }
      if (typeof (task.dueDate as any).toDate === 'function') {
          return (task.dueDate as any).toDate();
      }
      return new Date(task.dueDate);
    };

    const form = useForm<TaskFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            id: task?.id || '',
            title: task?.title || '',
            description: task?.description || '',
            assignedTo: task?.assignedTo || [],
            tags: task?.tags || [],
            dueDate: getTaskDate(task || {}),
            recurrence: task?.recurrence || 'None',
            type: task?.type || '',
            priority: (task?.priority as any) || 'Medium',
            orderId: task?.orderId || '',
            newComment: '',
        },
    });

    const handleSubmit = (values: TaskFormValues) => {
        onSubmit(values, pendingFiles);
    };
    
    const handleCommentSubmit = async () => {
        if (!task || !task.id) return;
        const commentText = form.getValues('newComment');
        if (commentText) {
            setIsCommenting(true);
            try {
                await onCommentSubmit(task.id, commentText);
                form.setValue('newComment', '');
            } finally {
                setIsCommenting(false);
            }
        }
    };
    
    const getAuthor = (authorId: string): User | undefined => {
        return allStaff.find(u => u.id === authorId);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto p-1 pr-4">
                <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} rows={3} /></FormControl><FormMessage /></FormItem>)} />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="type" render={({ field }) => (<FormItem><FormLabel>Task Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger></FormControl><SelectContent>{Object.entries(taskTypes).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="priority" render={({ field }) => (<FormItem><FormLabel>Priority</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select priority..." /></SelectTrigger></FormControl><SelectContent>{taskPriorities.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="assignedTo"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Assign To</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                    variant="outline"
                                    role="combobox"
                                    className={cn(
                                        "w-full justify-between",
                                        !field.value?.length && "text-muted-foreground"
                                    )}
                                    >
                                    {field.value?.length > 0
                                        ? `${field.value.length} selected`
                                        : "Select member"}
                                    <MoreHorizontal className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command>
                                    <CommandInput placeholder="Search..." />
                                    <CommandList>
                                    <CommandEmpty>No results found.</CommandEmpty>
                                    <CommandGroup heading="Teams">
                                        {Object.keys(staffByDept).map(dept => (
                                            <CommandItem key={dept} onSelect={() => field.onChange(staffByDept[dept]?.filter(isStaffActive).map(s => s.id) || [])}>{dept} Dept</CommandItem>
                                        ))}
                                    </CommandGroup>
                                    <CommandGroup heading="Assignable Members">
                                        {assignableStaff.map((staff: User) => {
                                            const isInactive = !isStaffActive(staff);
                                            return (
                                                <CommandItem
                                                    key={staff.id}
                                                    value={`${staff.name} ${staff.email || ''}`}
                                                    onSelect={() => {
                                                        const selection = new Set(field.value);
                                                        if (selection.has(staff.id)) {
                                                            selection.delete(staff.id);
                                                        } else {
                                                            selection.add(staff.id);
                                                        }
                                                        field.onChange(Array.from(selection));
                                                    }}
                                                >
                                                    <div
                                                        className={cn(
                                                            "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                                            field.value?.includes(staff.id)
                                                            ? "bg-primary text-primary-foreground"
                                                            : "opacity-50 [&_svg]:invisible"
                                                        )}
                                                    >
                                                        <Check className={cn("h-4 w-4")} />
                                                    </div>
                                                    <span className={cn(isInactive && "text-muted-foreground line-through opacity-75")}>
                                                        {staff.name} {isInactive ? '(Inactive)' : ''}
                                                    </span>
                                                </CommandItem>
                                            );
                                        })}
                                    </CommandGroup>
                                    </CommandList>
                                </Command>
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                     <FormField
                        control={form.control}
                        name="dueDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col pt-2">
                            <FormLabel className="mb-1">Due Date</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                    )}
                                    >
                                    {field.value ? (
                                        format(field.value, "dd/MM/yyyy")
                                    ) : (
                                        <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    initialFocus
                                />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                </div>

                <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Tag Staff (Optional)</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                    "w-full justify-between",
                                    !(field.value && field.value.length) && "text-muted-foreground"
                                )}
                                >
                                {field.value && field.value.length > 0
                                    ? `${field.value.length} tagged`
                                    : "Select staff to tag..."}
                                <MoreHorizontal className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                                <CommandInput placeholder="Search..." />
                                <CommandList>
                                <CommandEmpty>No results found.</CommandEmpty>
                                <CommandGroup heading="Members">
                                    {allStaff.filter(isStaffActive).map((staff: User) => (
                                    <CommandItem
                                        key={staff.id}
                                        value={`${staff.name} ${staff.email || ''}`}
                                        onSelect={() => {
                                        const selection = new Set(field.value);
                                        if (selection.has(staff.id)) {
                                            selection.delete(staff.id);
                                        } else {
                                            selection.add(staff.id);
                                        }
                                        field.onChange(Array.from(selection));
                                        }}
                                    >
                                        <div
                                        className={cn(
                                            "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                            field.value?.includes(staff.id)
                                            ? "bg-primary text-primary-foreground"
                                            : "opacity-50 [&_svg]:invisible"
                                        )}
                                        >
                                        <Check className={cn("h-4 w-4")} />
                                        </div>
                                        <span className="flex-grow">{staff.name}</span>
                                    </CommandItem>
                                    ))}
                                </CommandGroup>
                                </CommandList>
                            </Command>
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField control={form.control} name="orderId" render={({ field }) => (<FormItem><FormLabel>Related Order ID (Optional)</FormLabel><FormControl><Input {...field} placeholder="e.g. ORD-12345" /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="recurrence" render={({ field }) => (<FormItem><FormLabel>Recurrence</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select recurrence..." /></SelectTrigger></FormControl><SelectContent>{taskRecurrences.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                
                <div className="space-y-3 pt-2">
                    <FormLabel>Attachments</FormLabel>
                    
                    {task?.attachments && task.attachments.length > 0 && (
                        <div className="space-y-2 mb-4 bg-muted/50 p-3 rounded-md">
                            <p className="text-xs font-semibold text-muted-foreground mb-2">Existing Attachments</p>
                            {task.attachments.map((file, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm bg-background p-2 rounded border">
                                    <Paperclip className="h-4 w-4 text-primary" />
                                    <a href={file.url} target="_blank" rel="noopener noreferrer" className="flex-1 hover:underline truncate text-primary">{file.name}</a>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center gap-4">
                        <Input 
                            type="file" 
                            multiple 
                            onChange={(e) => {
                                if (e.target.files) {
                                    setPendingFiles(Array.from(e.target.files));
                                }
                            }}
                            className="flex-1"
                        />
                    </div>
                    {pendingFiles.length > 0 && (
                        <div className="space-y-2 mt-2">
                            <p className="text-xs font-medium text-muted-foreground">Files to attach:</p>
                            {pendingFiles.map((file, i) => (
                                <div key={i} className="flex items-center justify-between bg-muted/30 p-2 rounded text-sm border">
                                    <div className="flex items-center gap-2 truncate">
                                        <Paperclip className="h-4 w-4 text-slate-400" />
                                        <span className="truncate">{file.name}</span>
                                    </div>
                                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-destructive" onClick={() => setPendingFiles(prev => prev.filter((_, idx) => idx !== i))}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                {task?.id && (
                    <>
                        <Separator />
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-foreground">Comments</h3>
                            <div className="space-y-4 max-h-40 overflow-y-auto pr-2">
                                {task.comments && task.comments.length > 0 ? task.comments.slice().reverse().map((comment, index) => {
                                    const author = getAuthor(comment.authorId);
                                    const date = comment.date?.toDate ? comment.date.toDate() : new Date(comment.date);
                                    return (
                                    <div key={index} className="flex items-start gap-3">
                                        <div className="bg-muted p-3 rounded-lg w-full">
                                            <div className="flex justify-between items-center mb-1">
                                                <p className="text-xs font-semibold">{author?.name || 'Unknown'}</p>
                                                <p className="text-xs text-muted-foreground">{format(date, 'dd/MM/yyyy, HH:mm')}</p>
                                            </div>
                                            <p className="text-sm">{comment.text}</p>
                                        </div>
                                    </div>
                                )}) : <p className="text-xs text-muted-foreground text-center py-4">No comments posted yet.</p>}
                            </div>
                            <FormField 
                                control={form.control} 
                                name="newComment" 
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Add a Comment</FormLabel>
                                    <FormControl><Textarea {...field} placeholder="Post a new comment..." rows={2}/></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                            <Button type="button" size="sm" onClick={handleCommentSubmit} disabled={isCommenting}>
                                {isCommenting ? 'Posting...' : 'Post Comment'}
                            </Button>
                        </div>
                    </>
                )}

                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Save Task'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
