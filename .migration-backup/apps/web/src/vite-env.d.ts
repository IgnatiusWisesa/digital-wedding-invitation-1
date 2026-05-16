/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_URL: string
    readonly VITE_GROOM_NICKNAME: string
    readonly VITE_BRIDE_NICKNAME: string
    readonly VITE_GROOM_FULLNAME: string
    readonly VITE_BRIDE_FULLNAME: string
    readonly VITE_GROOM_FATHER: string
    readonly VITE_GROOM_MOTHER: string
    readonly VITE_BRIDE_FATHER: string
    readonly VITE_BRIDE_MOTHER: string
    readonly VITE_WEDDING_DATE: string
    readonly VITE_WEDDING_DAY: string
    readonly VITE_CEREMONY_TIME: string
    readonly VITE_CEREMONY_VENUE: string
    readonly VITE_CEREMONY_ADDRESS: string
    readonly VITE_CEREMONY_MAP_LINK: string
    readonly VITE_CEREMONY_LABEL: string
    readonly VITE_RECEPTION_TIME: string
    readonly VITE_RECEPTION_VENUE: string
    readonly VITE_RECEPTION_ADDRESS: string
    readonly VITE_RECEPTION_MAP_LINK: string
    readonly VITE_TIMELINE_1_TIME: string
    readonly VITE_TIMELINE_1_EVENT: string
    readonly VITE_TIMELINE_1_ICON: string
    readonly VITE_TIMELINE_2_TIME: string
    readonly VITE_TIMELINE_2_EVENT: string
    readonly VITE_TIMELINE_2_ICON: string
    readonly VITE_TIMELINE_3_TIME: string
    readonly VITE_TIMELINE_3_EVENT: string
    readonly VITE_TIMELINE_3_ICON: string
    readonly VITE_TIMELINE_4_TIME: string
    readonly VITE_TIMELINE_4_EVENT: string
    readonly VITE_TIMELINE_4_ICON: string
    readonly VITE_BANK_1_NAME: string
    readonly VITE_ACCOUNT_1_NAME: string
    readonly VITE_ACCOUNT_1_NUMBER: string
    readonly VITE_BANK_2_NAME: string
    readonly VITE_ACCOUNT_2_NAME: string
    readonly VITE_ACCOUNT_2_NUMBER: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
