// این فایل باید همیشه با enum های prisma/schema.prisma هم‌گام باشه.
// هدف: frontend و backend یک منبع واحد برای وضعیت‌ها داشته باشن
// و در فرانت مقادیر رشته‌ای دستی و ناهماهنگ (مثل نسخه‌ی قبلی پروژه) تکرار نشه.

export enum BookingStatus {
  HOLD = "HOLD",
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  NO_SHOW = "NO_SHOW",
}

export enum BusinessStatus {
  PENDING_REVIEW = "PENDING_REVIEW",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  SUSPENDED = "SUSPENDED",
}

export enum PaymentStatus {
  INITIATED = "INITIATED",
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
}

export enum StaffRole {
  OWNER = "OWNER",
  MANAGER = "MANAGER",
  STAFF = "STAFF",
}

export enum GlobalRole {
  USER = "USER",
  ADMIN = "ADMIN",
}
