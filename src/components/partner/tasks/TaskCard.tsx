'use client';

import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Calendar, MoreVertical, Trash2, ArrowLeft, ArrowRight, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';
import { Task } from '@/lib/types';
import { usePartner } from '@/contexts/PartnerContext';

interface StaffMember {
  id: string;
  name: string;
}

interface TaskCardProps {
  task: Task;
  staffList: StaffMember[];
  onStatusChange: (taskId: string, newStatus: Task['status']) => void;
  onDelete: (taskId: string) => void;
}

const STATUSES: Task['status'][] = ['To-Do', 'In Progress', 'Review', 'Done'];

export function TaskCard({ task, staffList, onStatusChange, onDelete }: TaskCardProps) {
  const { canDo } = usePartner();

  const isEditable = canDo('tasks', 'full');

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'High':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'Medium':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'Low':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  // Resolve assignee names
  const assignees = task.assignedTo
    ? task.assignedTo.map(id => {
        const staff = staffList.find(s => s.id === id);
        return staff ? staff.name : 'Unknown';
      })
    : [];

  const formattedDate = task.dueDate
    ? format(task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate), 'd MMM yyyy')
    : null;

  const currentStatusIndex = STATUSES.indexOf(task.status);

  const handleMoveLeft = () => {
    if (currentStatusIndex > 0) {
      onStatusChange(task.id, STATUSES[currentStatusIndex - 1]);
    }
  };

  const handleMoveRight = () => {
    if (currentStatusIndex < STATUSES.length - 1) {
      onStatusChange(task.id, STATUSES[currentStatusIndex + 1]);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow bg-card border-muted select-none">
      <CardContent className="p-4 space-y-3">
        {/* Title & Actions Menu */}
        <div className="flex justify-between items-start gap-2">
          <h4 className="font-semibold text-sm text-foreground line-clamp-2 leading-snug">{task.title}</h4>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled className="text-xs font-semibold">Change Status</DropdownMenuItem>
              {STATUSES.map(status => (
                <DropdownMenuItem 
                  key={status} 
                  disabled={!isEditable || task.status === status}
                  onClick={() => onStatusChange(task.id, status)}
                  className="text-xs"
                >
                  {status}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={!isEditable}
                className="text-destructive font-semibold"
                onClick={() => onDelete(task.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Task
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Description */}
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-3 leading-normal">{task.description}</p>
        )}

        {/* Priority & Meta */}
        <div className="flex flex-wrap gap-2 items-center justify-between pt-1">
          <Badge variant="outline" className={`text-[10px] py-0.5 ${getPriorityColor(task.priority)}`}>
            {task.priority}
          </Badge>

          {formattedDate && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{formattedDate}</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="px-4 pb-3 pt-0 flex justify-between items-center border-t border-muted/50 mt-2 pt-2.5">
        {/* Assignees */}
        <div className="flex -space-x-2 overflow-hidden max-w-[120px]">
          {assignees.map((name, i) => {
            const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            return (
              <div
                key={i}
                title={name}
                className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 border border-background text-[10px] font-bold text-primary"
              >
                {initials}
              </div>
            );
          })}
          {assignees.length === 0 && (
            <span className="text-[10px] text-muted-foreground italic">Unassigned</span>
          )}
        </div>

        {/* Action Arrows */}
        {isEditable && (
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-6 w-6 rounded-md hover:bg-muted"
              disabled={currentStatusIndex === 0}
              onClick={handleMoveLeft}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-6 w-6 rounded-md hover:bg-muted"
              disabled={currentStatusIndex === STATUSES.length - 1}
              onClick={handleMoveRight}
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
export default TaskCard;
