"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RsvpSchema = exports.Rsvp = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let Rsvp = class Rsvp {
};
exports.Rsvp = Rsvp;
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Rsvp.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true, index: true, lowercase: true, trim: true }),
    __metadata("design:type", String)
], Rsvp.prototype, "normalizedName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Rsvp.prototype, "attendanceChoice", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Rsvp.prototype, "note", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Rsvp.prototype, "attendanceStatus", void 0);
__decorate([
    (0, mongoose_1.Prop)({ unique: true, sparse: true }),
    __metadata("design:type", String)
], Rsvp.prototype, "ticketCode", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], Rsvp.prototype, "ticketIssuedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Rsvp.prototype, "isCheckedIn", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], Rsvp.prototype, "checkInTime", void 0);
__decorate([
    (0, mongoose_1.Prop)({ unique: true, sparse: true }),
    __metadata("design:type", String)
], Rsvp.prototype, "qrCodeData", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], Rsvp.prototype, "checkedInAt", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Rsvp.prototype, "checkedInBy", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: ['qr', 'manual'] }),
    __metadata("design:type", String)
], Rsvp.prototype, "checkInMethod", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Rsvp.prototype, "sentimentScore", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 1 }),
    __metadata("design:type", Number)
], Rsvp.prototype, "guestQuota", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 1 }),
    __metadata("design:type", Number)
], Rsvp.prototype, "guestCount", void 0);
exports.Rsvp = Rsvp = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Rsvp);
exports.RsvpSchema = mongoose_1.SchemaFactory.createForClass(Rsvp);
//# sourceMappingURL=rsvp.schema.js.map