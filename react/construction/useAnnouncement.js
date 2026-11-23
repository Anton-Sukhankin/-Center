import { useEffect, useRef, useState } from 'react';

export default function useAnnouncement(active, delay) {
    const [text, setText] = useState('');
    const timer = useRef(0);

    useEffect(() => {
        if (!active) setText('');
        return () => clearTimeout(timer.current);
    }, [active]);

    function announce(message) {
        clearTimeout(timer.current);
        setText(message);
        timer.current = setTimeout(() => setText(''), delay);
    }

    return [text, announce];
}
