import { Fragment } from 'react';

export default function InlineText({ value }) {
    return String(value ?? '').split(/(\*\*[^*\n]+\*\*|\r?\n)/).map((part, index) => {
        if (part === '\r\n' || part === '\n') return <br key={index} />;
        if (part.startsWith('**') && part.endsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>;
        return <Fragment key={index}>{part}</Fragment>;
    });
}
