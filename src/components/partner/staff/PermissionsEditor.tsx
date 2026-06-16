import React from 'react';
import { StaffPermissions } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Lock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type PermissionsEditorProps = {
  permissions: StaffPermissions;
  onChange: (permissions: StaffPermissions) => void;
  disabled?: boolean;
};

type ModuleKey = keyof StaffPermissions;

interface ModuleRow {
  key: ModuleKey;
  label: string;
  description: string;
  hasFullAccess: boolean; // false for financials
}

const MODULES: ModuleRow[] = [
  { key: 'orders', label: 'Orders', description: 'View and manage outsourcing orders', hasFullAccess: true },
  { key: 'clients', label: 'Clients', description: 'Access practice clients list and details', hasFullAccess: true },
  { key: 'tasks', label: 'Tasks', description: 'Create and assign workflow tasks', hasFullAccess: true },
  { key: 'services', label: 'Services & Pricing', description: 'Modify wholesale services and pricing markup', hasFullAccess: true },
  { key: 'financials', label: 'Billing & Financials', description: 'View payment history and financial statements', hasFullAccess: false },
];

export function PermissionsEditor({ permissions, onChange, disabled = false }: PermissionsEditorProps) {
  const handlePermissionChange = (module: ModuleKey, value: any) => {
    const updated = { ...permissions, [module]: value };
    onChange(updated);
  };

  return (
    <TooltipProvider>
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Module</TableHead>
              <TableHead className="text-center">No Access</TableHead>
              <TableHead className="text-center">View Only</TableHead>
              <TableHead className="text-center">Full Access</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MODULES.map((mod) => {
              const currentValue = permissions[mod.key];
              return (
                <TableRow key={mod.key}>
                  <TableCell>
                    <div>
                      <div className="font-semibold text-sm text-foreground">{mod.label}</div>
                      <div className="text-xs text-muted-foreground">{mod.description}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <input
                        type="radio"
                        name={`${mod.key}-permission`}
                        checked={currentValue === 'none'}
                        onChange={() => handlePermissionChange(mod.key, 'none')}
                        disabled={disabled}
                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <input
                        type="radio"
                        name={`${mod.key}-permission`}
                        checked={currentValue === 'view'}
                        onChange={() => handlePermissionChange(mod.key, 'view')}
                        disabled={disabled}
                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      {mod.hasFullAccess ? (
                        <input
                          type="radio"
                          name={`${mod.key}-permission`}
                          checked={currentValue === 'full'}
                          onChange={() => handlePermissionChange(mod.key, 'full')}
                          disabled={disabled}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                        />
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center justify-center text-muted-foreground opacity-50 cursor-not-allowed">
                              <Lock className="h-4 w-4" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Staff can never have full access to Billing & Financials (initiating payments is restricted to owners).</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
}

export default PermissionsEditor;
