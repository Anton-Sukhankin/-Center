import {
    Archive, CalendarClock, CircleCheck, Copy, DraftingCompass, EllipsisVertical, ExternalLink,
    FileClock, History, LoaderCircle, Lock, School, SquareParking, Star, TriangleAlert, UserRound, WifiOff
} from 'lucide-react';
import Icon from '../ui/Icon.jsx';

const icons = {
    archive: Archive, 'calendar-clock': CalendarClock, 'circle-check': CircleCheck, copy: Copy,
    'drafting-compass': DraftingCompass, 'ellipsis-vertical': EllipsisVertical, 'external-link': ExternalLink,
    'file-clock': FileClock, history: History, 'loader-circle': LoaderCircle, lock: Lock, school: School,
    'square-parking': SquareParking, star: Star, 'triangle-alert': TriangleAlert,
    'user-round': UserRound, 'wifi-off': WifiOff
};

export default function ConstructionIcon({ name, ...props }) {
    const Glyph = icons[name];
    return Glyph ? <Glyph aria-hidden="true" {...props} /> : <Icon name={name} {...props} />;
}
