import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.submission.deleteMany({});
  await prisma.problem.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Seeding database...');

  await prisma.user.create({
    data: { email: 'learner@example.com', name: 'Jane Learner' },
  });

  const problems = [
    {
      title: 'Design a Parking Lot',
      description:
        'Design a parking lot using object-oriented principles. The parking lot has multiple floors and different types of parking spots.',
      requirements:
        '- The parking lot has multiple floors.\n- Spot types: Compact, Large, Handicapped, Motorcycle.\n- Vehicles: Car, Truck, Van, Motorcycle.\n- A Ticket is issued on entry; Payment is collected on exit.\n- Track available spots per floor.\n- Support hourly + flat pricing strategies.',
    },
    {
      title: 'Design a Vending Machine',
      description:
        'Design a vending machine in an object-oriented way. It holds products, accepts coins and notes, dispenses the product, and returns change.',
      requirements:
        '- States: Ready, HasMoney, Dispensing, Error (State pattern).\n- Accepts multiple denominations of coins and notes.\n- Returns change when overpaid.\n- Inventory management for products and cash.',
    },
    {
      title: 'Design an Elevator System',
      description:
        'Design an elevator system for a multi-floor building with multiple elevators, handling concurrent requests efficiently.',
      requirements:
        '- Multiple elevators serving N floors.\n- Request handling: internal (panel) + external (hall call with Direction Up/Down).\n- Elevator states: Idle, Moving, DoorOpen.\n- A Scheduler assigns requests (e.g. SCAN / nearest-elevator strategy).\n- Handle Door open/close timing and overload safety.',
    },
    {
      title: 'Design a Library Management System',
      description:
        'Design a library system to manage books, members, borrowing, reservations, and fines.',
      requirements:
        '- Catalog with Book copies (BookItem) and rack locations.\n- Members can borrow (limit N), reserve, and renew.\n- Lending: checkout, return, overdue fine calculation.\n- Search by title, author, subject.\n- Librarian vs Member roles with different permissions.',
    },
    {
      title: 'Design a Splitwise-style Expense Sharing App',
      description:
        'Design an expense-sharing system where groups of users split bills with equal, exact, or percentage splits.',
      requirements:
        '- Users, Groups, and Expenses.\n- Split strategies: Equal, Exact, Percentage (Strategy pattern).\n- Track balances and simplify debts.\n- Support show-balances and settle-up operations.',
    },
  ];

  for (const p of problems) {
    await prisma.problem.create({ data: p });
  }

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
