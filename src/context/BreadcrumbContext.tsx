import { createContext, useContext, useState, type ReactNode } from 'react';

interface BreadcrumbContextType {
    labels: Record<string, string>;
    setLabel: (pathSegment: string, label: string) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(undefined);

export const BreadcrumbProvider = ({ children }: { children: ReactNode }) => {
    const [labels, setLabels] = useState<Record<string, string>>({});

    const setLabel = (pathSegment: string, label: string) => {
        setLabels(prev => {
            if (prev[pathSegment] === label) return prev; // Avoid rerenders
            return { ...prev, [pathSegment]: label };
        });
    };

    return (
        <BreadcrumbContext.Provider value={{ labels, setLabel }}>
            {children}
        </BreadcrumbContext.Provider>
    );
};

export const useBreadcrumb = () => {
    const context = useContext(BreadcrumbContext);
    if (!context) {
        throw new Error('useBreadcrumb must be used within a BreadcrumbProvider');
    }
    return context;
};
