import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  ParseIntPipe,
  Delete,
  Request,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CloudinaryMulter } from 'src/cloudinary/cloudinary.config';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from 'src/auth/optional-jwt-auth.guard';
import { UpdateProductStatusDto } from './dto/update-status.dto';
import { Product } from 'src/entities/product.entity';
import { SearchProductDto } from './dto/search-product.dto';

@Controller('products')
export class ProductController {
  private readonly logger = new Logger(ProductController.name);

  constructor(private readonly productService: ProductService) {}

  // 🟢 Tạo bài đăng (đăng sản phẩm mới)
  @Post()
  @UseInterceptors(FilesInterceptor('files', 4, CloudinaryMulter))
  async create(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() createProductDto: CreateProductDto,
  ) {
    return await this.productService.create(createProductDto, files);
  }

  // 🟢 Lấy danh sách bài hiển thị ngoài trang chủ
  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async findAll(@Req() req, @Query('category_id') category_id?: string, @Query('view') view?: string) {
    const userId = req.user?.id || null;
    if (category_id) {
      return await this.productService.findByCategoryId(Number(category_id));
    }
    return await this.productService.findAllFormatted(userId, view);
  }

  // 🟢 Người dùng xem tất cả bài đăng của chính mình
  @Get('my-posts/:userId')
  async getMyPosts(@Param('userId', ParseIntPipe) userId: number) {
    return this.productService.findByUserId(userId);
  }

  // API này sẽ xử lý logic cho toàn bộ trang Gợi ý
  @Get('suggestions/my-feed')
  @UseGuards(JwtAuthGuard) // Bắt buộc người dùng phải đăng nhập
  async getSuggestionFeed(@Req() req) {
    // Lấy userId từ token (đã được JwtAuthGuard giải mã)
    const userId = req.user.id;

    // Gọi hàm logic mới trong Service
    return this.productService.getSuggestionFeed(userId);
  }



  // 🟢 Lấy danh sách sản phẩm "Miễn phí" (loại trừ sản phẩm của user hiện tại)
  @Get('free')
  @UseGuards(OptionalJwtAuthGuard)
  async getFreeProducts(@Req() req) {
    const userId = req.user?.id || 0;
    return this.productService.findFreeProductsExcludeUser(userId);
  }

  // 🟢 Lấy danh sách sản phẩm "Trao đổi" (loại trừ sản phẩm của user hiện tại)
  @Get('exchange')
  @UseGuards(OptionalJwtAuthGuard)
  async getExchangeProducts(@Req() req) {
    const userId = req.user?.id || 0;
    return this.productService.findExchangeProductsExcludeUser(userId);
  }

  // 🟣 Admin xem tất cả bài (bỏ lọc duyệt)
  @Get('admin/all')
  async findAllForAdmin() {
    return this.productService.findAllForAdmin();
  }

  // 🟣 Admin duyệt / từ chối bài
  @Patch('admin/status/:id')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductStatusDto,
  ) {
    return this.productService.updateProductStatus(id, dto);
  }

  //Tìm kiếm sản phẩm (hỗ trợ name, price, category, sort, phân trang)
