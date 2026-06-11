

'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreHorizontal, PlusCircle, Users, Loader2 } from 'lucide-react';
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
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc, addDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { adminCreateUserAction, adminUpdateUserPasswordAction, adminDeleteUserAction } from '@/app/actions';
import { useAuth } from '@/contexts/AuthContext';

const db = getFirestore(firebaseApp);

const departments = ['Accounting and Tax', 'Administration', 'CAP'] as const;
const roles = ['staff', 'admin'] as const;

const formSchema = z.object({
  uid: z.string().optional(),
  name: z.string().min(2, 'Name is required.'),
  email: z.string().email('A valid email is required.'),
  password: z.string().min(6, 'Password must be at least 6 characters.').optional(),
  department: z.enum(departments),
  role: z.enum(roles),
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
            role: staffMember?.role === 'admin' ? 'admin' : 'staff',
        },
    });

    const isEditing = !!staffMember;

    useEffect(() => {
        if(isEditing){
            form.reset({
                ...staffMember,
                role: staffMember?.role === 'admin' ? 'admin' : 'staff',
                password: ''
            } as any);
        } else {
            form.reset({
                uid: '',
                name: '',
                email: '',
                password: '',
                department: 'Administration',
                role: 'staff',
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
                 <FormField control={form.control} name="role" render={({ field }) => ( <FormItem><FormLabel>Role</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger></FormControl><SelectContent>{roles.map(role => <SelectItem key={role} value={role} className="capitalize">{role}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )}/>
                <div className="flex justify-end gap-2">
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

  const filteredStaff = staff.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          member.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = selectedDepartment === 'all' || member.department === selectedDepartment;
    const matchesRole = selectedRole === 'all' || member.role === selectedRole;
    return matchesSearch && matchesDepartment && matchesRole;
  });

  const fetchStaff = async () => {
    setIsLoading(true);
    try {
        const q = query(collection(db, "users"), where('role', 'in', ['staff', 'admin']));
        const querySnapshot = await getDocs(q);
        const fetchedStaff = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, uid: doc.id } as User));
        setStaff(fetchedStaff);
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
  
  const handleDelete = async (staffId: string) => {
    try {
        const deleteRes = await adminDeleteUserAction({ uid: staffId });
        if (!deleteRes.success) {
            toast({ title: 'Error', description: deleteRes.error || 'Could not delete staff member.', variant: 'destructive' });
            return;
        }
        fetchStaff();
        toast({
            title: 'Staff Member Deleted',
            description: 'The staff member has been removed from Firestore and Authentication.',
            variant: 'destructive',
        });
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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Manage Staff</h1>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
           <DialogTrigger asChild>
                <Button onClick={handleAdd}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Staff Member
                </Button>
           </DialogTrigger>
           <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{selectedStaff ? 'Edit Staff Member' : 'Create New Staff Member'}</DialogTitle>
                    <DialogDescription>
                        {selectedStaff ? 'Update the details of this staff member.' : 'Fill out the form to add a new staff member.'}
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
      <Card>
        <CardHeader>
          <CardTitle>All Staff Members</CardTitle>
          <CardDescription>View, edit, and delete staff accounts.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-md"
              />
            </div>
            <div className="w-full sm:w-[200px]">
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Department: All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-[150px]">
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Role: All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {roles.map((role) => (
                    <SelectItem key={role} value={role} className="capitalize">
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {isLoading ? (
             <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStaff.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No staff members found matching filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredStaff.map(staffMember => (
                  <TableRow key={staffMember.id}>
                    <TableCell className="font-medium">
                      {staffMember.name}
                    </TableCell>
                    <TableCell>{staffMember.email}</TableCell>
                    <TableCell>{staffMember.department}</TableCell>
                    <TableCell className="capitalize">
                      <span className="bg-secondary text-secondary-foreground px-2 py-1 text-xs rounded-full">
                          {staffMember.role}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                          <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                              </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleEdit(staffMember)}>
                                  Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                               <AlertDialogTrigger asChild>
                                  <DropdownMenuItem className="text-destructive" disabled={staffMember.role === 'admin'}>
                                      Delete
                                  </DropdownMenuItem>
                              </AlertDialogTrigger>
                          </DropdownMenuContent>
                          </DropdownMenu>
                           <AlertDialogContent>
                              <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the staff account for:
                                  <span className="font-semibold"> {staffMember.name}</span>. This removes them from Firestore and Authentication.
                                  </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(staffMember.id)}>
                                      Continue
                                  </AlertDialogAction>
                              </AlertDialogFooter>
                          </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
