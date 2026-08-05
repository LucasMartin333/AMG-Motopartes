import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash(
    process.env.SEED_ADMIN_PASSWORD ?? "admin1234",
    12,
  );

  const admin = await prisma.user.upsert({
    where: { email: "admin@taller.com" },
    update: {},
    create: {
      email: "admin@taller.com",
      name: "Administrador",
      passwordHash,
      role: Role.ADMIN,
    },
  });

  const employee = await prisma.user.upsert({
    where: { email: "empleado@taller.com" },
    update: {},
    create: {
      email: "empleado@taller.com",
      name: "Empleado Demo",
      passwordHash: await bcrypt.hash("empleado1234", 12),
      role: Role.EMPLOYEE,
    },
  });

  const categories = await Promise.all(
    ["Motor", "Frenos", "Transmisión", "Eléctrico", "Accesorios"].map((name) =>
      prisma.category.upsert({
        where: { name },
        update: {},
        create: { name },
      }),
    ),
  );

  const brands = await Promise.all(
    ["Honda", "Yamaha", "Suzuki", "Kawasaki", "Universal"].map((name) =>
      prisma.brand.upsert({
        where: { name },
        update: {},
        create: { name },
      }),
    ),
  );

  const supplier = await prisma.supplier.upsert({
    where: { id: "seed-supplier-1" },
    update: {},
    create: {
      id: "seed-supplier-1",
      name: "Repuestos del Sur",
      contact: "Juan Pérez",
      phone: "11-4567-8901",
      whatsapp: "+5491145678901",
      email: "ventas@repuestosursur.com",
      address: "Av. Industrial 1234, Buenos Aires",
    },
  });

  const productsData = [
    {
      code: "FRN-001",
      name: "Pastillas de freno delanteras",
      stock: 8,
      minStock: 10,
      salePrice: 18500,
      category: categories[1].id,
      brand: brands[0].id,
    },
    {
      code: "MOT-014",
      name: "Filtro de aceite",
      stock: 25,
      minStock: 15,
      salePrice: 4200,
      category: categories[0].id,
      brand: brands[4].id,
    },
    {
      code: "ELC-008",
      name: "Bujía iridium",
      stock: 3,
      minStock: 8,
      salePrice: 8900,
      category: categories[3].id,
      brand: brands[1].id,
    },
    {
      code: "TRN-022",
      name: "Cadena de transmisión 520",
      stock: 12,
      minStock: 5,
      salePrice: 35600,
      category: categories[2].id,
      brand: brands[2].id,
    },
    {
      code: "ACC-105",
      name: "Espejo retrovisor universal",
      stock: 2,
      minStock: 6,
      salePrice: 12500,
      category: categories[4].id,
      brand: brands[4].id,
    },
  ];

  for (const item of productsData) {
    const product = await prisma.product.upsert({
      where: { code: item.code },
      update: {},
      create: {
        code: item.code,
        name: item.name,
        stock: item.stock,
        minStock: item.minStock,
        salePrice: item.salePrice,
        categoryId: item.category,
        brandId: item.brand,
        description: `Repuesto ${item.name.toLowerCase()} para motocicletas`,
      },
    });

    await prisma.productSupplier.upsert({
      where: {
        productId_supplierId: {
          productId: product.id,
          supplierId: supplier.id,
        },
      },
      update: {},
      create: {
        productId: product.id,
        supplierId: supplier.id,
        supplierPrice: item.salePrice * 0.65,
        notes: "Precio mayorista",
      },
    });
  }

  console.log("Seed completado:");
  console.log(`- Admin: ${admin.email}`);
  console.log(`- Empleado: ${employee.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
