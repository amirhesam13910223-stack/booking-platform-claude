import { Controller, Get, Param, Query } from '@nestjs/common';
import { BusinessService } from '../business/business.service';
import { SearchBusinessDto } from '../business/dto/search-business.dto';
import { Public } from '../auth/decorators/public.decorator';

// این کنترلر عمداً یک top-level path کاملاً جدا داره (نه زیرمسیر
// businesses/) چون در Nest/Express روت‌ها به ترتیب ثبت match میشن
// نه بر اساس specificity؛ اگر این‌جا از businesses/public استفاده
// می‌شد، GET /businesses/:id در BusinessController (که با
// BusinessRoles محافظت شده) می‌تونست id="public" رو زودتر بگیره و
// جستجوی عمومی رو برای کاربر مهمان ۴۰۳ کنه. یک top-level path جدا
// این کلاس باگ رو کاملاً و برای همیشه حذف می‌کنه.
@Controller('discover/businesses')
export class DiscoveryController {
  constructor(private readonly businessService: BusinessService) {}

  @Public()
  @Get()
  search(@Query() query: SearchBusinessDto) {
    return this.businessService.search(query);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.businessService.findOnePublic(id);
  }
}
