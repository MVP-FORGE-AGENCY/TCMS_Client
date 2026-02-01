
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { employees } from '@/lib/api';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, Loader2, Mail, Key } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const auditorSchema = z.object({
  email: z.string().email('Invalid email address'),
  fullName: z.string().min(2, 'Name is required'),
  reason: z.string().min(5, 'Reason is required'),
  expiresAt: z.date().optional(),
  createWithPassword: z.boolean().default(false),
  password: z.string().optional(),
  isExternal: z.boolean().default(true),
}).refine(data => {
  if (data.createWithPassword && (!data.password || data.password.length < 6)) {
    return false;
  }
  return true;
}, {
  message: "Password is required and must be at least 6 characters",
  path: ["password"],
});

type AuditorFormValues = z.infer<typeof auditorSchema>;

interface AuditorInviteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuditorInviteModal({ open, onOpenChange }: AuditorInviteModalProps) {
  const queryClient = useQueryClient();
  const [dateOpen, setDateOpen] = useState(false);

  // Default to password mode as requested
  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<AuditorFormValues>({
    resolver: zodResolver(auditorSchema),
    defaultValues: {
      createWithPassword: true, // Default to password mode
      isExternal: true // Default to External
    }
  });

  const expiresAt = watch('expiresAt');
  const createWithPassword = watch('createWithPassword');

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: AuditorFormValues) => {
      // Use the API client instead of direct axios call
      return employees.inviteAuditor(data);
    },
    onSuccess: () => {
      toast.success('Auditor invited successfully');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to invite auditor');
    },
  });

  const onSubmit = (data: AuditorFormValues) => {
    mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Invite Auditor</DialogTitle>
          <DialogDescription>
            Create an auditor account or send an invitation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          {/* Classification Toggle */}
          <div className="space-y-3 pt-2">
            <Label>Auditor Classification</Label>
            <RadioGroup 
                defaultValue="external" 
                onValueChange={(val) => setValue('isExternal', val === 'external')}
                className="grid grid-cols-2 gap-4"
            >
              <div>
                <RadioGroupItem value="external" id="type-external" className="peer sr-only" />
                <Label
                  htmlFor="type-external"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <span className="font-semibold">External</span>
                  <span className="text-xs text-muted-foreground text-center mt-1">Third-party / CAA</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="internal" id="type-internal" className="peer sr-only" />
                <Label
                  htmlFor="type-internal"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <span className="font-semibold">Internal</span>
                  <span className="text-xs text-muted-foreground text-center mt-1">Company Employee</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Invitation Method Toggle */}
          <div className="space-y-3">
            <Label>Invitation Method</Label>
            <RadioGroup 
                defaultValue="password" 
                value={createWithPassword ? "password" : "email"}
                onValueChange={(val) => setValue('createWithPassword', val === 'password')}
                className="grid grid-cols-2 gap-4"
            >
              <div>
                <RadioGroupItem value="password" id="method-password" className="peer sr-only" />
                <Label
                  htmlFor="method-password"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <Key className="mb-2 h-6 w-6" />
                  Create Password
                </Label>
              </div>
              <div>
                <RadioGroupItem value="email" id="method-email" className="peer sr-only" />
                <Label
                  htmlFor="method-email"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <Mail className="mb-2 h-6 w-6" />
                  Send Invite Link
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" placeholder="John Doe" {...register('fullName')} />
                {errors.fullName && <p className="text-sm text-red-500">{errors.fullName.message}</p>}
            </div>
             <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" placeholder="auditor@authority.com" {...register('email')} />
                {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>
          </div>

          {createWithPassword && (
             <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="••••••••" {...register('password')} />
                <p className="text-xs text-muted-foreground">Admin-created password for immediate access.</p>
                {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
            </div>
          )}

          <div className="space-y-2">
            <Label>Expiration Date (Optional)</Label>
            <Popover open={dateOpen} onOpenChange={setDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !expiresAt && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {expiresAt ? format(expiresAt, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={expiresAt}
                  onSelect={(date) => {
                    setValue('expiresAt', date);
                    setDateOpen(false);
                  }}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason / Audit Scope</Label>
            <Textarea 
              id="reason" 
              placeholder="e.g. Annual EASA Compliance Audit 2026" 
              {...register('reason')} 
            />
            {errors.reason && <p className="text-sm text-red-500">{errors.reason.message}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {createWithPassword ? 'Create & Invite' : 'Send Invitation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