@Get("search")
async searchProducts(@Query() query: SearchProductDto) {
  return this.productService.searchProducts(query);
}
  /**
   * (Người dùng) Cập nhật chi tiết tin đăng
   */
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @UseInterceptors(FilesInterceptor('files', 4, CloudinaryMulter))
  async updateProduct(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    @Body() updateDto: Partial<CreateProductDto>,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const userId = req.user.id;
    // 👇 Truyền 'files' vào service
    return this.productService.updateProduct(id, userId, updateDto, files);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  hardDelete(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.productService.hardDeleteProduct(id, req.user);
  }

  // === GỢI Ý NGƯỜI MUA DÀNH CHO NGƯỜI BÁN ===
  @Get('suggest/selling/:subCategoryId')
  @UseGuards(JwtAuthGuard)
  async suggestForSelling(
    @Param('subCategoryId', ParseIntPipe) subCategoryId: number,
    @Req() req,
  ) {
    const userId = req.user.id;
    return this.productService.suggestForSelling(subCategoryId, userId);
  }

  // === GỢI Ý NGƯỜI BÁN DÀNH CHO NGƯỜI MUA ===
  @Get('suggest/buying/:subCategoryId')
  @UseGuards(JwtAuthGuard)
  async suggestForBuying(
    @Param('subCategoryId', ParseIntPipe) subCategoryId: number,
    @Req() req,
  ) {
    const userId = req.user.id;
    return this.productService.suggestForBuying(subCategoryId, userId);
  }

  // 🟢 Lấy sản phẩm liên quan (ĐẶT TRƯỚC HÀM /:id)
  @Get(':id/related')
  async findRelated(@Param('id', ParseIntPipe) id: number) {
    // Lấy thông tin sản phẩm hiện tại để biết category
    const currentProduct = await this.productService.findById(id);
    if (!currentProduct) {
      throw new NotFoundException(`Không tìm thấy sản phẩm ID ${id}`);
    }

    // Kiểm tra xem có category và subCategory không
    if (!currentProduct.category?.id || !currentProduct.subCategory?.id) {
      this.logger.warn(
        `Sản phẩm ${id} thiếu category hoặc subCategory, không thể tìm bài liên quan.`,
      );
      return []; // Trả về mảng rỗng nếu thiếu thông tin
    }

    return this.productService.findRelatedProducts(
      id,
      currentProduct.category.id,
      currentProduct.subCategory.id,
      8, // Lấy tối đa 8 sản phẩm liên quan
    );
  }

  // === ẨN BÀI ĐĂNG ===
  @UseGuards(JwtAuthGuard)
  @Patch(':id/hide')
  async hideProduct(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.productService.hideProduct(id, req.user);
  }

  // === HIỆN LẠI BÀI ĐÃ ẨN ===
  @UseGuards(JwtAuthGuard)
  @Patch(':id/unhide')
  async unhideProduct(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.productService.unhideProduct(id, req.user);
  }

  // === ĐÁNH DẤU ĐÃ BÁN ===
  @UseGuards(JwtAuthGuard)
  @Patch(':id/sold')
  async markAsSold(
    @Param('id', ParseIntPipe) id: number, 
    @Request() req
  ) {
    const userId = req.user.id;
    return this.productService.markAsSold(id, userId);
  }
  
  // === YÊU CẦU GIA HẠN ===
  @UseGuards(JwtAuthGuard)
  @Post(':id/extension')
  async requestExtension(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    @Body('reason') reason: string,
  ) {
    return this.productService.requestExtension(id, req.user.id, reason);
  }

  // === ADMIN DUYỆT GIA HẠN ===
  @UseGuards(JwtAuthGuard) // + AdminGuard
  @Patch(':id/approve-extension')
  async approveExtension(@Param('id', ParseIntPipe) id: number) {
    return this.productService.approveExtension(id);
  }

  // === LẤY DANH SÁCH HẾT HẠN GỢI Ý 30 NGÀY ===
  @Get('interests/expiring')
  @UseGuards(JwtAuthGuard)
  async getExpiringInterests(@Req() req) {
    const userId = req.user.id;
    return this.productService.getExpiringInterests(userId);
  }

  // === GIA HẠN / HỦY NHẬN GỢI Ý ===
  @Patch(':id/renew-interest')
  @UseGuards(JwtAuthGuard)
  async renewInterest(
    @Param('id', ParseIntPipe) id: number,
    @Req() req,
    @Body('keepSuggesting') keepSuggesting: boolean,
  ) {
    const userId = req.user.id;
    return this.productService.renewInterest(id, userId, keepSuggesting);
  }

  // 🟢 Lấy chi tiết 1 bài
  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  async findOne(@Param('id', ParseIntPipe) id: number, @Req() req) {
    const userId = req.user?.id || null;
    return this.productService.findById(id, userId);
  }    
}
