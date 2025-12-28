import { HydratedDocument } from 'mongoose';
export type RsvpDocument = HydratedDocument<Rsvp>;
export declare class Rsvp {
    name: string;
    normalizedName: string;
    attendanceChoice: string;
    note: string;
    attendanceStatus: string;
    ticketCode: string;
    ticketIssuedAt: Date;
    isCheckedIn: boolean;
    checkInTime: Date;
    qrCodeData: string;
    checkedInAt: Date;
    checkedInBy: string;
    checkInMethod: string;
    sentimentScore: number;
    guestQuota: number;
    guestCount: number;
}
export declare const RsvpSchema: import("mongoose").Schema<Rsvp, import("mongoose").Model<Rsvp, any, any, any, import("mongoose").Document<unknown, any, Rsvp, any, import("mongoose").DefaultSchemaOptions> & Rsvp & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any, Rsvp>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Rsvp, import("mongoose").Document<unknown, {}, Rsvp, {
    id: string;
}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Rsvp & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    name?: import("mongoose").SchemaDefinitionProperty<string, Rsvp, import("mongoose").Document<unknown, {}, Rsvp, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Rsvp & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    normalizedName?: import("mongoose").SchemaDefinitionProperty<string, Rsvp, import("mongoose").Document<unknown, {}, Rsvp, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Rsvp & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    attendanceChoice?: import("mongoose").SchemaDefinitionProperty<string, Rsvp, import("mongoose").Document<unknown, {}, Rsvp, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Rsvp & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    note?: import("mongoose").SchemaDefinitionProperty<string, Rsvp, import("mongoose").Document<unknown, {}, Rsvp, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Rsvp & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    attendanceStatus?: import("mongoose").SchemaDefinitionProperty<string, Rsvp, import("mongoose").Document<unknown, {}, Rsvp, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Rsvp & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    ticketCode?: import("mongoose").SchemaDefinitionProperty<string, Rsvp, import("mongoose").Document<unknown, {}, Rsvp, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Rsvp & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    ticketIssuedAt?: import("mongoose").SchemaDefinitionProperty<Date, Rsvp, import("mongoose").Document<unknown, {}, Rsvp, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Rsvp & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    isCheckedIn?: import("mongoose").SchemaDefinitionProperty<boolean, Rsvp, import("mongoose").Document<unknown, {}, Rsvp, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Rsvp & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    checkInTime?: import("mongoose").SchemaDefinitionProperty<Date, Rsvp, import("mongoose").Document<unknown, {}, Rsvp, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Rsvp & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    qrCodeData?: import("mongoose").SchemaDefinitionProperty<string, Rsvp, import("mongoose").Document<unknown, {}, Rsvp, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Rsvp & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    checkedInAt?: import("mongoose").SchemaDefinitionProperty<Date, Rsvp, import("mongoose").Document<unknown, {}, Rsvp, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Rsvp & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    checkedInBy?: import("mongoose").SchemaDefinitionProperty<string, Rsvp, import("mongoose").Document<unknown, {}, Rsvp, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Rsvp & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    checkInMethod?: import("mongoose").SchemaDefinitionProperty<string, Rsvp, import("mongoose").Document<unknown, {}, Rsvp, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Rsvp & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    sentimentScore?: import("mongoose").SchemaDefinitionProperty<number, Rsvp, import("mongoose").Document<unknown, {}, Rsvp, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Rsvp & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    guestQuota?: import("mongoose").SchemaDefinitionProperty<number, Rsvp, import("mongoose").Document<unknown, {}, Rsvp, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Rsvp & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    guestCount?: import("mongoose").SchemaDefinitionProperty<number, Rsvp, import("mongoose").Document<unknown, {}, Rsvp, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Rsvp & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Rsvp>;
