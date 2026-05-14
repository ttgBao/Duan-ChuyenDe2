import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ProductImage } from './product-image.entity';
import { DealType } from './deal-type.entity';
import { Condition } from './condition.entity';
import { Category } from './category.entity';
import { SubCategory } from './sub-category.entity';
import { Report } from './report.entity';
import { User } from './user.entity';
import { ProductType } from './product_types.entity';
import { PostType } from './post-type.entity';
import { Comment } from './comment.entity';
import { Group } from './group.entity';
import { Origin } from './origin.entity';
import { Material } from './material.entity';
import { Size } from './size.entity';
import { Brand } from './brand.entity';
import { Color } from './color.entity';
import { Warranty } from './warranty.entity';
import { Capacity } from './capacity.entity';
import { ProductModel } from './product-model.entity';
import { Processor } from './processor.entity';
import { RamOption } from './ram-option.entity';
import { GraphicsCard } from './graphics-card.entity';
import { StorageType } from './storage-type.entity';
import { Breed } from './breed.entity';
import { AgeRange } from './age-range.entity';
import { Gender } from './gender.entity';
import { EngineCapacity } from './engine-capacity.entity';
import { ProductStatus } from './product-status.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 191, default: '' })
  name: string;

  @Column({ name: 'product_type_id', type: 'bigint', nullable: true })
  product_type_id: number | null;

  @ManyToOne(() => ProductType, { nullable: true })
  @JoinColumn({ name: 'product_type_id', referencedColumnName: 'id' })
  productType: ProductType | null;

  @Column({ name: 'origin_id', type: 'bigint', nullable: true })
  origin_id: number | null;

  @ManyToOne(() => Origin, { nullable: true })
  @JoinColumn({ name: 'origin_id', referencedColumnName: 'id' })
  origin: Origin | null;

  @Column({ name: 'material_id', type: 'bigint', nullable: true })
  material_id: number | null;

  @ManyToOne(() => Material, { nullable: true })
  @JoinColumn({ name: 'material_id', referencedColumnName: 'id' })
  material: Material | null;

  @Column({ name: 'size_id', type: 'bigint', nullable: true })
  size_id: number | null;

  @ManyToOne(() => Size, { nullable: true })
  @JoinColumn({ name: 'size_id', referencedColumnName: 'id' })
  size: Material | null;

  @Column({ name: 'brand_id', type: 'bigint', nullable: true })
  brand_id: number | null;

  @ManyToOne(() => Brand, { nullable: true })
  @JoinColumn({ name: 'brand_id', referencedColumnName: 'id' })
  brand: Brand | null;

  @Column({ name: 'color_id', type: 'bigint', nullable: true })
  color_id: number | null;

  @ManyToOne(() => Color, { nullable: true })
  @JoinColumn({ name: 'color_id', referencedColumnName: 'id' })
  color: Color | null;

  @Column({ name: 'capacity_id', type: 'bigint', nullable: true })
  capacity_id: number | null;

  @ManyToOne(() => Capacity, { nullable: true })
  @JoinColumn({ name: 'capacity_id', referencedColumnName: 'id' })
  capacity: Capacity | null;

  @Column({ name: 'warranty_id', type: 'bigint', nullable: true })
  warranty_id: number | null;

  @ManyToOne(() => Warranty, { nullable: true })
  @JoinColumn({ name: 'warranty_id', referencedColumnName: 'id' })
  warranty: Warranty | null;

  @Column({ name: 'product_model_id', type: 'bigint', nullable: true })
  product_model_id: number | null;

  @ManyToOne(() => ProductModel, { nullable: true })
  @JoinColumn({ name: 'product_model_id', referencedColumnName: 'id' })
  productModel: ProductModel | null;

  @Column({ name: 'product_status_id', type: 'bigint', nullable: true })
  product_status_id: number | null;

  @ManyToOne(() => ProductStatus, { nullable: true })
  @JoinColumn({ name: 'product_status_id', referencedColumnName: 'id' })
  productStatus: ProductStatus | null;

  @Column({ name: 'processor_id', type: 'bigint', nullable: true })
  processor_id: number | null;

  @ManyToOne(() => Processor, { nullable: true })
  @JoinColumn({ name: 'processor_id', referencedColumnName: 'id' })
  processor: Processor | null;

  @Column({ name: 'ram_option_id', type: 'bigint', nullable: true })
  ram_option_id: number | null;

  @ManyToOne(() => RamOption, { nullable: true })
  @JoinColumn({ name: 'ram_option_id', referencedColumnName: 'id' })
  ramOption: RamOption | null;

  @Column({ name: 'storage_type_id', type: 'bigint', nullable: true })
  storage_type_id: number | null;

  @ManyToOne(() => StorageType, { nullable: true })
  @JoinColumn({ name: 'storage_type_id', referencedColumnName: 'id' })
  storageType: StorageType | null;

  @Column({ name: 'graphics_card_id', type: 'bigint', nullable: true })
  graphics_card_id: number | null;

  @ManyToOne(() => GraphicsCard, { nullable: true })
  @JoinColumn({ name: 'graphics_card_id', referencedColumnName: 'id' })
  graphicsCard: GraphicsCard | null;

  @Column({ name: 'breed_id', type: 'bigint', nullable: true })
  breed_id: number | null;

  @ManyToOne(() => Breed, { nullable: true })
  @JoinColumn({ name: 'breed_id', referencedColumnName: 'id' })
  breed: Breed | null;

  @Column({ name: 'age_range_id', type: 'bigint', nullable: true })
  age_range_id: number | null;

  @ManyToOne(() => AgeRange, { nullable: true })
  @JoinColumn({ name: 'age_range_id', referencedColumnName: 'id' })
  ageRange: AgeRange | null;

  @Column({ name: 'gender_id', type: 'bigint', nullable: true })
  gender_id: number | null;

  @ManyToOne(() => Gender, { nullable: true })
  @JoinColumn({ name: 'gender_id', referencedColumnName: 'id' })
  gender: Gender | null;

  @Column({ name: 'engine_capacity_id', type: 'bigint', nullable: true })
  engine_capacity_id: number | null;

  @ManyToOne(() => EngineCapacity, { nullable: true })
  @JoinColumn({ name: 'engine_capacity_id', referencedColumnName: 'id' })
  engineCapacity: EngineCapacity | null;

  @Column({ name: 'mileage', type: 'bigint', nullable: true })
  mileage: number | null;

  @Column({ type: 'text', nullable: false })
  description: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  price: number;

  @Column({ type: 'varchar', length: 191, nullable: true })
  thumbnail_url?: string | null;

  @OneToMany(() => ProductImage, (image) => image.product, { cascade: true })
  images: ProductImage[];

  // ===== Thông tin người đăng =====
  @Column({ type: 'bigint', nullable: true })
  user_id: number | null;

  @ManyToOne(() => User, (user) => user.products, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  // ===== Phân loại =====
  @ManyToOne(() => PostType)
  @JoinColumn({ name: 'post_type_id' })
  postType: PostType;

  @Column({ type: 'bigint', nullable: true })
  post_type_id: number | null;

  @Column({ type: 'bigint', nullable: true })
  deal_type_id: number | null;

  @ManyToOne(() => DealType)
  @JoinColumn({ name: 'deal_type_id' })
  dealType: DealType;

  @Column({ type: 'bigint', nullable: true })
  category_id: number | null;

  @ManyToOne(() => Category, (category) => category.products, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ name: 'sub_category_id', type: 'bigint', nullable: true })
  sub_category_id: number | null;

  @ManyToOne(() => SubCategory, (subCategory) => subCategory.products, {
    eager: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sub_category_id' })
  subCategory: SubCategory;

  // ==================== TRAO ĐỔI ====================
  @Column({ type: 'bigint', nullable: true })
  category_change_id: number | null;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'category_change_id' })
  category_change: Category | null;

  @Column({ type: 'bigint', nullable: true })
  sub_category_change_id: number | null;

  @ManyToOne(() => SubCategory)
  @JoinColumn({ name: 'sub_category_change_id' })
  sub_category_change: SubCategory | null;

  @ManyToOne(() => Condition)
  @JoinColumn({ name: 'condition_id' })
  condition: Condition | null;

  // ===== Địa chỉ =====
  @Column({ type: 'json', nullable: true })
  address_json: object;

  @OneToMany(() => Comment, (comment) => comment.product)
  comments: Comment[];
  // ===== Trạng thái bài đăng =====

  @Column({ type: 'int', nullable: true })
  status_id: number;

  @Column({ type: 'bigint', default: 0 })
  visibility_type: number; //0 toàn trường, 1 trong nhóm

  @Column({ type: 'bigint', nullable: true })
  group_id: number | null;

  @ManyToOne(() => Group, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: Group | null;

  // ===== Thông tin tài liệu khoa =====
  @Column({ type: 'varchar', length: 191, nullable: true })
  author: string | null;

  @Column({ type: 'int', nullable: true })
  year: number | null;

  @Column({
    name: 'expires_at',
    type: 'timestamp',
    nullable: true,
    comment: 'Ngày sản phẩm sẽ hết hạn',
  })
  expires_at: Date | null;

  @Column({ type: 'boolean', default: true })
  receive_suggestions: boolean;

  @Column({ type: 'timestamp', nullable: true })
  suggestions_last_asked_at: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
