import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clear existing problems to avoid duplicates on re-run
  await prisma.problem.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Seeding database...');

  const user1 = await prisma.user.create({
    data: {
      email: 'learner@example.com',
      name: 'Jane Learner'
    }
  });

  const problem1 = await prisma.problem.create({
    data: {
      title: 'Design a Parking Lot',
      description: 'Design a parking lot using object-oriented principles. The parking lot should have multiple floors and different types of parking spots (compact, large, handicapped, motorcycle).',
      requirements: '- The parking lot has multiple floors.\n- Multiple types of parking spots: Compact, Large, Handicapped, Motorcycle.\n- Vehicles: Car, Truck, Van, Motorcycle.\n- A ticket is issued when a vehicle enters, and payment is collected when it exits.\n- Track the available spots per floor.'
    }
  });

  const problem2 = await prisma.problem.create({
    data: {
      title: 'Design a Vending Machine',
      description: 'Design a vending machine in an object-oriented way. The machine has multiple products, accepts coins and notes, dispenses the product, and returns change.',
      requirements: '- Different states of the vending machine (Ready, HasMoney, Dispensing, Error).\n- Accepts multiple denominations of coins and notes.\n- Returns change if the inserted money is more than the product price.\n- Inventory management for products and coins/notes.'
    }
  });

  console.log('Database seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
