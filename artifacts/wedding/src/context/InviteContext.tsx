import { createContext, useContext } from 'react';

export interface InviteData {
  name: string;
  quota: number;
  event: string;
  note: string;
}

export const InviteContext = createContext<InviteData | null>(null);

export const useInvite = () => useContext(InviteContext);
