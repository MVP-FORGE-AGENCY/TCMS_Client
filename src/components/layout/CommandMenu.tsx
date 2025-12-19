import * as React from "react"
import {
    Calculator,
    Calendar,
    CreditCard,
    Settings,
    Smile,
    User,
} from "lucide-react"

import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from "@/components/ui/command"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"

export function CommandMenu() {
    const [open, setOpen] = React.useState(false)
    const navigate = useNavigate()
    const { t } = useTranslation()

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen((open) => !open)
            }
        }

        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [])

    const runCommand = React.useCallback((command: () => unknown) => {
        setOpen(false)
        command()
    }, [])

    return (
        <>
            <p className="text-sm text-muted-foreground hidden lg:block">
                {t("command.press")}{" "}
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </p>
            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput placeholder={t("command.typeCommand")} />
                <CommandList>
                    <CommandEmpty>{t("command.noResults")}</CommandEmpty>
                    <CommandGroup heading={t("command.suggestions")}>
                        <CommandItem onSelect={() => runCommand(() => navigate("/dashboard"))}>
                            <Calendar className="mr-2 h-4 w-4" />
                            <span>{t("nav.dashboard")}</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => navigate("/sessions"))}>
                            <Smile className="mr-2 h-4 w-4" />
                            <span>{t("nav.sessions")}</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => navigate("/checks"))}>
                            <Calculator className="mr-2 h-4 w-4" />
                            <span>{t("nav.checks")}</span>
                        </CommandItem>
                    </CommandGroup>
                    <CommandSeparator />
                    <CommandGroup heading={t("nav.settings")}>
                        <CommandItem onSelect={() => runCommand(() => navigate("/programmes"))}>
                            <User className="mr-2 h-4 w-4" />
                            <span>{t("nav.programmes")}</span>
                            <CommandShortcut>⌘P</CommandShortcut>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => navigate("/reports"))}>
                            <CreditCard className="mr-2 h-4 w-4" />
                            <span>{t("nav.reports")}</span>
                            <CommandShortcut>⌘B</CommandShortcut>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => navigate("/settings"))}>
                            <Settings className="mr-2 h-4 w-4" />
                            <span>{t("nav.settings")}</span>
                            <CommandShortcut>⌘S</CommandShortcut>
                        </CommandItem>
                    </CommandGroup>
                </CommandList>
            </CommandDialog>
        </>
    )
}
