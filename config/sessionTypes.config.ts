import { CodeIcon, BookOpenIcon, TargetIcon, DumbbellIcon, LucideProps } from 'lucide-react';
import { ForwardRefExoticComponent, RefAttributes } from 'react';

// --- NEW: Define a type for the keys of ICON_MAP ---
// This creates a new type called 'IconKey' that can only be one of the following strings:
// 'code', 'book-open', 'target', or 'dumbbell'.
export type IconKey = 'code' | 'book-open' | 'target' | 'dumbbell';

// Type definition for the IconComponent to ensure consistency
type IconComponent = ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>;

// Default list for new users
export const DEFAULT_SESSION_TYPES = [
    { id: 'coding', label: 'Coding', icon: 'code' as IconKey, color: '#8A2BE2' },
    { id: 'learning', label: 'Learning', icon: 'book-open' as IconKey, color: '#4a6bdf' },
    { id: 'practice', label: 'Practice', icon: 'target' as IconKey, color: '#4ade80' },
    { id: 'exercise', label: 'Exercise', icon: 'dumbbell' as IconKey, color: '#f59e0b' },
    { id: 'planning', label: 'Planning', icon: 'target' as IconKey, color: '#8A2BE2' },
    { id: 'debugging', label: 'Debug', icon: 'code' as IconKey, color: '#8A2BE2' },
];

// Maps icon names to React components for rendering
export const ICON_MAP: Record<IconKey, IconComponent> = {
    'code': CodeIcon,
    'book-open': BookOpenIcon,
    'target': TargetIcon,
    'dumbbell': DumbbellIcon,
};
