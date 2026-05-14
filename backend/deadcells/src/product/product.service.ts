import { GroupService } from './../groups/group.service';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, Not, Repository } from 'typeorm';
import { ProductImage } from 'src/entities/product-image.entity';
import { DealType } from 'src/entities/deal-type.entity';
import { Condition } from 'src/entities/condition.entity';
import { SubCategory } from 'src/entities/sub-category.entity';
import { FashionCategory } from 'src/entities/categories/fashion-category.entity';
import { GameCategory } from 'src/entities/categories/game-category.entity';
import { AcademicCategory } from 'src/entities/categories/academic-category.entity';
import { AnimalCategory } from 'src/entities/categories/animal-category.entity';
import { ElectronicCategory } from 'src/entities/categories/electronic-category.entity';
import { HouseCategory } from 'src/entities/categories/house-category.entity';
import { VehicleCategory } from 'src/entities/categories/vehicle-category.entity';
import { DataSource } from 'typeorm';
import { PostType } from 'src/entities/post-type.entity';
import { User } from 'src/entities/user.entity';
import { NotificationService } from 'src/notification/notification.service';
import { SizeService } from 'src/size/size.service';
import { BrandService } from 'src/brands/brand.service';
import { OriginService } from 'src/origin/origin.service';
import { MaterialService } from 'src/material/material.service';
import { ColorService } from 'src/colors/color.service';
import { CapacityService } from 'src/capacitys/capacity.service';
import { WarrantyService } from 'src/warrantys/warranty.service';
import { ProductModelService } from 'src/product-models/product-model.service';
import { ProcessorService } from 'src/processors/processor.service';
import { AgeRangeService } from 'src/age-ranges/age-range.service';
import { BreedService } from 'src/breeds/breed.service';
import { EngineCapacityService } from 'src/engine-capacities/engine-capacity.service';
import { GenderService } from 'src/genders/gender.service';
import { GraphicsCardService } from 'src/graphics-cards/graphics-card.service';
import { RamOptionService } from 'src/ram-options/ram-option.service';
import { StorageTypeService } from 'src/storage-types/storage-type.service';
import { ProductTypeService } from 'src/product-types/product-type.service';
import { Category } from 'src/entities/category.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductStatusDto } from './dto/update-status.dto';
import { ProductStatusService } from 'src/product-statuses/product-status.service';
import { GroupMember } from 'src/entities/group-member.entity';
import { Product } from 'src/entities/product.entity';
import { Favorite } from 'src/entities/favorite.entity';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SearchProductDto } from './dto/search-product.dto';
import { AiService } from 'src/ai/ai.service';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);


  constructor(

    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductImage)
    private readonly imageRepo: Repository<ProductImage>,

    @InjectRepository(Favorite)
    private readonly favoriteRepo: Repository<Favorite>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(DealType)
    private readonly dealTypeRepo: Repository<DealType>,
    @InjectRepository(Condition)
    private readonly conditionRepo: Repository<Condition>,
    @InjectRepository(SubCategory)
    private readonly subCategoryRepo: Repository<SubCategory>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(PostType)
    private readonly postTypeRepo: Repository<PostType>,

    @InjectRepository(FashionCategory)
    private readonly fashionRepo: Repository<FashionCategory>,
    @InjectRepository(GameCategory)
    private readonly gameRepo: Repository<GameCategory>,
    @InjectRepository(AcademicCategory)
    private readonly academicRepo: Repository<AcademicCategory>,
    @InjectRepository(AnimalCategory)
    private readonly animalRepo: Repository<AnimalCategory>,
    @InjectRepository(ElectronicCategory)
    private readonly electronicRepo: Repository<ElectronicCategory>,
    @InjectRepository(HouseCategory)
    private readonly houseRepo: Repository<HouseCategory>,
    @InjectRepository(VehicleCategory)
    private readonly vehicleRepo: Repository<VehicleCategory>,

    // === THÊM CÁC SERVICE CON ===
    private readonly sizeService: SizeService,
    private readonly brandService: BrandService,
    private readonly originService: OriginService,
    private readonly materialService: MaterialService,
    private readonly colorService: ColorService,
    private readonly capacityService: CapacityService,
    private readonly warrantyService: WarrantyService,
    private readonly productModelService: ProductModelService,
    private readonly processorService: ProcessorService,
    private readonly ramOptionService: RamOptionService,
    private readonly storageTypeService: StorageTypeService,
    private readonly graphicsCardService: GraphicsCardService,
    private readonly breedService: BreedService,
    private readonly ageRangeService: AgeRangeService,
    private readonly genderService: GenderService,
    private readonly engineCapacityService: EngineCapacityService,
    private readonly productTypeService: ProductTypeService,
    private readonly productStatusService: ProductStatusService,

    private readonly groupService: GroupService,
    private readonly dataSource: DataSource,
    @InjectRepository(GroupMember)
    private readonly groupMemberRepo: Repository<GroupMember>,

    private readonly notificationService: NotificationService,
    private readonly aiService: AiService,
  ) { }

  // Thêm sản phẩm mới (tự động tạo sub_category nếu chưa tồn tại)
  async create(data: CreateProductDto, files?: Express.Multer.File[]) {
    // 1. Lấy các đối tượng (Entity) từ ID song song
    const [
      dealType,
      condition,
      postType,
      user,
      category,
      subCategory,
      productType,
      origin,
      material,
      size,
      brand,
      productModel,
      color,
      capacity,
      warranty,
      processor,
      ramOption,
      storageType,
      graphicsCard,
      breed,
      ageRange,
      gender,
      productStatus,
      engineCapacity,
      category_change,
      sub_category_change,
    ] = await Promise.all([
      data.deal_type_id
        ? this.dealTypeRepo.findOneBy({ id: data.deal_type_id })
        : Promise.resolve(null),
      data.condition_id
        ? this.conditionRepo.findOneBy({ id: data.condition_id })
        : Promise.resolve(null),
      data.post_type_id
        ? this.postTypeRepo.findOneBy({ id: data.post_type_id })
        : Promise.resolve(null),
      data.user_id
        ? this.userRepo.findOneBy({ id: data.user_id })
        : Promise.resolve(null),
      data.category_id
        ? this.categoryRepo.findOneBy({ id: data.category_id })
        : Promise.resolve(null),
      data.sub_category_id
        ? this.subCategoryRepo.findOneBy({ id: data.sub_category_id })
        : Promise.resolve(null),

      // Dùng Service
      data.product_type_id
        ? this.productTypeService.findOne(data.product_type_id)
        : Promise.resolve(null),
      data.origin_id
        ? this.originService.findOne(data.origin_id)
        : Promise.resolve(null),
      data.material_id
        ? this.materialService.findOne(data.material_id)
        : Promise.resolve(null),
      data.size_id
        ? this.sizeService.findOne(data.size_id)
        : Promise.resolve(null),
      data.brand_id
        ? this.brandService.findOne(data.brand_id)
        : Promise.resolve(null),
      data.product_model_id
        ? this.productModelService.findOne(data.product_model_id)
        : Promise.resolve(null),
      data.color_id
        ? this.colorService.findOne(data.color_id)
        : Promise.resolve(null),
      data.capacity_id
        ? this.capacityService.findOne(data.capacity_id)
        : Promise.resolve(null),
      data.warranty_id
        ? this.warrantyService.findOne(data.warranty_id)
        : Promise.resolve(null),
      data.processor_id
        ? this.processorService.findOne(data.processor_id)
        : Promise.resolve(null),
      data.ram_option_id
        ? this.ramOptionService.findOne(data.ram_option_id)
        : Promise.resolve(null),
      data.storage_type_id
        ? this.storageTypeService.findOne(data.storage_type_id)
        : Promise.resolve(null),
      data.graphics_card_id
        ? this.graphicsCardService.findOne(data.graphics_card_id)
        : Promise.resolve(null),
      data.breed_id
        ? this.breedService.findOne(data.breed_id)
        : Promise.resolve(null),
      data.age_range_id
        ? this.ageRangeService.findOne(data.age_range_id)
        : Promise.resolve(null),
      data.gender_id
        ? this.genderService.findOne(data.gender_id)
        : Promise.resolve(null),
      data.engine_capacity_id
        ? this.engineCapacityService.findOne(data.engine_capacity_id)
        : Promise.resolve(null),
      data.product_status_id
        ? this.productStatusService.findOne(data.product_status_id)
        : Promise.resolve(null),

      data.category_change_id
        ? this.categoryRepo.findOneBy({ id: data.category_change_id })
        : Promise.resolve(null),
      data.sub_category_change_id
        ? this.subCategoryRepo.findOneBy({ id: data.sub_category_change_id })
        : Promise.resolve(null),
    ]);

    // 2. Kiểm tra các Entity bắt buộc
    if (!dealType)
      throw new NotFoundException(
        `Không tìm thấy dealType ID ${data.deal_type_id}`,
      );
    if (!postType)
      throw new NotFoundException(
        `Không tìm thấy postType ID ${data.post_type_id}`,
      );
    if (!user)
      throw new NotFoundException(`Không tìm thấy user ID ${data.user_id}`);
    if (!category)
      throw new NotFoundException(
        `Không tìm thấy category ID ${data.category_id}`,
      );
    if (!subCategory)
      throw new NotFoundException(
        `Không tìm thấy subCategory ID ${data.sub_category_id}`,
      );

    if (data.condition_id && !condition) {
      throw new NotFoundException(
        `Không tìm thấy condition ID ${data.condition_id}`,
      );
    }

    // 3. Set default productStatus
    let productStatusGr;

    // 4. Nếu là bài đăng nhóm
    if (data.visibility_type && Number(data.visibility_type) === 1) {
      if (!data.group_id || !data.user_id) {
        throw new NotFoundException(
          'Bài đăng nhóm phải có group_id và user_id hợp lệ.',
        );
      }

      // 1. Lấy role từ groupService
      const role = await this.groupService.getUserRole(
        Number(data.group_id),
        data.user_id,
      );

      if (role === 'none') {
        throw new UnauthorizedException(
          'Bạn không phải là thành viên của nhóm này để đăng bài.',
        );
      }

      // 2. Lấy group
      const group = await this.groupService.findOneById(Number(data.group_id));
      if (!group) throw new NotFoundException('Nhóm không tồn tại');

      // 3. Nếu leader → auto duyệt luôn
      if (role === 'leader') {
        productStatusGr = await this.productStatusService.findOne(2); // approved
      } else {
        // member → kiểm tra mustApprovePosts
        const mustApprove = group.mustApprovePosts === true;

        if (mustApprove) {
          productStatusGr = await this.productStatusService.findOne(1); // pending
        } else {
          productStatusGr = await this.productStatusService.findOne(2); // approved
        }
      }
    } else {
      // Post không thuộc nhóm → luôn pending
      productStatusGr = await this.productStatusService.findOne(1);
    }

    // Tính ngày hết hạn
    const expiresDate = new Date();
    expiresDate.setDate(expiresDate.getDate() + 30); // + 30 ngày
    // expiresDate.setSeconds(expiresDate.getSeconds() + 30); // 30s

    const product = this.productRepo.create({
      name: data.name,
      description: data.description,
      price: Number(data.price),
      author: data.author || undefined,
      year: data.year || undefined,
      mileage: data.mileage || undefined,
      user: user || undefined,
      dealType: dealType || undefined,
      condition: condition || undefined,
      postType: postType || undefined,
      category: category || undefined,
      subCategory: subCategory || undefined,
      productType: productType || undefined,
      origin: origin || undefined,
      material: material || undefined,
      size: size || undefined,
      brand: brand || undefined,
      productModel: productModel || undefined,
      color: color || undefined,
      capacity: capacity || undefined,
      warranty: warranty || undefined,
      processor: processor || undefined,
      ramOption: ramOption || undefined,
      storageType: storageType || undefined,
      graphicsCard: graphicsCard || undefined,
      breed: breed || undefined,
      ageRange: ageRange || undefined,
      gender: gender || undefined,
      engineCapacity: engineCapacity || undefined,
      category_change: category_change || undefined,
      sub_category_change: sub_category_change || undefined,

      productStatus: productStatusGr,
      address_json: data.address_json ? JSON.parse(data.address_json) : {},
      thumbnail_url: files && files.length > 0 ? files[0].path : null,

      expires_at: expiresDate,

      visibility_type: data.visibility_type ? Number(data.visibility_type) : 0,
      group_id: data.group_id ? Number(data.group_id) : undefined,
    });

    const savedProduct = await this.productRepo.save(product);

    //  GỬI THÔNG BÁO GỢI Ý (NẾU AUTO-APPROVE)
    if (productStatusGr && productStatusGr.id === 2) {
      this.notificationService
        .notifyFollowersOfNewPost(savedProduct)
        .catch((err) =>
          this.logger.error(
            'Lỗi thông báo user follow đăng bài:',
            err.message,
          ),
        );
      this.notifyMatchingPosts(savedProduct.id);
    }

    // 4. Lưu ảnh
    if (files && files.length > 0) {
      const imagesToSave = files.map((file) =>
        this.imageRepo.create({
          product: { id: savedProduct.id },
          name: savedProduct.name,
          image_url: file.path,
        }),
      );
      await this.imageRepo.save(imagesToSave);
      this.logger.log(
        `🖼️ Đã lưu ${imagesToSave.length} ảnh cho sản phẩm ID=${savedProduct.id}`,
      );
    }
    if (!files || files.length === 0) {
      throw new BadRequestException('Cần ít nhất 1 ảnh');
    }
    // 5. Gửi thông báo
    if (savedProduct) {
      this.notificationService
        .notifyUserOfPostSuccess(savedProduct)
        .catch((err) =>
          this.logger.error(
            'Lỗi (từ service) notifyUserOfPostSuccess:',
            err.message,
          ),
        );
      this.notificationService
        .notifyAdminsOfNewPost(savedProduct)
        .catch((err) =>
          this.logger.error(
            'Lỗi (từ service) notifyAdminsOfNewPost:',
            err.message,
          ),
        );
    }

    // 6. Trả về sản phẩm đầy đủ (Query lại để lấy đủ relations)
    const fullProduct = await this.productRepo.findOne({
      where: { id: savedProduct.id },
      relations: [
        'images',
        'user',
        'dealType',
        'condition',
        'category',
        'subCategory',
        'category_change',
        'sub_category_change',
        'postType',
        'productType',


        'size',
        'brand',
        'color',
        'capacity',
        'warranty',
        'productModel',
        'processor',
        'ramOption',
        'storageType',
        'graphicsCard',
        'breed',
        'ageRange',
        'gender',
        'engineCapacity',
        'productStatus',
        'group',
      ],
    });

    if (!fullProduct) throw new Error('Không tìm thấy sản phẩm sau khi lưu.');

    return this.formatProduct(fullProduct);
  }

  async findByCategoryId(categoryId: number): Promise<Product[]> {
    const products = await this.productRepo.find({
      where: [
        {
          category_id: categoryId,
          product_status_id: 2,
        },
      ],
      relations: [
        'images',
        'user',
        'dealType',
        'condition',
        'category',
        'subCategory',
        'category_change',
        'sub_category_change',
        'postType',
        'productType',


        'size',
        'brand',
        'color',
        'capacity',
        'warranty',
        'productModel',
        'processor',
        'ramOption',
        'storageType',
        'graphicsCard',
        'breed',
        'ageRange',
        'gender',
        'engineCapacity',
        'productStatus',
        'group',
      ],

      order: { created_at: 'DESC' },
    });
    return this.formatProducts(products);
  }

  //  Lấy toàn bộ sản phẩm (cho Postman, trả full dữ liệu chi tiết)
  async getAllProducts(): Promise<any[]> {
    const products = await this.productRepo.find({
      relations: [
        'images',
        'user',
        'dealType',
        'condition',
        'category',
        'subCategory',
        'category_change',
        'sub_category_change',
        'postType',
        'productType',


        'size',
        'brand',
        'color',
        'capacity',
        'warranty',
        'productModel',
        'processor',
        'ramOption',
        'storageType',
        'graphicsCard',
        'breed',
        'ageRange',
        'gender',
        'engineCapacity',
        'productStatus',
        'group',
      ],
      order: { created_at: 'DESC' },
    });

    return this.formatProducts(products);
  }

  // Format dữ liệu cho client (React Native)
  // async findAllFormatted(userId?: number, view?: string): Promise<any[]> {
  //   const products = await this.productRepo.find({
  //     where: { product_status_id: 2 },
  //     relations: [
  //       'images',
  //       'user',
  //       'dealType',
  //       'condition',
  //       'category',
  //       'subCategory',
  //       'category_change',
  //       'sub_category_change',
  //       'postType',
  //       'productType',


  //       'size',
  //       'brand',
  //       'color',
  //       'capacity',
  //       'warranty',
  //       'productModel',
  //       'processor',
  //       'ramOption',
  //       'storageType',
  //       'graphicsCard',
  //       'breed',
  //       'ageRange',
  //       'gender',
  //       'engineCapacity',
  //       'productStatus',
  //       'group',
  //     ],
  //     order: { created_at: 'DESC' },
  //   });

  //   if (view !== 'admin_all') {
  //     findOptions.where = { product_status_id: 2 };
  //   }

  //   const visibleProducts: Product[] = [];

  //   for (const p of products) {
  //     const vis = Number(p.visibility_type);

  //     if (vis === 0 || p.visibility_type == null) {
  //       visibleProducts.push(p);
  //     } else if (vis === 1 && p.group_id && userId) {
  //       const isMember = await this.groupService.isMember(p.group_id, userId);
  //       if (isMember) visibleProducts.push(p);
  //     }
  //   }

  //   return this.formatProducts(visibleProducts);
  // }
