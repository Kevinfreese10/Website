'use client';
import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreHorizontal, PlusCircle, Users, Loader2, ShieldCheck, UserX, Briefcase, Search, SlidersHorizontal, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { User } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getFirestore, collection, getDocs, doc, setDoc, query, where } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { adminCreateUserAction, adminUpdateUserPasswordAction, adminDeleteUserAction, adminToggleUserActiveAction } from '@/app/actions';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';

const db = getFirestore(firebaseApp);

const departments = ['Accounting and Tax', 'Administration', 'CAP'] as const;
const roles = ['admin', 'staff', 'cap_staff', 'cap_supervisor'] as const;

export const AVAILABLE_MODULES = [
  { id: 'Manage Orders', label: 'Manage Orders' },
  { id: 'AI Accountant', label: 'AI Accountant' },
  { id: 'AI Payroll', label: 'AI Payroll' },
  { id: 'Admin Tools', label: 'Admin Tools' },
  { id: 'Pages', label: 'Pages' },
  { id: 'Demo Leads', label: 'Demo Leads' },
  { id: 'Manage Partners', label: 'Manage Partners' },
  { id: 'Manage Clients', label: 'Manage Clients' },
  { id: 'Manage Products', label: 'Manage Products' },
  { id: 'Social Marketing', label: 'Social Marketing' },
  { id: 'Community', label: 'Community' },
  { id: 'Email Inbox', label: 'Email Inbox' },
  { id: 'Manage Tasks', label: 'Manage Tasks' },
  { id: 'Task Templates', label: 'Task Templates' },
  { id: 'Manage Categories', label: 'Manage Categories' },
  { id: 'Manage Blog', label: 'Manage Blog' },
  { id: 'Manage Staff', label: 'Manage Staff' },
  { id: 'Manage Users', label: 'Manage Users' },
  { id: 'Manage Discounts', label: 'Manage Discounts' },
  { id: 'Knowledge Base', label: 'Knowledge Base' },
  { id: 'Chatbot History', label: 'Chatbot History' },
  { id: 'Media', label: 'Media' },
];

const formSchema = z.object({
  uid: z.string().optional(),
  name: z.string().min(2, 'Name is required.'),
  email: z.string().email('A valid email is required.'),
  password: z.string().optional().refine(val => !val || val.length >= 6, { message: 'Password must be at least 6 characters.' }),
  department: z.enum(departments),
  role: z.enum(roles),
  isActive: z.boolean().default(true),
  allowedModules: z.array(z.string()).optional(),
});

