import React from 'react';
import { Section } from './Section';
import { weddingConfig } from '../config/wedding';

export const GiftSection = () => {
    const copyToClipboard = (accountNumber: string) => {
        navigator.clipboard.writeText(accountNumber);
        alert("Account number copied!");
    };

    return (
        <Section className="text-center">
            <h2 className="font-serif text-4xl text-accent-yellow mb-8">Wedding Gift</h2>
            <p className="text-white/70 mb-12 max-w-lg mx-auto">
                Your presence is the greatest gift of all. However, if you wish to honor us with a gift, we have provided our bank details below.
            </p>

            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {weddingConfig.gift.accounts?.length > 0 && weddingConfig.gift.accounts.map((account, index) => (
                    <div key={index} className="bg-night-800/50 p-8 rounded-xl border border-accent-green/30 hover:border-accent-green/60 transition-colors group">
                        <div className="mb-6">
                            <div className="text-left">
                                <h3 className="font-bold text-2xl text-accent-yellow">{account.bankName.split(' ')[0]}</h3>
                                <p className="text-white/60 text-sm">{account.bankName}</p>
                            </div>
                        </div>

                        <div className="text-left mb-8">
                            <p className="text-white/50 text-xs uppercase tracking-widest mb-1">Account Number</p>
                            <div className="flex items-center space-x-3">
                                <span className="font-mono text-xl md:text-2xl text-white tracking-wider filter drop-shadow-md">{account.accountNumber}</span>
                                <button onClick={() => copyToClipboard(account.accountNumber)} className="text-accent-yellow hover:text-accent-green focus:outline-none" title="Copy">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                </button>
                            </div>
                        </div>

                        <div className="text-left">
                            <p className="text-white/50 text-xs uppercase tracking-widest mb-1">Account Name</p>
                            <p className="text-accent-yellow font-serif text-lg tracking-wide">{account.accountName}</p>
                        </div>
                    </div>
                ))}
            </div>
        </Section>
    );
};
