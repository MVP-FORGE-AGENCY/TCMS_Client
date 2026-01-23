import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { v4 as uuidv4 } from 'uuid';

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { 
    Plus, 
    Trash2, 
    Edit2, 
    Save,
    ChevronUp,
    ChevronDown,
    AlertCircle
} from 'lucide-react';

interface CheckItem {
    id: string;
    text: string;
    category: 'Theory' | 'Practical' | 'General';
    type: 'pass_fail' | 'score';
    is_mandatory: boolean;
}

interface CheckDefinition {
    items: CheckItem[];
    requiredAssessors: number;
    intervalMonths: number;
}

interface CheckConfigurationEditorProps {
    standardId: string;
    onSave?: () => void;
}

export default function CheckConfigurationEditor({ standardId, onSave }: CheckConfigurationEditorProps) {
    const queryClient = useQueryClient();
    const [items, setItems] = useState<CheckItem[]>([]);
    const [requiredAssessors, setRequiredAssessors] = useState(1);
    const [intervalMonths, setIntervalMonths] = useState(24);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<CheckItem | null>(null);
    const [hasChanges, setHasChanges] = useState(false);

    // Fetch existing check definition
    const { data, isLoading } = useQuery({
        queryKey: ['standard-check-definition', standardId],
        queryFn: async () => {
            const response = await api.get(`/standards/${standardId}/check-definition`);
            return response.data as CheckDefinition & { standardCode: string; standardName: string };
        },
        enabled: !!standardId,
    });

    // Update local state when data loads
    useEffect(() => {
        if (data) {
            setItems(data.items || []);
            setRequiredAssessors(data.requiredAssessors || 1);
            setIntervalMonths(data.intervalMonths || 24);
            setHasChanges(false);
        }
    }, [data]);

    // Save mutation
    const saveMutation = useMutation({
        mutationFn: async () => {
            await api.patch(`/standards/${standardId}/check-definition`, {
                items,
                requiredAssessors,
                intervalMonths
            });
        },
        onSuccess: () => {
            toast.success('Check configuration saved');
            queryClient.invalidateQueries({ queryKey: ['standard-check-definition', standardId] });
            setHasChanges(false);
            onSave?.();
        },
        onError: () => {
            toast.error('Failed to save check configuration');
        }
    });

    const handleAddItem = (item: Omit<CheckItem, 'id'>) => {
        const newItem: CheckItem = { ...item, id: uuidv4() };
        setItems(prev => [...prev, newItem]);
        setHasChanges(true);
        setIsAddModalOpen(false);
    };

    const handleUpdateItem = (item: CheckItem) => {
        setItems(prev => prev.map(i => i.id === item.id ? item : i));
        setHasChanges(true);
        setEditingItem(null);
    };

    const handleDeleteItem = (id: string) => {
        setItems(prev => prev.filter(i => i.id !== id));
        setHasChanges(true);
    };

    const handleMoveItem = (index: number, direction: 'up' | 'down') => {
        const newItems = [...items];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= items.length) return;
        [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
        setItems(newItems);
        setHasChanges(true);
    };

    if (isLoading) {
        return <div className="p-4 text-center text-muted-foreground">Loading...</div>;
    }

    const mandatoryCount = items.filter(i => i.is_mandatory).length;

    return (
        <div className="space-y-6">
            {/* Settings Row */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Check Settings</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="requiredAssessors">Required Assessors</Label>
                            <Input
                                id="requiredAssessors"
                                type="number"
                                min={1}
                                max={5}
                                value={requiredAssessors}
                                onChange={(e) => {
                                    setRequiredAssessors(parseInt(e.target.value) || 1);
                                    setHasChanges(true);
                                }}
                            />
                            <p className="text-xs text-muted-foreground">
                                Number of assessors required to complete the check
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="intervalMonths">Validity Period (Months)</Label>
                            <Input
                                id="intervalMonths"
                                type="number"
                                min={1}
                                max={60}
                                value={intervalMonths}
                                onChange={(e) => {
                                    setIntervalMonths(parseInt(e.target.value) || 24);
                                    setHasChanges(true);
                                }}
                            />
                            <p className="text-xs text-muted-foreground">
                                How long a passed check remains valid
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Items List */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-base">Check Items</CardTitle>
                            <CardDescription>
                                {items.length} items ({mandatoryCount} mandatory)
                            </CardDescription>
                        </div>
                        <Button size="sm" onClick={() => setIsAddModalOpen(true)}>
                            <Plus className="w-4 h-4 mr-1" /> Add Item
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {items.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>No check items defined</p>
                            <p className="text-sm">Add items to define what assessors will evaluate</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {items.map((item, index) => (
                                <div key={item.id} className="flex items-center gap-2 p-3 border rounded-lg bg-card hover:bg-muted/20 transition-colors">
                                    {/* Reorder Buttons */}
                                    <div className="flex flex-col">
                                        <button 
                                            className="p-1 hover:bg-muted rounded disabled:opacity-30"
                                            onClick={() => handleMoveItem(index, 'up')}
                                            disabled={index === 0}
                                        >
                                            <ChevronUp className="w-3 h-3" />
                                        </button>
                                        <button 
                                            className="p-1 hover:bg-muted rounded disabled:opacity-30"
                                            onClick={() => handleMoveItem(index, 'down')}
                                            disabled={index === items.length - 1}
                                        >
                                            <ChevronDown className="w-3 h-3" />
                                        </button>
                                    </div>

                                    {/* Item Content */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">{item.text}</span>
                                            {item.is_mandatory && (
                                                <Badge variant="destructive" className="text-xs">Required</Badge>
                                            )}
                                        </div>
                                        <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                                            <Badge variant="outline">{item.category}</Badge>
                                            <Badge variant="outline">{item.type === 'pass_fail' ? 'Pass/Fail' : 'Scored'}</Badge>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-1">
                                        <Button 
                                            size="icon" 
                                            variant="ghost" 
                                            className="h-8 w-8"
                                            onClick={() => setEditingItem(item)}
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                        <Button 
                                            size="icon" 
                                            variant="ghost" 
                                            className="h-8 w-8 text-destructive hover:text-destructive"
                                            onClick={() => handleDeleteItem(item.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Save Button */}
            {hasChanges && (
                <div className="flex justify-end">
                    <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                        <Save className="w-4 h-4 mr-1" />
                        {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            )}

            {/* Add/Edit Item Modal */}
            <ItemFormModal
                isOpen={isAddModalOpen || !!editingItem}
                onClose={() => {
                    setIsAddModalOpen(false);
                    setEditingItem(null);
                }}
                onSubmit={handleAddItem}
                onUpdate={handleUpdateItem}
                initialData={editingItem}
            />
        </div>
    );
}

// Item Form Modal Component
interface ItemFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (item: Omit<CheckItem, 'id'>) => void;
    onUpdate?: (item: CheckItem) => void;
    initialData?: CheckItem | null;
}

function ItemFormModal({ isOpen, onClose, onSubmit, onUpdate, initialData }: ItemFormModalProps) {
    const [text, setText] = useState('');
    const [category, setCategory] = useState<'Theory' | 'Practical' | 'General'>('General');
    const [type, setType] = useState<'pass_fail' | 'score'>('pass_fail');
    const [isMandatory, setIsMandatory] = useState(true);

    useEffect(() => {
        if (initialData) {
            setText(initialData.text);
            setCategory(initialData.category);
            setType(initialData.type);
            setIsMandatory(initialData.is_mandatory);
        } else {
            setText('');
            setCategory('General');
            setType('pass_fail');
            setIsMandatory(true);
        }
    }, [initialData, isOpen]);

    const handleSubmit = () => {
        if (!text.trim()) {
            toast.error('Item text is required');
            return;
        }

        if (initialData && onUpdate) {
            onUpdate({ ...initialData, text, category, type, is_mandatory: isMandatory });
        } else {
            onSubmit({ text, category, type, is_mandatory: isMandatory });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{initialData ? 'Edit Item' : 'Add Check Item'}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="itemText">Item Text</Label>
                        <Input
                            id="itemText"
                            placeholder="e.g., Device Setup Procedure"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Category</Label>
                            <Select value={category} onValueChange={(v) => setCategory(v as typeof category)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Theory">Theory</SelectItem>
                                    <SelectItem value="Practical">Practical</SelectItem>
                                    <SelectItem value="General">General</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Evaluation Type</Label>
                            <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pass_fail">Pass / Fail</SelectItem>
                                    <SelectItem value="score">Scored (0-100)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex items-center justify-between border rounded-lg p-3">
                        <div>
                            <Label htmlFor="mandatory">Mandatory Item</Label>
                            <p className="text-xs text-muted-foreground">
                                Required for "Full Renewal" checks
                            </p>
                        </div>
                        <Switch
                            id="mandatory"
                            checked={isMandatory}
                            onCheckedChange={setIsMandatory}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit}>
                        {initialData ? 'Update' : 'Add Item'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