function StaffForm({ staffMember, onSubmit, onCancel }: { staffMember: User | null, onSubmit: (data: any) => void, onCancel: () => void }) {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            uid: staffMember?.uid || '',
            name: staffMember?.name || '',
            email: staffMember?.email || '',
            password: '',
            department: (staffMember?.department as any) || 'Administration',
            role: (staffMember?.role as any) || 'staff',
            isActive: staffMember?.isActive !== false, // Default to true unless explicitly false
            allowedModules: staffMember?.allowedModules || [],
        },
    });

    const isEditing = !!staffMember;

    useEffect(() => {
        if(isEditing){
            form.reset({
                ...staffMember,
                role: (staffMember?.role as any) || 'staff',
                password: '',
                isActive: staffMember?.isActive !== false,
                allowedModules: staffMember?.allowedModules || [],
            } as any);
        } else {
            form.reset({
                uid: '',
                name: '',
                email: '',
                password: '',
                department: 'Administration',
                role: 'staff',
                isActive: true,
                allowedModules: [],
            });
        }
    }, [staffMember, isEditing, form]);

    const handleSubmit = (values: z.infer<typeof formSchema>) => {
        if (!isEditing && !values.password) {
            form.setError('password', { message: 'Password is required for new staff members.' });
            return;
        }
        onSubmit(values);
    };
    
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
                <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormLabel>Email Address</FormLabel><FormControl><Input {...field} disabled={isEditing} /></FormControl><FormMessage /></FormItem> )}/>
                 <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{isEditing ? 'New Password (Optional)' : 'Password'}</FormLabel>
                            <FormControl><Input type="password" {...field} /></FormControl>
                             <FormDescription>{isEditing ? 'Leave blank to keep the current password.' : 'The user can change this later.'}</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField control={form.control} name="department" render={({ field }) => ( <FormItem><FormLabel>Department</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a department" /></SelectTrigger></FormControl><SelectContent>{departments.map(dep => <SelectItem key={dep} value={dep}>{dep}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )}/>
                 <FormField control={form.control} name="role" render={({ field }) => ( <FormItem><FormLabel>Role</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger></FormControl><SelectContent>{roles.map(role => <SelectItem key={role} value={role} className="capitalize">{role.replace('_', ' ')}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )}/>
                 
                 {form.watch('role') !== 'admin' && (
                     <FormField
                        control={form.control}
                        name="allowedModules"
                        render={() => (
                            <FormItem>
                                <div className="mb-4">
                                    <FormLabel className="text-base">Allowed Modules</FormLabel>
                                    <FormDescription>
                                        Select the modules this staff member is allowed to access. Dashboards are available by default.
                                    </FormDescription>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {AVAILABLE_MODULES.map((module) => (
                                        <FormField
                                            key={module.id}
                                            control={form.control}
                                            name="allowedModules"
                                            render={({ field }) => {
                                                return (
                                                    <FormItem
                                                        key={module.id}
                                                        className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3"
                                                    >
                                                        <FormControl>
                                                            <Checkbox
                                                                checked={field.value?.includes(module.id)}
                                                                onCheckedChange={(checked) => {
                                                                    return checked
                                                                        ? field.onChange([...(field.value || []), module.id])
                                                                        : field.onChange(
                                                                            field.value?.filter(
                                                                                (value) => value !== module.id
                                                                            )
                                                                        )
                                                                }}
                                                            />
                                                        </FormControl>
                                                        <FormLabel className="text-sm font-normal cursor-pointer w-full">
                                                            {module.label}
                                                        </FormLabel>
                                                    </FormItem>
                                                )
                                            }}
                                        />
                                    ))}
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                 )}
                 
                 {isEditing && (
                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Active Account</FormLabel>
                            <FormDescription>
                              Deactivating a user prevents them from logging in but preserves their data.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                 )}

                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
                    <Button type="submit">Save Staff Member</Button>
                </div>
            </form>
        </Form>
    )
}

export default function AdminStaffPage() {
  const [staff, setStaff] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<User | null>(null);
  const { toast } = useToast();
  const { user: adminUser } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedRole, setSelectedRole] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchStaff = async () => {
    setIsLoading(true);
    try {
        const q = query(collection(db, "users"), where('role', 'in', roles));
        const querySnapshot = await getDocs(q);
        const fetchedStaff = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, uid: doc.id } as User));
        setStaff(fetchedStaff.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
        console.error("Error fetching staff:", error);
        toast({ title: 'Error', description: 'Could not fetch staff from the database.', variant: 'destructive'});
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleAdd = () => {
    setSelectedStaff(null);
    setIsFormOpen(true);
  };

  const handleEdit = (staffMember: User) => {
    setSelectedStaff(staffMember);
    setIsFormOpen(true);
  };

  const handleToggleActive = async (staffMember: User) => {
    try {
        const newStatus = staffMember.isActive === false ? true : false;
        const res = await adminToggleUserActiveAction({ uid: staffMember.id, isActive: newStatus });
        
        if (!res.success) {
            toast({ title: 'Error', description: res.error || 'Could not change account status.', variant: 'destructive' });
            return;
        }
        
        toast({
            title: newStatus ? 'Account Reactivated' : 'Account Deactivated',
            description: `${staffMember.name}'s account has been ${newStatus ? 'reactivated' : 'deactivated'}.`,
        });
        
        // Optimistic update
        setStaff(prev => prev.map(s => s.id === staffMember.id ? { ...s, isActive: newStatus } : s));
    } catch (error) {
        toast({ title: 'Error', description: 'Could not change account status.', variant: 'destructive' });
    }
  };
  
  const handleDelete = async (staffId: string) => {
    try {
        const deleteRes = await adminDeleteUserAction({ uid: staffId });
        if (!deleteRes.success) {
            toast({ title: 'Error', description: deleteRes.error || 'Could not delete staff member.', variant: 'destructive' });
            return;
        }
        
        toast({
            title: 'Staff Member Deleted',
            description: 'The staff member has been permanently removed.',
            variant: 'destructive',
        });
        
        setStaff(prev => prev.filter(s => s.id !== staffId));
    } catch (error) {
        console.error("Error deleting staff member:", error);
        toast({ title: 'Error', description: 'Could not delete staff member.', variant: 'destructive' });
    }
  };

  const handleFormSubmit = async (data: z.infer<typeof formSchema>) => {
    const { uid, password, ...staffData } = data;
    
    try {
        if (uid) { // Editing existing user
             const docRef = doc(db, "users", uid);
             await setDoc(docRef, staffData, { merge: true });
             
             if (password) {
                  const pwdRes = await adminUpdateUserPasswordAction({ uid, password });
                  if (!pwdRes.success) {
                      toast({ title: 'Error Updating Password', description: pwdRes.message || 'Could not update password.', variant: 'destructive'});
                      return;
                  }
             }
             toast({ title: 'Staff Member Updated', description: 'The staff details have been saved.' });
        } else { // Creating new user
            if (!adminUser) {
                toast({ title: 'Error', description: 'Admin user not found.', variant: 'destructive'});
                return;
            }
             if (!password) {
                  toast({ title: 'Error', description: 'Password is required for new users.', variant: 'destructive'});
                  return;
             }
            
            const createRes = await adminCreateUserAction({
                email: staffData.email,
                password: password,
                name: staffData.name,
                role: staffData.role,
                department: staffData.department,
                source: 'Admin Portal (Staff Manager)',
            });

            if (!createRes.success) {
                let description = createRes.message || 'Could not save the staff member. Please try again.';
                if (createRes.error === 'auth/email-already-in-use') {
                    description = 'A user with this email address already exists in Firebase Authentication.';
                }
                toast({ title: 'Error', description, variant: 'destructive'});
                return;
            }

            // Also set the isActive flag for the newly created user doc
            if (createRes.uid) {
                await setDoc(doc(db, "users", createRes.uid), { isActive: true }, { merge: true });
            }

            toast({ title: 'Staff Member Created', description: 'The new staff member has been added.' });
        }
        fetchStaff();
        setIsFormOpen(false);
        setSelectedStaff(null);
    } catch (error: any) {
        console.error("Error saving staff member:", error);
        toast({ title: 'Error', description: 'Could not save the staff member. Please try again.', variant: 'destructive'});
    }
  };

  // Metrics calculations
  const metrics = useMemo(() => {
      const active = staff.filter(s => s.isActive !== false);
      const deactivated = staff.filter(s => s.isActive === false);
      const admins = staff.filter(s => s.role === 'admin' && s.isActive !== false);
      
      return {
          total: staff.length,
          active: active.length,
          deactivated: deactivated.length,
          admins: admins.length
      };
  }, [staff]);

  const filteredStaff = useMemo(() => staff.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          member.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = selectedDepartment === 'all' || member.department === selectedDepartment;
    const matchesRole = selectedRole === 'all' || member.role === selectedRole;
    
    let matchesStatus = true;
    if (statusFilter === 'active') matchesStatus = member.isActive !== false;
    if (statusFilter === 'inactive') matchesStatus = member.isActive === false;

    return matchesSearch && matchesDepartment && matchesRole && matchesStatus;
  }), [staff, searchQuery, selectedDepartment, selectedRole, statusFilter]);

  if (!adminUser) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (adminUser.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <h2 className="text-2xl font-bold text-destructive text-center">Access Denied</h2>
        <p className="text-muted-foreground text-center max-w-md">
          You do not have permission to access this page. This page is restricted to administrators only.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Manage Staff</h1>
            <p className="text-slate-500 mt-1">Control access, roles, and organizational structure.</p>
        </div>
        
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
           <DialogTrigger asChild>
                <Button onClick={handleAdd} className="font-bold shadow-md">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Staff Member
                </Button>
           </DialogTrigger>
           <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{selectedStaff ? 'Edit Staff Member' : 'Create New Staff Member'}</DialogTitle>
                    <DialogDescription>
                        {selectedStaff ? 'Update the details and permissions of this staff member.' : 'Fill out the form to provision a new staff account.'}
                    </DialogDescription>
                </DialogHeader>
                <StaffForm 
                    staffMember={selectedStaff} 
                    onSubmit={handleFormSubmit}
                    onCancel={() => setIsFormOpen(false)}
                />
           </DialogContent>
        </Dialog>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm">
            <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Staff</p>
                    <Users className="h-5 w-5 text-blue-500" />
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                    <h2 className="text-3xl font-black text-slate-800">{metrics.total}</h2>
                </div>
            </CardContent>
        </Card>
        
        <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm">
            <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Active</p>
                    <Briefcase className="h-5 w-5 text-emerald-500" />
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                    <h2 className="text-3xl font-black text-slate-800">{metrics.active}</h2>
                </div>
            </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm">
            <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Admins</p>
                    <ShieldCheck className="h-5 w-5 text-indigo-500" />
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                    <h2 className="text-3xl font-black text-slate-800">{metrics.admins}</h2>
                </div>
            </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm">
            <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Deactivated</p>
                    <UserX className="h-5 w-5 text-rose-500" />
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                    <h2 className="text-3xl font-black text-slate-800">{metrics.deactivated}</h2>
                </div>
            </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden">
        
        <div className="p-6 border-b bg-slate-50/50 flex flex-col lg:flex-row justify-between lg:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
            <Input 
              placeholder="Search by name or email..." 
              className="pl-10 h-10 w-full bg-white border-slate-200 focus:ring-2 focus:ring-primary/25 rounded-lg text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Filters:</span>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px] h-9 text-xs font-semibold bg-white border-slate-200">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Deactivated</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-[170px] h-9 text-xs font-semibold bg-white border-slate-200">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-[150px] h-9 text-xs font-semibold bg-white border-slate-200">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role} value={role} className="capitalize">{role.replace('_', ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(searchQuery || selectedDepartment !== 'all' || selectedRole !== 'all' || statusFilter !== 'all') && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-9 text-xs font-bold text-slate-500"
                onClick={() => { setSearchQuery(''); setSelectedDepartment('all'); setSelectedRole('all'); setStatusFilter('all'); }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
             <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
          <Table>
            <TableHeader className="bg-slate-50/20">
              <TableRow className="border-b">
                <TableHead className="font-bold text-slate-500 py-4 pl-6">Staff Member</TableHead>
                <TableHead className="font-bold text-slate-500 py-4">Department</TableHead>
                <TableHead className="font-bold text-slate-500 py-4">Role</TableHead>
                <TableHead className="font-bold text-slate-500 py-4">Status</TableHead>
                <TableHead className="text-right font-bold text-slate-500 py-4 pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStaff.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-16 text-slate-400 font-medium">
                    <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-slate-200" />
                    No staff members found matching the current filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredStaff.map(staffMember => {
                  const initials = staffMember.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                  const isActive = staffMember.isActive !== false;
                  
                  return (
                  <TableRow key={staffMember.id} className={`hover:bg-slate-50/40 transition-colors border-b ${!isActive ? 'opacity-75 bg-slate-50/50' : ''}`}>
                    <TableCell className="pl-6 py-4">
                        <div className="flex items-center gap-3">
                            <Avatar className={`h-9 w-9 border-2 ${isActive ? 'border-primary/10' : 'border-slate-200 opacity-50'}`}>
                                <AvatarFallback className={`${isActive ? 'bg-primary/5 text-primary' : 'bg-slate-100 text-slate-400'} font-bold text-xs`}>
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <span className="font-bold text-sm text-slate-900">{staffMember.name}</span>
                                <span className="text-xs text-slate-500 font-medium">{staffMember.email}</span>
                            </div>
                        </div>
                    </TableCell>
                    <TableCell className="py-4">
                        <span className="text-sm font-semibold text-slate-700">{staffMember.department}</span>
                    </TableCell>
                    <TableCell className="py-4">
                        <Badge variant="outline" className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 ${
                            staffMember.role === 'admin' ? 'bg-indigo-50/80 text-indigo-700 border-indigo-200/50' :
                            staffMember.role === 'cap_supervisor' ? 'bg-amber-50/80 text-amber-700 border-amber-200/50' :
                            staffMember.role === 'cap_staff' ? 'bg-blue-50/80 text-blue-700 border-blue-200/50' :
                            'bg-slate-50/80 text-slate-700 border-slate-200/50'
                        }`}>
                            {staffMember.role.replace('_', ' ')}
                        </Badge>
                    </TableCell>
                    <TableCell className="py-4">
                        <Badge 
                            variant="secondary" 
                            className={`text-[10px] font-bold px-2 py-0.5 ${isActive ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100' : 'bg-rose-100 text-rose-800 hover:bg-rose-100'}`}
                        >
                            {isActive ? 'Active' : 'Deactivated'}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6 py-4">
                      <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-100">
                                  <MoreHorizontal className="h-4 w-4 text-slate-500" />
                              </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 font-medium">
                              <DropdownMenuLabel className="text-xs font-bold text-slate-500 uppercase tracking-wider">Manage</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleEdit(staffMember)} className="cursor-pointer">
                                  Edit Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleActive(staffMember)} className="cursor-pointer">
                                  {isActive ? 'Deactivate Account' : 'Reactivate Account'}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                               <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                      <DropdownMenuItem className="text-rose-600 focus:text-rose-600 focus:bg-rose-50 cursor-pointer" onSelect={(e) => e.preventDefault()}>
                                          Permanently Delete
                                      </DropdownMenuItem>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                      <AlertDialogHeader>
                                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                          This will permanently delete <span className="font-bold text-slate-900">{staffMember.name}</span>. This removes them from Firestore and Authentication entirely.
                                          <br/><br/>
                                          <strong>Tip:</strong> If you just want to revoke access, consider Deactivating them instead to preserve historical records.
                                          </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => handleDelete(staffMember.id)} className="bg-rose-600 hover:bg-rose-700">
                                              Delete Permanently
                                          </AlertDialogAction>
                                      </AlertDialogFooter>
                                  </AlertDialogContent>
                               </AlertDialog>
                          </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          )}
        </div>
      </Card>
    </div>
  );
}
