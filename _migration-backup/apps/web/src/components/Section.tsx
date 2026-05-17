import React, { ReactNode } from 'react';

interface SectionProps {
    children: ReactNode;
    className?: string;
    id?: string;
}

export const Section: React.FC<SectionProps> = ({ children, className = '', id }) => {
    return (
        <section id={id} className={`py-20 px-4 md:px-8 max-w-4xl mx-auto relative z-10 ${className}`}>
            {children}
        </section>
    );
};
