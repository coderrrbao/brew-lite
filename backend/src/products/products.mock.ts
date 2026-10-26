export type ProductCategory = 'hot' | 'cold' | 'specialty';

export interface Product {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  category: ProductCategory;
  imageId: string;
  popular?: boolean;
  stock: number;
}

// Mock data - replace with Prisma queries later
export const mockProducts: Product[] = [
  {
    id: 'phin-sua',
    name: 'Cà Phê Sữa Đá',
    description: 'Cà phê Robusta pha phin truyền thống, kết hợp sữa đặc thơm béo và đá viên mát lạnh.',
    basePrice: 35000,
    category: 'cold',
    imageId: '1509042239860-f550ce710b93',
    popular: true,
    stock: 50,
  },
  {
    id: 'espresso',
    name: 'Espresso',
    description: 'Shot espresso đậm đà từ hạt Arabica rang vừa, hương hoa quả tinh tế, crema vàng óng.',
    basePrice: 45000,
    category: 'hot',
    imageId: '1510591509098-f4fdc6d0ff04',
    popular: true,
    stock: 40,
  },
  {
    id: 'latte',
    name: 'Caffe Latte',
    description: 'Espresso đơn hoà quyện cùng sữa hấp mịn mượt, lớp milk foam nhẹ nhàng phủ trên bề mặt.',
    basePrice: 55000,
    category: 'hot',
    imageId: '1541167760496-1628856ab772',
    popular: true,
    stock: 35,
  },
  {
    id: 'cappuccino',
    name: 'Cappuccino',
    description: 'Tỷ lệ 1:1:1 hoàn hảo giữa espresso, sữa hấp và foam — béo ngậy, thơm nồng.',
    basePrice: 55000,
    category: 'hot',
    imageId: '1572442388796-11668a67e53d',
    stock: 30,
  },
  {
    id: 'americano',
    name: 'Americano',
    description: 'Espresso pha loãng với nước nóng, giữ trọn hương vị cà phê nhưng nhẹ dịu hơn.',
    basePrice: 45000,
    category: 'hot',
    imageId: '1521302080334-4bedac2763b6',
    stock: 45,
  },
  {
    id: 'cold-brew',
    name: 'Cold Brew',
    description: 'Ủ lạnh 18 giờ từ hạt Arabica Ethiopia, vị ngọt tự nhiên, bóng mượt, không đắng.',
    basePrice: 60000,
    category: 'cold',
    imageId: '1461023058943-07fcbe16d735',
    popular: true,
    stock: 20,
  },
  {
    id: 'matcha-latte',
    name: 'Matcha Latte',
    description: 'Bột trà xanh Uji Nhật Bản hảo hạng, khuấy đều với sữa hấp, vị đắng ngọt cân bằng.',
    basePrice: 65000,
    category: 'specialty',
    imageId: '1515823662972-da6a2e4d3002',
    popular: true,
    stock: 25,
  },
  {
    id: 'caramel-macchiato',
    name: 'Caramel Macchiato',
    description: 'Vanilla, sữa hấp, espresso đổ từ trên xuống, kết thúc bằng lưới caramel handcrafted.',
    basePrice: 65000,
    category: 'specialty',
    imageId: '1485808191679-5f86510bd9d4',
    stock: 28,
  },
];
