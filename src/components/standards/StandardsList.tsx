
import { useState, useEffect } from 'react'
import { Plus, Search, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from '@/components/ui/badge'
import { StandardCreationDialog } from './StandardCreationDialog'
import { standards as standardsApi } from '@/lib/api'

export function StandardsList() {
    const { t } = useTranslation()
    const [standards, setStandards] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [creationOpen, setCreationOpen] = useState(false)
    const [deleteId, setDeleteId] = useState<string | null>(null)

    useEffect(() => {
        loadStandards()
    }, [])

    const loadStandards = async () => {
        try {
            setLoading(true)
            const data = await standardsApi.list()
            setStandards(data || [])
        } catch (error) {
            console.error('Failed to load standards:', error)
            toast.error(t('errors.loadError', 'Failed to load standards'))
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!deleteId) return

        try {
            await standardsApi.delete(deleteId)
            toast.success(t('standards.deleted', 'Standard deleted'))
            setStandards(standards.filter(s => s.id !== deleteId))
        } catch (error) {
            console.error('Failed to delete standard:', error)
            toast.error(t('errors.deleteError', 'Failed to delete standard'))
        } finally {
            setDeleteId(null)
        }
    }

    const filteredStandards = standards.filter(s => 
        s.code.toLowerCase().includes(search.toLowerCase()) ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.description && s.description.toLowerCase().includes(search.toLowerCase()))
    )

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex-1 max-w-sm relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder={t('standards.search', 'Search standards...')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Button onClick={() => setCreationOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t('standards.create', 'Add Standard')}
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[150px]">{t('common.code', 'Code')}</TableHead>
                            <TableHead>{t('common.name', 'Name')}</TableHead>
                            <TableHead className="hidden md:table-cell">{t('common.description', 'Description')}</TableHead>
                            <TableHead className="w-[100px] text-right">{t('common.actions', 'Actions')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    {t('common.loading', 'Loading...')}
                                </TableCell>
                            </TableRow>
                        ) : filteredStandards.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                    {t('standards.noStandards', 'No standards found')}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredStandards.map((std) => (
                                <TableRow key={std.id}>
                                    <TableCell className="font-mono font-medium">
                                        <Badge variant="outline">{std.code}</Badge>
                                    </TableCell>
                                    <TableCell>{std.name}</TableCell>
                                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                                        {std.description || '-'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-destructive hover:text-destructive"
                                            onClick={() => setDeleteId(std.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <StandardCreationDialog
                isOpen={creationOpen}
                onClose={() => setCreationOpen(false)}
                onSuccess={(newStd) => {
                    setStandards([...standards, newStd])
                    setCreationOpen(false)
                }}
            />

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('common.areYouSure', 'Are you sure?')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('standards.deleteConfirm', 'This action cannot be undone. This will permanently delete the training standard.')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                            {t('common.delete', 'Delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
