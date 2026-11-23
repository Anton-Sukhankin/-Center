import {
    Activity, FileSearch, AlertTriangle, Archive, ArrowDown, ArrowDownRight, ArrowLeft, ArrowRight, ArrowUp, ArrowUpRight,
    BarChart3, Bookmark, Building, Building2, Calendar, CalendarCheck, CalendarDays, Gauge, Check, CheckCircle,
    ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ChevronsLeft, ChevronsRight, CircleAlert, CircleHelp, ClipboardCheck, ClipboardList,
    ClipboardPlus, Clock, Construction, Download, Ellipsis, FileBarChart, FileCheck, FileText,
    Filter, Folder, FolderMinus, FolderOpen, FolderPlus, GitFork, Grid3X3, HardHat, Info, Layers, LayoutDashboard, Link,
    ListChecks, ListTodo, ListTree, Maximize2, Menu, MessageCircle, MessageSquare, Minus, Network, Paperclip,
    Pencil, Pin, PinOff, Plus, Printer, RotateCcw, Search, Send, SlidersHorizontal, Sparkle, Sparkles,
    Stars, Table, Trash2, TrendingDown, TrendingUp, User, UserPlus, Users, Wallet, X, XCircle,
    BriefcaseBusiness, CalendarCheck2, CircleCheck, CircleUser, Clock3, Copy, DraftingCompass,
    EllipsisVertical, ExternalLink, FileChartColumn, FileCheck2, FileClock, History, Layers3,
    LoaderCircle, Lock, PanelsTopLeft, School, ShieldAlert, SquareParking, Star, TriangleAlert,
    UserRoundX, UsersRound, WalletCards, WifiOff
} from 'lucide-react';

const byName = {
    activity: Activity, 'file-search': FileSearch, gauge: Gauge, 'alert-triangle': AlertTriangle, 'arrow-down': ArrowDown,
    'arrow-down-right': ArrowDownRight, 'arrow-left': ArrowLeft, 'arrow-right': ArrowRight,
    'arrow-up': ArrowUp, 'arrow-up-right': ArrowUpRight, 'bar-chart-3': BarChart3,
    bookmark: Bookmark, building: Building, 'building-2': Building2, calendar: Calendar, 'calendar-check': CalendarCheck,
    'calendar-days': CalendarDays, check: Check, 'check-circle': CheckCircle,
    'chevron-down': ChevronDown, 'chevron-left': ChevronLeft, 'chevron-right': ChevronRight,
    'chevron-up': ChevronUp, 'chevrons-left': ChevronsLeft, 'chevrons-right': ChevronsRight,
    'circle-alert': CircleAlert, 'circle-help': CircleHelp, 'clipboard-check': ClipboardCheck,
    'clipboard-list': ClipboardList, 'clipboard-plus': ClipboardPlus, clock: Clock, construction: Construction,
    download: Download, ellipsis: Ellipsis, 'more-horizontal': Ellipsis, 'file-bar-chart': FileBarChart,
    'file-check': FileCheck, 'file-text': FileText, filter: Filter, folder: Folder,
    'folder-minus': FolderMinus, 'folder-open': FolderOpen, 'folder-plus': FolderPlus,
    'git-fork': GitFork, 'grid-3x3': Grid3X3, 'hard-hat': HardHat, info: Info, layers: Layers,
    'layout-dashboard': LayoutDashboard, link: Link, 'list-checks': ListChecks, 'list-todo': ListTodo, 'list-tree': ListTree,
    'maximize-2': Maximize2, menu: Menu, 'message-circle': MessageCircle, 'message-square': MessageSquare,
    minus: Minus, network: Network, paperclip: Paperclip, pencil: Pencil, pin: Pin, 'pin-off': PinOff,
    plus: Plus, printer: Printer, 'rotate-ccw': RotateCcw, search: Search, send: Send,
    'sliders-horizontal': SlidersHorizontal, sparkle: Sparkle, sparkles: Sparkles, stars: Stars,
    table: Table, 'trash-2': Trash2, 'trending-down': TrendingDown, 'trending-up': TrendingUp,
    user: User, 'user-plus': UserPlus, users: Users, wallet: Wallet, x: X, 'x-circle': XCircle,
    archive: Archive, 'briefcase-business': BriefcaseBusiness, 'calendar-check-2': CalendarCheck2,
    'circle-check': CircleCheck, 'circle-user': CircleUser, 'clock-3': Clock3, copy: Copy,
    'drafting-compass': DraftingCompass, 'ellipsis-vertical': EllipsisVertical, 'external-link': ExternalLink,
    'file-chart-column': FileChartColumn, 'file-check-2': FileCheck2, 'file-clock': FileClock,
    history: History, 'layers-3': Layers3, 'loader-circle': LoaderCircle, lock: Lock,
    'panels-top-left': PanelsTopLeft, school: School, 'shield-alert': ShieldAlert, 'square-parking': SquareParking,
    star: Star, 'triangle-alert': TriangleAlert, 'user-round-x': UserRoundX,
    'users-round': UsersRound, 'wallet-cards': WalletCards, 'wifi-off': WifiOff
};

export default function Icon({ name, ...props }) {
    const Glyph = byName[name] || Activity;
    return <Glyph aria-hidden="true" {...props} />;
}
