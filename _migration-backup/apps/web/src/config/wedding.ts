// Wedding Configuration from Environment Variables
// All values are prefixed with VITE_ to be accessible in the browser

export const weddingConfig = {
    couple: {
        groom: {
            nickname: import.meta.env.VITE_GROOM_NICKNAME || 'Romeo',
            fullname: import.meta.env.VITE_GROOM_FULLNAME || 'Romeo Montague',
            father: import.meta.env.VITE_GROOM_FATHER || 'Mr. Montague',
            mother: import.meta.env.VITE_GROOM_MOTHER || 'Mrs. Montague',
        },
        bride: {
            nickname: import.meta.env.VITE_BRIDE_NICKNAME || 'Juliet',
            fullname: import.meta.env.VITE_BRIDE_FULLNAME || 'Juliet Capulet',
            father: import.meta.env.VITE_BRIDE_FATHER || 'Mr. Capulet',
            mother: import.meta.env.VITE_BRIDE_MOTHER || 'Mrs. Capulet',
        },
    },

    date: {
        full: import.meta.env.VITE_WEDDING_DATE || 'December 31, 2024',
        day: import.meta.env.VITE_WEDDING_DAY || 'Tuesday',
    },

    ceremony: {
        time: import.meta.env.VITE_CEREMONY_TIME || '09:00 AM - 11:00 AM',
        venue: import.meta.env.VITE_CEREMONY_VENUE || "St. Peter's Cathedral",
        address: import.meta.env.VITE_CEREMONY_ADDRESS || 'Jl. Katedral No.7, Jakarta Pusat',
        mapLink: import.meta.env.VITE_CEREMONY_MAP_LINK || 'https://goo.gl/maps/placeholder',
    },

    reception: {
        time: import.meta.env.VITE_RECEPTION_TIME || '06:00 PM - 09:00 PM',
        venue: import.meta.env.VITE_RECEPTION_VENUE || 'Jakarta Convention Center',
        address: import.meta.env.VITE_RECEPTION_ADDRESS || 'Jl. Jend. Gatot Subroto, Jakarta Pusat',
        mapLink: import.meta.env.VITE_RECEPTION_MAP_LINK || 'https://goo.gl/maps/placeholder',
    },

    timeline: (() => {
        const timelineItems = [];
        let index = 1;
        
        // Keep checking for timeline items until we find a missing one
        while (true) {
            const time = import.meta.env[`VITE_TIMELINE_${index}_TIME`];
            const event = import.meta.env[`VITE_TIMELINE_${index}_EVENT`];
            const icon = import.meta.env[`VITE_TIMELINE_${index}_ICON`];
            
            // If time or event is missing, stop looking for more items
            if (!time && !event) {
                break;
            }
            
            // Only add the item if it has at least a time or event
            if (time || event) {
                timelineItems.push({
                    time: time || '',
                    event: event || '',
                    icon: icon || '📅',
                });
            }
            
            index++;
            
            // Safety limit to prevent infinite loop
            if (index > 20) break;
        }
        
        // If no timeline items found, return default timeline
        if (timelineItems.length === 0) {
            return [
                {
                    time: '09:00 AM',
                    event: 'Blessing Ceremony',
                    icon: '⛪',
                },
                {
                    time: '01:00 PM',
                    event: 'Tea Pai',
                    icon: '🍵',
                },
                {
                    time: '06:00 PM',
                    event: 'Wedding Reception',
                    icon: '🎉',
                },
                {
                    time: '09:00 PM',
                    event: 'After Party',
                    icon: '🍾',
                },
            ];
        }
        
        return timelineItems;
    })(),

    gift: {
        accounts: [
            {
                bankName: import.meta.env.VITE_BANK_1_NAME || 'Bank Central Asia (BCA)',
                accountName: import.meta.env.VITE_ACCOUNT_1_NAME || 'Romeo & Juliet',
                accountNumber: import.meta.env.VITE_ACCOUNT_1_NUMBER || '1234567890',
            },
            {
                bankName: import.meta.env.VITE_BANK_2_NAME || 'Bank Central Asia (BCA)',
                accountName: import.meta.env.VITE_ACCOUNT_2_NAME || 'Romeo & Juliet',
                accountNumber: import.meta.env.VITE_ACCOUNT_2_NUMBER || '0987654321',
            },
        ],
    },
};
