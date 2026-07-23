import { IsIn, IsUrl } from 'class-validator';

export class AddDocumentDto {
  @IsIn(['NATIONAL_ID', 'BUSINESS_LICENSE', 'OTHER'])
  type: 'NATIONAL_ID' | 'BUSINESS_LICENSE' | 'OTHER';

  // فعلاً کلاینت خودش فایل رو جای دیگه (Object Storage) آپلود می‌کنه
  // و فقط URL نهایی رو می‌فرسته — پیاده‌سازی presigned upload در فاز
  // بعدی (زیرساخت فایل) اضافه میشه.
  @IsUrl({}, { message: 'آدرس فایل معتبر نیست' })
  fileUrl: string;
}