// Thêm tham số view?: string vào định nghĩa hàm
  async findAllFormatted(userId?: number, view?: string): Promise<any[]> {
    
    // 1. Cấu hình query cơ bản (luôn lấy relation và sắp xếp)
    const findOptions: any = {
      relations: [
        'images',
        'user',
        'dealType',
        'condition',
        'category',
        'subCategory',
        'category_change',
        'sub_category_change',
        'postType',
        'productType',
        'size',
        'brand',
        'color',
        'capacity',
        'warranty',
        'productModel',
        'processor',
        'ramOption',
        'storageType',
        'graphicsCard',
        'breed',
        'ageRange',
        'gender',
        'engineCapacity',
        'productStatus',
        'group',
      ],
      order: { created_at: 'DESC' },
    };

    // 🟢 2. LOGIC QUAN TRỌNG:
    // Nếu KHÔNG PHẢI là 'admin_all' thì mới ép buộc lọc status = 2.
    // Nếu là 'admin_all', ta bỏ qua dòng này => Lấy hết (1, 2, 3...)
    if (view !== 'admin_all') {
      findOptions.where = { product_status_id: 2 };
    }

    const products = await this.productRepo.find(findOptions);

    // 🟢 3. Nếu là Admin xem tất cả, trả về luôn (bỏ qua logic lọc hiển thị nhóm/công khai)
    // Để Admin đếm được chính xác số lượng trong DB
    if (view === 'admin_all') {
       return this.formatProducts(products);
    }

    // --- Logic lọc hiển thị cho User thường (Giữ nguyên code cũ của bạn) ---
    const visibleProducts: any[] = []; // Sửa type Product[] thành any[] nếu cần

    for (const p of products) {
      const vis = Number(p.visibility_type);

      if (vis === 0 || p.visibility_type == null) {
        visibleProducts.push(p);
      } else if (vis === 1 && p.group_id && userId) {
        const isMember = await this.groupService.isMember(p.group_id, userId);
        if (isMember) visibleProducts.push(p);
      }
    }

    return this.formatProducts(visibleProducts);
  }
  // Format danh sách sản phẩm
  async formatProducts(products: Product[], userId?: number): Promise<any[]> {
    // 1. Lấy danh sách ID sản phẩm yêu thích (chỉ 1 lần)
    let favoriteProductIds: number[] = [];
    if (userId) {
      const favorites = await this.favoriteRepo.find({
        where: { user: { id: userId } },
        select: ['product_id'],
      });
      favoriteProductIds = favorites.map((f) => f.product_id);
    }

    // 2. Dùng .map() đồng bộ để format
    return products.map((p) => {
      const categoryName = p.category?.name || null;
      const subCategoryName = p.subCategory?.name || null;
      const tag =
        categoryName && subCategoryName
          ? `${categoryName} - ${subCategoryName}`
          : categoryName ||
          subCategoryName ||
          p.dealType?.name ||
          'Không có danh mục';

      return {
        id: p.id,
        name: p.name,
        description: p.description,
        price: Number(p.price),
        thumbnail_url: p.images?.[0]?.image_url || null,
        phone: p.user?.phone || null,
        user_id: p.user?.id,
        user: p.user
          ? {
            id: p.user.id,
            name: p.user.nickname,
            email: p.user.email,
            phone: p.user.phone,
          }
          : null,
        author_name: p.user?.nickname || 'Người bán',
        author: p.author || null,
        year: p.year || null,
        mileage: p.mileage ?? null,

        postType: p.postType
          ? { id: p.postType.id, name: p.postType.name }
          : null,
        productType: p.productType
          ? { id: p.productType.id, name: p.productType.name }
          : null,
        origin: p.origin ? { id: p.origin.id, name: p.origin.name } : null,
        material: p.material
          ? { id: p.material.id, name: p.material.name }
          : null,
        size: p.size ? { id: p.size.id, name: p.size.name } : null,
        brand: p.brand ? { id: p.brand.id, name: p.brand.name } : null,
        color: p.color ? { id: p.color.id, name: p.color.name } : null,
        capacity: p.capacity
          ? { id: p.capacity.id, name: p.capacity.name }
          : null,
        warranty: p.warranty
          ? { id: p.warranty.id, name: p.warranty.name }
          : null,
        productModel: p.productModel
          ? { id: p.productModel.id, name: p.productModel.name }
          : null,
        processor: p.processor
          ? { id: p.processor.id, name: p.processor.name }
          : null,
        ramOption: p.ramOption
          ? { id: p.ramOption.id, name: p.ramOption.name }
          : null,
        storageType: p.storageType
          ? { id: p.storageType.id, name: p.storageType.name }
          : null,
        graphicsCard: p.graphicsCard
          ? { id: p.graphicsCard.id, name: p.graphicsCard.name }
          : null,
        breed: p.breed ? { id: p.breed.id, name: p.breed.name } : null,
        ageRange: p.ageRange
          ? { id: p.ageRange.id, name: p.ageRange.name }
          : null,
        gender: p.gender ? { id: p.gender.id, name: p.gender.name } : null,
        engineCapacity: p.engineCapacity
          ? { id: p.engineCapacity.id, name: p.engineCapacity.name }
          : null,
        productStatus: p.productStatus
          ? { id: p.productStatus.id, name: p.productStatus.name }
          : null,

        dealType: p.dealType
          ? { id: p.dealType.id, name: p.dealType.name }
          : null,
        condition: p.condition
          ? { id: p.condition.id, name: p.condition.name }
          : null,

        category: p.category
          ? {
            id: p.category.id,
            name: p.category.name,
            image: p.category.image,
            hot: p.category.hot,
          }
          : null,
        subCategory: p.subCategory
          ? {
            id: p.subCategory.id,
            name: p.subCategory.name,
            parent_category_id: p.subCategory.parent_category_id,
            source_table: p.subCategory.source_table,
            source_id: p.subCategory.source_id,
          }
          : null,

        category_change: p.category_change
          ? {
            id: p.category_change.id,
            name: p.category_change.name,
            image: p.category_change.image,
          }
          : null,
        sub_category_change: p.sub_category_change
          ? {
            id: p.sub_category_change.id,
            name: p.sub_category_change.name,
            parent_category_id: p.sub_category_change.parent_category_id,
            source_table: p.sub_category_change.source_table,
            source_id: p.sub_category_change.source_id,
          }
          : null,

        images:
          p.images?.map((img) => ({
            id: img.id,
            product_id: img.product_id,
            name: img.name,
            image_url: img.image_url,
            created_at: img.created_at,
          })) || [],
        imageCount: p.images?.length || 0,

        deal_type_id: p.deal_type_id,
        category_id: p.category_id,
        sub_category_id: p.sub_category_id,
        category_change_id: p.category_change_id,
        sub_category_change_id: p.sub_category_change_id,
        status_id: p.status_id,
        visibility_type:
          p.visibility_type != null ? Number(p.visibility_type) : 0,
        group_id: p.group_id || p.group?.id || null,
        group: p.group
          ? { id: p.group.id, name: p.group.name, isPublic: p.group.isPublic }
          : null,

        address_json: p.address_json,
        location: this.formatAddress(p.address_json),
        tag,
        created_at: p.created_at,
        updated_at: p.updated_at,
        expires_at: p.expires_at,
        isFavorite: userId ? favoriteProductIds.includes(p.id) : false,
      };
    });
  }

  // Format 1 sản phẩm đơn lẻ
  async formatProduct(p: Product): Promise<any> {
    const [result] = await this.formatProducts([p]);
    return result;
  }

  // 🔧 Format địa chỉ
  private formatAddress(addressJson: any): string {
    try {
      const addr =
        typeof addressJson === 'string' ? JSON.parse(addressJson) : addressJson;
      if (addr.full) return addr.full; // Ưu tiên trường "full"
      const parts = [addr.ward, addr.district, addr.province].filter(Boolean);
      return parts.length > 0 ? parts.join(', ') : 'Không rõ địa chỉ';
    } catch {
      return 'Không rõ địa chỉ';
    }
  }

  async getSourceDetail(subCategory: SubCategory): Promise<any> {
    if (!subCategory.source_table || !subCategory.source_id) {
      return null; // Nếu thiếu thông tin thì bỏ qua
    }

    switch (subCategory.source_table) {
      case 'fashion_categories':
        return await this.fashionRepo.findOne({
          where: { id: subCategory.source_id },
        });
      case 'game_categories':
        return await this.gameRepo.findOne({
          where: { id: subCategory.source_id },
        });
      case 'academic_categories':
        return await this.academicRepo.findOne({
          where: { id: subCategory.source_id },
        });
      case 'animal_categories':
        return await this.animalRepo.findOne({
          where: { id: subCategory.source_id },
        });
      case 'electronic_categories':
        return await this.electronicRepo.findOne({
          where: { id: subCategory.source_id },
        });
      case 'house_categories':
        return await this.houseRepo.findOne({
          where: { id: subCategory.source_id },
        });
      case 'vehicle_categories':
        return await this.vehicleRepo.findOne({
          where: { id: subCategory.source_id },
        });
      default:
        return null;
    }
  }
  async findById(id: number, userId?: number): Promise<any> {
    const product = await this.productRepo.findOne({
      where: { id },
      relations: [
        'images',
        'user',
        'dealType',
        'condition',
        'category',
        'subCategory',
        'category_change',
        'sub_category_change',
        'postType',
        'productType',
        'origin',

        'size',
        'brand',
        'color',
        'capacity',
        'warranty',
        'productModel',
        'processor',
        'ramOption',
        'storageType',
        'graphicsCard',
        'engineCapacity',
        'breed',
        'ageRange',
        'gender',
        'engineCapacity',
        'productStatus',
        'group',
      ],
    });

    if (!product) return null;

    // Kiểm tra quyền xem nếu là bài đăng của nhóm
    if (Number(product.visibility_type) === 1 && product.group_id) {
      if (!userId) {
        throw new ForbiddenException('Bạn phải đăng nhập để xem bài viết của nhóm này');
      }
      const isMember = await this.groupService.isMember(product.group_id, userId);
      if (!isMember) {
        throw new ForbiddenException('Bạn không phải là thành viên của nhóm này nên không thể xem bài viết');
      }
    }

    return await this.formatProduct(product);
  }

  // 🟢 Lấy sản phẩm liên quan
  async findRelatedProducts(
    currentProductId: number,
    categoryId: number,
    subCategoryId: number,
    limit: number = 8,
  ): Promise<any[]> {
    // Ưu tiên 1: Lấy theo subCategory (liên quan nhất)
    let products = await this.productRepo.find({
      where: {
        sub_category_id: subCategoryId,
        product_status_id: 2,
        id: Not(currentProductId),
      },
      relations: [
        'images',
        'user',
        'dealType',
        'condition',
        'category',
        'subCategory',
        'category_change',
        'sub_category_change',
        'postType',
        'productType',
        'origin',
        'material',
        'size',
        'brand',
        'color',
        'capacity',
        'warranty',
        'productModel',
        'processor',
        'ramOption',
        'storageType',
        'graphicsCard',
        'breed',
        'ageRange',
        'gender',
        'engineCapacity',
        'productStatus',
        'group',
      ],
      order: { created_at: 'DESC' },
      take: limit,
    });

    const needed = limit - products.length;

    // Nếu chưa đủ, lấy thêm ở category chính
    if (needed > 0) {
      const alreadyFoundIds = products.map((p) => p.id);
      const idsToExclude = [currentProductId, ...alreadyFoundIds];

      const categoryProducts = await this.productRepo.find({
        where: {
          category_id: categoryId,
          sub_category_id: Not(subCategoryId), // Không lấy trùng subCategory đã lấy ở trên
          product_status_id: 2,
          id: Not(In(idsToExclude)), // Loại trừ sản phẩm đang xem VÀ các sản phẩm đã tìm thấy
        },
        relations: [
          'images',
          'user',
          'dealType',
          'condition',
          'category',
          'subCategory',
          'category_change',
          'sub_category_change',
          'postType',
          'productType',
          'origin',
          'material',
          'size',
          'brand',
          'color',
          'capacity',
          'warranty',
          'productModel',
          'processor',
          'ramOption',
          'storageType',
          'graphicsCard',
          'breed',
          'ageRange',
          'gender',
          'engineCapacity',
          'productStatus',
          'group',
        ],
        order: { created_at: 'DESC' },
        take: needed,
      });

      products = [...products, ...categoryProducts];
    }

    return this.formatProducts(products);
  }

  // 🟢 Người dùng xem tất cả sản phẩm của chính họ
  async findByUserId(userId: number): Promise<any[]> {
    const products = await this.productRepo.find({
      where: { user: { id: userId } },
      order: { created_at: 'DESC' },
      relations: [
        'images',
        'user',
        'dealType',
        'condition',
        'category',
        'subCategory',
        'category_change',
        'sub_category_change',
        'postType',
        'productType',
        'origin',
        'material',
        'size',
        'brand',
        'color',
        'capacity',
        'warranty',
        'productModel',
        'processor',
        'ramOption',
        'storageType',
        'graphicsCard',
        'breed',
        'ageRange',
        'gender',
        'engineCapacity',
        'productStatus',
        'group',
      ],
    });

    return this.formatProducts(products);
  }

  async findAllForAdmin(): Promise<any[]> {
    const products = await this.productRepo.find({
      relations: [
        'images',
        'user',
        'dealType',
        'condition',
        'category',
        'subCategory',
        'category_change',
        'sub_category_change',
        'postType',
        'productType',
        'origin',
        'material',
        'size',
        'brand',
        'color',
        'capacity',
        'warranty',
        'productModel',
        'processor',
        'ramOption',
        'storageType',
        'graphicsCard',
        'breed',
        'ageRange',
        'gender',
        'engineCapacity',
        'productStatus',
        'group',
      ],
      order: { created_at: 'DESC' },
    });
    return this.formatProducts(products);
  }

  // Cập nhật trạng thái (Duyệt/Từ chối)
  async updateProductStatus(
    id: number,
    dto: UpdateProductStatusDto,
  ): Promise<Product> {
    const product = await this.productRepo.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!product) {
      throw new NotFoundException(`Không tìm thấy sản phẩm ID ${id}`);
    }

    product.product_status_id = dto.product_status_id; // Nếu admin đang duyệt (chuyển sang status 2)

    if (dto.product_status_id === 2) {
      const newExpiresAt = new Date();
      newExpiresAt.setDate(newExpiresAt.getDate() + 30); // + 30 ngày
      product.expires_at = newExpiresAt;
      this.logger.log(`Sản phẩm ID ${id} được duyệt, reset hạn 30 ngày.`);
    }

    const updatedProduct = await this.productRepo.save(product); // Thông báo

    if (dto.product_status_id === 2) {
      try {
        await this.notificationService.notifyFollowersOfNewPost(updatedProduct);
      } catch (err) {
        this.logger.error('Lỗi notifyFollowersOfNewPost:', err.message);
      }
      this.notificationService
        .notifyUserOfPostSuccess(updatedProduct)
        .catch((err) =>
          this.logger.error('Lỗi gửi thông báo duyệt bài:', err.message),
        );
    }

    //  GỬI THÔNG BÁO GỢI Ý
    if (dto.product_status_id === 2) {
      this.notifyMatchingPosts(updatedProduct.id);
    }

    if (Number(dto.product_status_id) !== 2) {
       await this.notificationService.deleteNotificationsByProductId(id);
    }
    
    return updatedProduct;
  }

  // hàm tìm kiếm


  async searchProducts(query: SearchProductDto) {
    const {
      name,
      description,
      minPrice,
      maxPrice,
      category,
      condition,
      sortBy = "created_at",
      sort = "desc",
      page = 1,
      limit = 20,
    } = query;

    const take = Math.min(Number(limit) || 20, 100);
    const skip = (Number(page) - 1) * take;

    const qb = this.productRepo
      .createQueryBuilder("product")
      .leftJoinAndSelect("product.images", "images")
      .leftJoinAndSelect("product.user", "user")
      .leftJoinAndSelect("product.category", "categoryTable")
      .leftJoinAndSelect("product.subCategory", "subCategory")
      .leftJoinAndSelect("product.condition", "conditionTable")
      .leftJoinAndSelect("product.dealType", "dealType")
      .leftJoinAndSelect("product.postType", "postType")
      .leftJoinAndSelect("product.brand", "brand")
      .leftJoinAndSelect("product.color", "color")
      .leftJoinAndSelect("product.size", "size")
      .leftJoinAndSelect("product.productStatus", "productStatus");



    qb.andWhere("productStatus.id = :statusId", { statusId: 2 });
    // ==================================================
    // 🔍 FILTER NAME
    // ==================================================
    if (name && name.trim().length >= 2) {
      qb.andWhere("LOWER(product.name) LIKE LOWER(:name)", {
        name: `%${name.trim()}%`,
      });
    }


    // 🔍 FILTER DESCRIPTION
    if (description && description.trim().length >= 2) {
      qb.andWhere("LOWER(product.description) LIKE LOWER(:des)", {
        des: `%${description.trim()}%`,
      });
    }
    // ==================================================
    // 💰 PRICE FILTER
    // ==================================================
    const min = Number(minPrice);
    const max = Number(maxPrice);

    if (!isNaN(min) && !isNaN(max) && min <= max) {
      qb.andWhere("product.price BETWEEN :min AND :max", { min, max });
    } else {
      if (!isNaN(min)) qb.andWhere("product.price >= :min", { min });
      if (!isNaN(max)) qb.andWhere("product.price <= :max", { max });
    }

    // ==================================================
    // 🏷 CATEGORY & SUBCATEGORY
    // ==================================================
    if (category?.trim()) {
      const cat = `%${category.trim().toLowerCase()}%`;

      qb.andWhere(
        "(LOWER(categoryTable.name) LIKE :cat OR LOWER(subCategory.name) LIKE :cat)",
        { cat }
      );
    }

    // ==================================================
    // 📌 CONDITION FILTER
    // ==================================================
    const validConditions = [
      "Mới 100%",
      "Cũ",
      "Đã qua sử dụng",
      "Miễn phí",
      "Trao đổi",
      "Mua bán",
    ];
    // 🔌 POST TYPE
    if (query.postType && query.postType.length > 0) {
      qb.andWhere("postType.name IN (:...postTypes)", { postTypes: query.postType });
    }

    // 🔌 DEAL TYPE
    if (query.dealType && query.dealType.length > 0) {
      qb.andWhere("dealType.name IN (:...dealTypes)", { dealTypes: query.dealType });
    }


    if (condition) {
      const condArray = Array.isArray(condition) ? condition : [condition];
      const filtered = condArray
        .map((c) => c.trim())
        .filter((c) => validConditions.includes(c));

      if (filtered.length > 0) {
        qb.andWhere("conditionTable.name IN (:...conds)", { conds: filtered });
      }
    }

    // ==================================================
    // 📌 SORT
    // ==================================================
    const sortableFields = {
      created_at: "product.created_at",
      price: "product.price",
    };

    const sortField =
      sortableFields[sortBy] ?? sortableFields["created_at"];

    qb.orderBy(sortField, sort.toUpperCase() === "ASC" ? "ASC" : "DESC");

    // ==================================================
    // 📌 PAGINATION
    // ==================================================
    qb.skip(skip).take(take);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: {
        page: Number(page),
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    };
  }


  //xóa vĩnh viễn
  async hardDeleteProduct(productId: number, reqUser: any): Promise<string> {
    this.logger.log(`🔍 DEBUG USER: ${JSON.stringify(reqUser)}`);
    const currentUser = await this.userRepo.findOne({
      where: { id: reqUser.id },
    });
    this.logger.log(`🔍 DEBUG CURRENT_USER DB: ${JSON.stringify(currentUser)}`);
    if (!currentUser) throw new UnauthorizedException('User không tồn tại');

    const product = await this.productRepo.findOne({
      where: { id: productId },
      relations: ['user', 'images', 'group'],
    });

    if (!product) {
      throw new NotFoundException(`Không tìm thấy sản phẩm ID ${productId}`);
    }

    const userAny = currentUser as any;
    const roleId = userAny.roleId ?? userAny.role_id;

    const isAdmin = Number(roleId) === 1;
    const isOwner = product.user && product.user.id === currentUser.id;

    if (!isOwner && !isAdmin) {
      throw new UnauthorizedException('Bạn không có quyền xóa sản phẩm này.');
    }

    await this.favoriteRepo.delete({ product: { id: productId } });

    // Xóa ảnh liên quan trước
    if (product.images && product.images.length > 0) {
      await this.imageRepo.remove(product.images);
    }

    await this.notificationService.deleteNotificationsByProductId(productId);

    // Xóa sản phẩm vĩnh viễn
    await this.productRepo.remove(product);

    this.logger.log(`🧨 Đã xóa vĩnh viễn sản phẩm ID=${productId}`);
    return `Đã xóa vĩnh viễn sản phẩm ID=${productId}`;
  }

  // @Cron(CronExpression.EVERY_10_SECONDS) //  EVERY_DAY_AT_1AM
  @Cron(CronExpression.EVERY_DAY_AT_1AM) //  EVERY_DAY_AT_1AM
  async handleExpiredProducts() {
    this.logger.log('[CRON] Bắt đầu quét các sản phẩm đã hết hạn...');
    const now = new Date();
    const ACTIVE_STATUS_ID = 2;
    const EXPIRED_STATUS_ID = 5;

    try {
      // BƯỚC 1: Phải tìm ra ID trước thì mới biết đường mà xóa thông báo
      const expiredProducts = await this.productRepo.find({
        where: {
          expires_at: LessThan(now),
          product_status_id: ACTIVE_STATUS_ID,
        },
        select: ['id'], // Chỉ lấy ID cho nhẹ
      });

      if (expiredProducts.length > 0) {
        const ids = expiredProducts.map((p) => p.id);

        // BƯỚC 2: Cập nhật trạng thái hàng loạt
        await this.productRepo.update(
          { id: In(ids) },
          { product_status_id: EXPIRED_STATUS_ID },
        );

        // BƯỚC 3: Xóa thông báo rác (Quan trọng)
        // Dùng Promise.all để chạy song song cho nhanh
        await Promise.all(
          ids.map((id) =>
            this.notificationService.deleteNotificationsByProductId(id),
          ),
        );

        this.logger.log(
          `[CRON] Đã hết hạn ${ids.length} sản phẩm và xóa các thông báo liên quan.`,
        );
      } else {
        this.logger.log(`[CRON] Không tìm thấy sản phẩm nào cần cập nhật.`);
      }
    } catch (error) {
      this.logger.error(
        '[CRON] Lỗi khi quét sản phẩm hết hạn: ',
        error.message,
      );
    }
  }

  /**
   * (Người dùng) Ẩn tin đang hiển thị
   * Chuyển Status 2 (Đã duyệt) -> 4 (Đã ẩn)
   */
  async hideProduct(productId: number, reqUser: any): Promise<Product> {
    const currentUser = await this.userRepo.findOne({
      where: { id: reqUser.id },
    });
    if (!currentUser) throw new UnauthorizedException('User không tồn tại');

    const product = await this.productRepo.findOne({
      where: { id: productId },
      relations: ['user', 'productStatus'],
    });
    if (!product) throw new NotFoundException('Không tìm thấy sản phẩm');

    const userAny = currentUser as any;
    const roleId = userAny.roleId ?? userAny.role_id;

    const isAdmin = Number(roleId) === 1;
    const isOwner = product.user && product.user.id === currentUser.id;

    if (!isOwner && !isAdmin) {
      throw new UnauthorizedException('Bạn không có quyền ẩn tin này');
    }

    if (product.product_status_id === 6) {
      throw new BadRequestException('Không thể ẩn sản phẩm đã bán.');
    }

    if (product.product_status_id !== 2) {
      throw new BadRequestException('Chỉ có thể ẩn tin đang hiển thị');
    }

    const hiddenStatus = await this.productStatusService.findOne(4); // ID 4 = "Đã ẩn"
    if (!hiddenStatus)
      throw new Error('Lỗi CSDL: Không tìm thấy trạng thái "Đã ẩn"');

    product.productStatus = hiddenStatus;
    const savedProduct = await this.productRepo.save(product);

    await this.notificationService.deleteNotificationsByProductId(productId);

    return savedProduct;
  }

  // (Người dùng) Hiện lại tin đã ẩn
  async unhideProduct(productId: number, reqUser: any): Promise<Product> {
    const currentUser = await this.userRepo.findOne({
      where: { id: reqUser.id },
    });
    if (!currentUser) throw new UnauthorizedException('User không tồn tại');

    const product = await this.productRepo.findOne({
      where: { id: productId },
      relations: ['user'],
    });

    if (!product) throw new NotFoundException('Không tìm thấy sản phẩm');

    const userAny = currentUser as any;
    const roleId = userAny.roleId ?? userAny.role_id;

    const isAdmin = Number(roleId) === 1;
    const isOwner = product.user && product.user.id === currentUser.id;

    if (!isOwner && !isAdmin) {
      throw new UnauthorizedException('Bạn không có quyền hiện lại tin này');
    }

    // Chỉ cho phép hiện lại tin "Đã ẩn"
    if (product.product_status_id !== 4) {
      throw new BadRequestException('Tin này không ở trạng thái "Đã ẩn"');
    }

    // Lấy trạng thái "Đã duyệt" (ID 2)
    const approvedStatus = await this.productStatusService.findOne(2); // ID 2 = "Đã duyệt"
    if (!approvedStatus)
      throw new Error('Lỗi CSDL: Không tìm thấy trạng thái "Đã duyệt"');

    product.productStatus = approvedStatus;

    const savedProduct = await this.productRepo.save(product);

    this.notifyMatchingPosts(savedProduct.id);

    return savedProduct;
  }

  /**
   * (Người dùng) Đánh dấu đã bán
   * Chuyển Status 2 (Đã duyệt) -> 6 (Đã bán)
   */
  async markAsSold(productId: number, userId: number): Promise<Product> {
    const product = await this.productRepo.findOne({
      where: { id: productId },
      relations: ['user', 'productStatus'], // Thêm 'productStatus'
    });

    if (!product) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }
    if (product.user?.id !== userId) {
      throw new UnauthorizedException('Bạn không có quyền đánh dấu tin này');
    }

    // Chỉ cho phép đánh dấu bán tin đang "Đã duyệt"
    if (product.product_status_id !== 2) {
      throw new BadRequestException(
        'Chỉ có thể đánh dấu đã bán cho tin đang hiển thị',
      );
    }

    const soldStatus = await this.productStatusService.findOne(6); // ID 6 = "Đã bán"
    if (!soldStatus) {
      throw new Error('Lỗi CSDL: Không tìm thấy trạng thái "Đã bán"');
    }

    product.productStatus = soldStatus;
    // Hoặc bạn có thể dùng: product.product_status_id = 6;

    const savedProduct = await this.productRepo.save(product);

    await this.notificationService.deleteNotificationsByProductId(productId);

    return savedProduct;
  }

  //(Người dùng) Gửi yêu cầu gia hạn cho tin đã hết hạn (Status 5)
  //Chỉ gửi thông báo cho Admin, không đổi status
  async requestExtension(
    productId: number,
    userId: number,
    reason: string,
  ): Promise<Product> {
    // 👈 Sửa: Trả về Product (thay vì { message: string })
    const product = await this.productRepo.findOne({
      where: { id: productId },
      relations: ['user'],
    });
    if (!product) throw new NotFoundException('Không tìm thấy sản phẩm');
    if (product.user?.id !== userId)
      throw new UnauthorizedException('Bạn không có quyền gia hạn tin này');

    if (product.product_status_id !== 5) {
      throw new BadRequestException(
        'Chỉ có thể yêu cầu gia hạn tin đã hết hạn',
      );
    } // Định nghĩa các lý do hợp lệ của bạn

    const VALID_REASONS = [
      'Sản phẩm chưa bán được',
      'Sản phẩm đã giảm giá',
      'Muốn làm mới tin đăng',
      'Lý do khác',
    ];

    if (!reason || !VALID_REASONS.includes(reason)) {
      throw new BadRequestException('Lý do gia hạn không hợp lệ');
    } // 1. Lấy trạng thái "Chờ duyệt" (ID 1)

    const pendingStatus = await this.productStatusService.findOne(1);
    if (!pendingStatus)
      throw new Error('Lỗi CSDL: Không tìm thấy trạng thái "Chờ duyệt"'); // 2. Cập nhật trạng thái

    product.productStatus = pendingStatus;

    const savedProduct = await this.productRepo.save(product); // 3. Gửi thông báo cho Admin (tái sử dụng hàm cũ)

    this.notificationService
      .notifyAdminsOfNewPost(savedProduct)
      .catch((err) =>
        this.logger.error(
          'Lỗi (từ service) notifyAdmins (sau khi gia hạn):',
          err.message,
        ),
      ); // 4. Trả về sản phẩm đã cập nhật (để frontend dùng)

    return savedProduct;
  }

  // (ADMIN) Duyệt gia hạn
  // Chuyển Status 5 (Hết hạn) -> 2 (Đã duyệt)
  // Reset 'created_at' để bắt đầu lại 30 ngày
  async approveExtension(productId: number): Promise<Product> {
    // LƯU Ý: HÀM NÀY PHẢI ĐƯỢC BẢO VỆ BẰNG ADMIN GUARD TRONG CONTROLLER
    const product = await this.productRepo.findOne({
      where: { id: productId },
      relations: ['user'],
    });
    if (!product) throw new NotFoundException('Không tìm thấy sản phẩm'); // Chỉ duyệt gia hạn cho tin "Hết hạn"

    if (product.product_status_id !== 5) {
      throw new BadRequestException('Tin này không ở trạng thái "Hết hạn"');
    }

    const approvedStatus = await this.productStatusService.findOne(2); // ID 2 = "Đã duyệt"

    if (!approvedStatus)
      throw new Error('Lỗi CSDL: Không tìm thấy trạng thái "Đã duyệt"');

    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 30); // 30 ngày
    // newExpiresAt.setSeconds(newExpiresAt.getSeconds() + 30); // 30s

    product.productStatus = approvedStatus;
    product.expires_at = newExpiresAt;

    const savedProduct = await this.productRepo.save(product);

    this.notificationService
      .notifyUserOfPostSuccess(savedProduct)
      .catch((err) =>
        this.logger.error('Lỗi gửi thông báo duyệt gia hạn:', err.message),
      );

    //  GỬI THÔNG BÁO GỢI Ý
    this.notifyMatchingPosts(savedProduct.id);

    return savedProduct;
  }

  // (Người dùng) Cập nhật tin đăng
  async updateProduct(
    productId: number,
    userId: number,
    data: Partial<CreateProductDto>,
    files?: Express.Multer.File[],
  ): Promise<Product> {
    const product = await this.productRepo.findOne({
      where: { id: productId },
      relations: [
        'images',
        'user',
        'dealType',
        'condition',
        'category',
        'subCategory',
        'category_change',
        'sub_category_change',
        'postType',
        'productType',
        'origin',
        'material',
        'size',
        'brand',
        'color',
        'capacity',
        'warranty',
        'productModel',
        'processor',
        'ramOption',
        'storageType',
        'graphicsCard',
        'breed',
        'ageRange',
        'gender',
        'engineCapacity',
        'productStatus',
        'group',
      ],
    });

    if (!product) {
      throw new NotFoundException(`Không tìm thấy sản phẩm ID ${productId}`);
    }
    if (product.user?.id !== userId) {
      throw new UnauthorizedException('Bạn không có quyền sửa sản phẩm này.');
    }
    if (product.product_status_id === 6) {
      throw new BadRequestException('Không thể chỉnh sửa sản phẩm đã bán.');
    }
    // === 1. XỬ LÝ XÓA ẢNH ===
    if (data.imageIdsToDelete) {
      try {
        const idsToDelete: number[] = JSON.parse(data.imageIdsToDelete as any);
        if (idsToDelete && idsToDelete.length > 0) {
          this.logger.log(`Xóa ${idsToDelete.length} ảnh cho SP ${productId}`);
          await this.imageRepo.delete({
            id: In(idsToDelete),
            product_id: productId,
          });
        }
      } catch (e) {
        this.logger.error('Lỗi khi parse imageIdsToDelete', e.message);
      }
      delete data.imageIdsToDelete;
    }

    // === 2. BỎ QUA SỬA DANH MỤC ===
    if (data.category_id || data.sub_category_id) {
      this.logger.warn(
        `Người dùng ${userId} đã cố gắng sửa category của sản phẩm ${productId}. Đã bỏ qua.`,
      );
      delete data.category_id;
      delete data.sub_category_id;
    }

    // === 3. CẬP NHẬT CÁC TRƯỜNG ĐƠN GIẢN ===
    Object.assign(product, {
      name: data.name ?? product.name,
      description: data.description ?? product.description,
      price: data.price ? Number(data.price) : product.price,
      mileage: data.mileage ? Number(data.mileage) : product.mileage,
      year: data.year ? Number(data.year) : product.year,
      author: data.author ?? product.author,
      address_json: data.address_json
        ? JSON.parse(data.address_json as any)
        : product.address_json,
    });

    if (data.deal_type_id !== undefined) {
      const dealType = await this.dealTypeRepo.findOneBy({
        id: Number(data.deal_type_id),
      });
      if (!dealType) {
        throw new NotFoundException(
          `Không tìm thấy DealType ID ${data.deal_type_id}`,
        );
      }
      product.dealType = dealType;

      // Reset giá nếu cần
      if ([2, 3].includes(Number(data.deal_type_id))) {
        product.price = 0;
      }
    }
    this.logger.log(`deal_type_id nhận được: ${data.deal_type_id}`);
    this.logger.log(`DealType hiện tại: ${product.dealType?.id}`);

    if (
      data.post_type_id &&
      Number(data.post_type_id) !== product.postType?.id
    ) {
      const postType = await this.postTypeRepo.findOneBy({
        id: data.post_type_id,
      });
      if (!postType) {
        throw new NotFoundException(
          `Không tìm thấy PostType ID ${data.post_type_id}`,
        );
      }
      product.postType = postType;
    }

    // --- 4b. Xử lý Condition (Tùy chọn) ---
    if (data.condition_id !== undefined) {
      product.condition = data.condition_id
        ? await this.conditionRepo.findOneBy({ id: data.condition_id })
        : null;
    }

    if (data.brand_id !== undefined) {
      product.brand = data.brand_id
        ? await this.brandService.findOne(data.brand_id)
        : null;
    }

    if (data.color_id !== undefined) {
      product.color = data.color_id
        ? await this.colorService.findOne(data.color_id)
        : null;
    }

    if (data.size_id !== undefined) {
      product.size = data.size_id
        ? await this.sizeService.findOne(data.size_id)
        : null;
    }

    if (data.origin_id !== undefined) {
      product.origin = data.origin_id
        ? await this.originService.findOne(data.origin_id)
        : null;
    }

    if (data.material_id !== undefined) {
      product.material = data.material_id
        ? await this.materialService.findOne(data.material_id)
        : null;
    }

    if (data.capacity_id !== undefined) {
      product.capacity = data.capacity_id
        ? await this.capacityService.findOne(data.capacity_id)
        : null;
    }

    if (data.warranty_id !== undefined) {
      product.warranty = data.warranty_id
        ? await this.warrantyService.findOne(data.warranty_id)
        : null;
    }

    if (data.processor_id !== undefined) {
      product.processor = data.processor_id
        ? await this.processorService.findOne(data.processor_id)
        : null;
    }

    if (data.ram_option_id !== undefined) {
      product.ramOption = data.ram_option_id
        ? await this.ramOptionService.findOne(data.ram_option_id)
        : null;
    }

    if (data.storage_type_id !== undefined) {
      product.storageType = data.storage_type_id
        ? await this.storageTypeService.findOne(data.storage_type_id)
        : null;
    }

    if (data.graphics_card_id !== undefined) {
      product.graphicsCard = data.graphics_card_id
        ? await this.graphicsCardService.findOne(data.graphics_card_id)
        : null;
    }

    if (data.breed_id !== undefined) {
      product.breed = data.breed_id
        ? await this.breedService.findOne(data.breed_id)
        : null;
    }

    if (data.age_range_id !== undefined) {
      product.ageRange = data.age_range_id
        ? await this.ageRangeService.findOne(data.age_range_id)
        : null;
    }

    if (data.gender_id !== undefined) {
      product.gender = data.gender_id
        ? await this.genderService.findOne(data.gender_id)
        : null;
    }

    if (data.engine_capacity_id !== undefined) {
      product.engineCapacity = data.engine_capacity_id
        ? await this.engineCapacityService.findOne(data.engine_capacity_id)
        : null;
    }

    if (data.product_model_id !== undefined) {
      product.productModel = data.product_model_id
        ? await this.productModelService.findOne(data.product_model_id)
        : null;
    }

    if (data.product_type_id !== undefined) {
      product.productType = data.product_type_id
        ? await this.productTypeService.findOne(data.product_type_id)
        : null;
    }

    // Các trường category_change và sub_category_change (nếu có)
    if (data.category_change_id !== undefined) {
      product.category_change = data.category_change_id
        ? await this.categoryRepo.findOneBy({ id: data.category_change_id })
        : null;
    }

    if (data.sub_category_change_id !== undefined) {
      product.sub_category_change = data.sub_category_change_id
        ? await this.subCategoryRepo.findOneBy({
          id: data.sub_category_change_id,
        })
        : null;
    }

    if (data.visibility_type !== undefined) {
      const vis = Number(data.visibility_type);
      product.visibility_type = vis;

      if (vis === 0) {
        // 1. Nếu chọn "Toàn trường" -> Xóa sạch quan hệ nhóm
        product.group_id = null;
        product.group = null;
      } else if (vis === 1 && data.group_id) {
        // 2. Nếu chọn "Nhóm" -> Phải tìm Group Entity và gán vào
        const newGroupId = Number(data.group_id);
        product.group_id = newGroupId;

        // Gọi GroupService để lấy thông tin nhóm
        const groupEntity = await this.groupService.findOneById(newGroupId);
        if (groupEntity) {
          product.group = groupEntity;
        }
      }
    }

    // === 5. CHUYỂN VỀ CHỜ DUYỆT ===
    const pendingStatus = await this.productStatusService.findOne(1);
    if (!pendingStatus) {
      throw new Error('Lỗi CSDL: Không tìm thấy trạng thái "Chờ duyệt"');
    }
    product.productStatus = pendingStatus;

    const updatedProduct = await this.productRepo.save(product);

    await this.notificationService.deleteNotificationsByProductId(
      updatedProduct.id,
    );

    // === 6. LƯU ẢNH MỚI (NẾU CÓ) ===
    if (files && files.length > 0) {
      const imagesToSave = files.map((file) =>
        this.imageRepo.create({
          product: { id: updatedProduct.id },
          name: updatedProduct.name,
          image_url: file.path,
        }),
      );
      await this.imageRepo.save(imagesToSave);
      this.logger.log(
        `🖼️ Đã LƯU MỚI ${imagesToSave.length} ảnh cho sản phẩm ID=${updatedProduct.id}`,
      );
    }

    const fullProduct = await this.productRepo.findOne({
      where: { id: updatedProduct.id },
      relations: [
        'images',
        'user',
        'dealType',
        'condition',
        'category',
        'subCategory',
        'category_change',
        'sub_category_change',
        'postType',
        'productType',
        'origin',
        'material',
        'size',
        'brand',
        'color',
        'capacity',
        'warranty',
        'productModel',
        'processor',
        'ramOption',
        'storageType',
        'graphicsCard',
        'breed',
        'ageRange',
        'gender',
        'engineCapacity',
        'productStatus',
        'group',
      ],
    });

    if (!fullProduct) throw new Error('Không tìm thấy sản phẩm sau khi lưu.');

    return this.formatProduct(fullProduct);
  }

  // Lấy danh sách sản phẩm miễn phí (loại bỏ sản phẩm do chính user đăng)
  async findFreeProductsExcludeUser(userId: number): Promise<any[]> {
    const products = await this.productRepo.find({
      where: {
        product_status_id: 2, // Đã duyệt
        user: {
          id: Not(userId),
        },
        dealType: {
          name: 'Miễn phí',
        },
      },
      relations: [
        'images',
        'user',
        'dealType',
        'condition',
        'category',
        'subCategory',
        'category_change',
        'sub_category_change',
        'postType',
        'productType',
        'origin',
        'material',
        'size',
        'brand',
        'color',
        'capacity',
        'warranty',
        'productModel',
        'processor',
        'ramOption',
        'storageType',
        'graphicsCard',
        'breed',
        'ageRange',
        'gender',
        'engineCapacity',
        'productStatus',
      ],
      order: { created_at: 'DESC' },
    });

    // Lọc sản phẩm có dealType = "Miễn phí" và không phải của user hiện tại
    const filtered = products.filter(
      (p) => p.dealType?.name === 'Miễn phí' && p.user?.id !== userId,
    );

    return this.formatProducts(filtered, userId);
  }

  // Lấy danh sách sản phẩm trao đổi (loại bỏ sản phẩm do chính user đăng)
  async findExchangeProductsExcludeUser(userId: number): Promise<any[]> {
    const products = await this.productRepo.find({
      where: {
        product_status_id: 2, // Đã duyệt

        user: {
          id: Not(userId),
        },
        dealType: {
          name: 'Trao đổi',
        },
      },
      relations: [
        'images',
        'user',
        'dealType',
        'condition',
        'category',
        'subCategory',
        'category_change',
        'sub_category_change',
        'postType',
        'productType',
        'origin',
        'material',
        'size',
        'brand',
        'color',
        'capacity',
        'warranty',
        'productModel',
        'processor',
        'ramOption',
        'storageType',
        'graphicsCard',
        'breed',
        'ageRange',
        'gender',
        'engineCapacity',
        'productStatus',
      ],
      order: { created_at: 'DESC' },
    });

    // Lọc sản phẩm có dealType = "Trao đổi" và không phải của user hiện tại
    const filtered = products.filter(
      (p) => p.dealType?.name === 'Trao đổi' && p.user?.id !== userId,
    );

    return this.formatProducts(filtered, userId);
  }



  /**
   * Lấy "Feed Gợi ý" cá nhân hóa cho user:
   * 1. Tìm tất cả danh mục con (subCategory) mà user này đã từng đăng.
   * 2. Với mỗi danh mục đó, gọi hàm suggestForSelling và suggestForBuying.
   */
  async getSuggestionFeed(userId: number): Promise<any[]> {
    this.logger.log(`Đang lấy feed gợi ý cá nhân hóa cho userId: ${userId}`);

    // 1. Lấy danh sách các subCategory mà user đã từng đăng bài
    const distinctSubCategories = await this.productRepo
      .createQueryBuilder('product')
      .select('product.sub_category_id', 'id')
      .addSelect('subCategory.name', 'name')
      .leftJoin('product.subCategory', 'subCategory')
      .where('product.user.id = :userId', { userId })
      .andWhere('product.sub_category_id IS NOT NULL')
      .groupBy('product.sub_category_id')
      .addGroupBy('subCategory.name')
      .getRawMany();

    if (distinctSubCategories.length === 0) {
      return [];
    }

    const feedResults: any[] = [];

    // 2. Duyệt qua từng danh mục
    for (const subCat of distinctSubCategories) {
      const subCatId = subCat.id;
      if (!subCatId) continue;

      let sellingSuggestions: Product[] = [];
      let buyingSuggestions: Product[] = [];

      // --- SỬA ĐỔI TỪ ĐÂY: Dùng count thay vì findOne ---

      // Check 1: User có bài ĐĂNG BÁN (id=1) nào trong danh mục này không?
      const hasSellingPost = await this.productRepo.count({
        where: {
          user: { id: userId },
          subCategory: { id: subCatId },
          postType: { id: 1 }, // 1 là Đăng bán
        },
      });

      // Check 2: User có bài ĐĂNG MUA (id=2) nào trong danh mục này không?
      const hasBuyingPost = await this.productRepo.count({
        where: {
          user: { id: userId },
          subCategory: { id: subCatId },
          postType: { id: 2 }, // 2 là Đăng mua
        },
      });

      // --- XỬ LÝ LOGIC ---

      // Nếu có bài Bán -> Cần tìm người Mua -> Gọi suggestForSelling
      if (hasSellingPost > 0) {
        sellingSuggestions = await this.suggestForSelling(subCatId, userId);
      }

      // Nếu có bài Mua -> Cần tìm người Bán -> Gọi suggestForBuying
      if (hasBuyingPost > 0) {
        buyingSuggestions = await this.suggestForBuying(subCatId, userId);
      }

      // Luôn push vào kết quả để Frontend xử lý hiển thị (dù mảng rỗng)
      feedResults.push({
        subCategory: { id: subCatId, name: subCat.name },
        sellingSuggestions: sellingSuggestions,
        buyingSuggestions: buyingSuggestions,
      });
    }

    return feedResults;
  }

  async autoSuggest(subCategoryId: number, userId: number) {
    // Lấy bài đăng gần nhất của user theo danh mục
    const lastPost = await this.productRepo.findOne({
      where: {
        user: { id: userId },
        subCategory: { id: subCategoryId },
      },
      order: { created_at: 'DESC' },
      relations: ['postType'],
    });

    if (!lastPost) return [];

    // Nếu user đăng BÁN (postType = 1) => trả về người CẦN MUA
    if (lastPost.postType.id === 1) {
      return this.suggestForSelling(subCategoryId, userId);
    }

    // Nếu user đăng MUA (postType = 2) => trả về người ĐANG BÁN
    if (lastPost.postType.id === 2) {
      return this.suggestForBuying(subCategoryId, userId);
    }

    return [];
  }

  // --- Gợi ý AI ---
  private buildProductTextForAI(p: Product): string {
    return `${p.name} ${p.description} ${p.price} ${p.condition?.name || ''} ${p.brand?.name || ''}`;
  }

  async suggestForSelling(subCategoryId: number, userId: number) {
    const candidates = await this.productRepo.find({
      where: {
        sub_category_id: subCategoryId,
        post_type_id: 2, // Đăng mua
        user_id: Not(userId),
        product_status_id: 2,
        receive_suggestions: true,
      },
      relations: ['user', 'condition', 'brand', 'images', 'category', 'subCategory', 'dealType', 'postType'],
    });

    if (!candidates.length) return [];

    const targetProduct = await this.productRepo.findOne({
      where: { sub_category_id: subCategoryId, user_id: userId, post_type_id: 1 },
      order: { created_at: 'DESC' },
      relations: ['condition', 'brand']
    });

    if (!targetProduct) return await this.formatProducts(candidates);

    const targetText = this.buildProductTextForAI(targetProduct);
    const candidatePayload = candidates.map(c => ({ id: c.id, text: this.buildProductTextForAI(c) }));

    try {
      const aiResponse = await this.aiService.matchProducts(targetText, candidatePayload);
      if (aiResponse?.success && aiResponse.data?.matches) {
        const matches = aiResponse.data.matches;
        // Lấy các kết quả có similarity >= 0.3
        const sortedCandidates = matches
          .filter((m: any) => m.similarity >= 0.3)
          .map((m: any) => candidates.find(c => c.id === m.id))
          .filter(Boolean);
        return await this.formatProducts(sortedCandidates.slice(0, 10));
      }
    } catch (e) {
      this.logger.error('Lỗi khi gọi AI matchProducts:', e);
    }
    
    return await this.formatProducts(candidates);
  }

  async suggestForBuying(subCategoryId: number, userId: number) {
    const candidates = await this.productRepo.find({
      where: {
        sub_category_id: subCategoryId,
        post_type_id: 1, // Đăng bán
        user_id: Not(userId),
        product_status_id: 2,
        receive_suggestions: true,
      },
      relations: ['user', 'condition', 'brand', 'images', 'category', 'subCategory', 'dealType', 'postType'],
    });

    if (!candidates.length) return [];

    const targetProduct = await this.productRepo.findOne({
      where: { sub_category_id: subCategoryId, user_id: userId, post_type_id: 2 },
      order: { created_at: 'DESC' },
      relations: ['condition', 'brand']
    });

    if (!targetProduct) return await this.formatProducts(candidates);

    const targetText = this.buildProductTextForAI(targetProduct);
    const candidatePayload = candidates.map(c => ({ id: c.id, text: this.buildProductTextForAI(c) }));

    try {
      const aiResponse = await this.aiService.matchProducts(targetText, candidatePayload);
      if (aiResponse?.success && aiResponse.data?.matches) {
        const matches = aiResponse.data.matches;
        const sortedCandidates = matches
          .filter((m: any) => m.similarity >= 0.3)
          .map((m: any) => candidates.find(c => c.id === m.id))
          .filter(Boolean);
        return await this.formatProducts(sortedCandidates.slice(0, 10));
      }
    } catch (e) {
      this.logger.error('Lỗi khi gọi AI matchProducts:', e);
    }
    
    return await this.formatProducts(candidates);
  }


  // src/product/product.service.ts

  async notifyMatchingPosts(productId: number) {
    try {
      console.log(`-------------- START CHECK MATCHING FOR PRODUCT ${productId} --------------`);
      const product = await this.productRepo.findOne({
        where: { id: productId },
        relations: ['subCategory', 'postType', 'user', 'condition', 'brand'],
      });

      if (!product || !product.user || !product.subCategory) return;

      const oppositePostType = product.postType?.id === 1 ? 2 : 1;
      
      const candidates = await this.productRepo.find({
        where: {
          sub_category_id: product.subCategory.id,
          post_type_id: oppositePostType,
          product_status_id: 2,
          user: { id: Not(product.user.id) },
          receive_suggestions: true,
        },
        relations: ['user', 'condition', 'brand'],
      });

      if (candidates.length === 0) return;

      const targetText = this.buildProductTextForAI(product);
      const candidatePayload = candidates.map(c => ({ id: c.id, text: this.buildProductTextForAI(c) }));

      try {
        const aiResponse = await this.aiService.matchProducts(targetText, candidatePayload);
        if (aiResponse?.success && aiResponse.data?.matches) {
          const matches = aiResponse.data.matches.filter((m: any) => m.similarity >= 0.5);
          
          if (matches.length > 0) {
            const userIdsToNotify = [...new Set(
              matches
                .map((m: any) => candidates.find(c => c.id === m.id)?.user?.id)
                .filter(Boolean)
            )] as number[];

            if (userIdsToNotify.length > 0) {
              await this.notificationService.notifyMatchingUsers(product, userIdsToNotify);
            }
          }
        }
      } catch (aiErr) {
        this.logger.error('AI Matching failed in notifyMatchingPosts', aiErr);
      }
      console.log(`-------------- END CHECK --------------`);
    } catch (error) {
      this.logger.error(`Lỗi trong notifyMatchingPosts: ${error.message}`);
    }
  }

  // --- Hết hạn gợi ý 30 ngày ---
  async getExpiringInterests(userId: number) {
    // Tìm các bài đăng của user này có receive_suggestions = true, 
    // và tuổi thọ > 30 ngày kể từ (suggestions_last_asked_at HOẶC created_at)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const qb = this.productRepo.createQueryBuilder('product')
      .where('product.user_id = :userId', { userId })
      .andWhere('product.receive_suggestions = :recv', { recv: true })
      .andWhere(`
        (product.suggestions_last_asked_at IS NOT NULL AND product.suggestions_last_asked_at <= :date)
        OR
        (product.suggestions_last_asked_at IS NULL AND product.created_at <= :date)
      `, { date: thirtyDaysAgo })
      .orderBy('product.created_at', 'DESC');

    const products = await qb.getMany();
    return this.formatProducts(products);
  }

  async renewInterest(productId: number, userId: number, keepSuggesting: boolean) {
    const product = await this.productRepo.findOne({ where: { id: productId, user_id: userId }});
    if (!product) throw new NotFoundException('Không tìm thấy sản phẩm');

    product.receive_suggestions = keepSuggesting;
    product.suggestions_last_asked_at = new Date();
    await this.productRepo.save(product);

    return { success: true };
  }
}
