import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Realistic expense categories with descriptions and limits
const expenseCategories = [
  { name: "Travel & Transportation", description: "Business travel, flights, car rentals, taxi, uber", limit: 5000 },
  { name: "Office Supplies", description: "Stationery, equipment, software licenses", limit: 2000 },
  { name: "Marketing & Advertising", description: "Digital ads, print materials, promotional items", limit: 10000 },
  { name: "Meals & Entertainment", description: "Client dinners, team lunches, conferences", limit: 3000 },
  { name: "Professional Services", description: "Legal, accounting, consulting fees", limit: 8000 },
  { name: "Technology & Software", description: "Hardware, software subscriptions, cloud services", limit: 15000 },
  { name: "Training & Development", description: "Courses, workshops, certification programs", limit: 4000 },
  { name: "Utilities", description: "Internet, phone, electricity, water", limit: 1500 },
  { name: "Insurance", description: "Business insurance, liability coverage", limit: 6000 },
  { name: "Maintenance & Repairs", description: "Equipment repairs, facility maintenance", limit: 3500 },
  { name: "Legal & Compliance", description: "Legal fees, regulatory compliance costs", limit: 7000 },
  { name: "Research & Development", description: "R&D expenses, prototype development", limit: 12000 },
  { name: "Rent & Facilities", description: "Office rent, facility management", limit: 8000 },
  { name: "Communication", description: "Phone, internet, communication tools", limit: 2500 },
  { name: "Equipment & Tools", description: "Machinery, tools, equipment purchases", limit: 9000 },
];

// Generate fake company IDs (UUIDs)
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Generate fake user IDs
const fakeUserIds = Array.from({ length: 20 }, () => generateUUID());

// Generate fake company IDs
const fakeCompanyIds = [
  '97bc4deb-d93d-4e86-9d35-8018bba6056a', // Use the company ID from your script.js
  generateUUID(),
  generateUUID(),
  generateUUID(),
  generateUUID(),
];

async function main() {
  console.log("🌱 Starting to seed expense categories and expenses...");

  // Create expense categories for each company
  console.log("📝 Creating expense categories...");
  const categories = [];
  
  for (const companyId of fakeCompanyIds) {
    // Each company gets 8-12 random categories
    const shuffledCategories = [...expenseCategories].sort(() => 0.5 - Math.random());
    const selectedCategories = shuffledCategories.slice(0, Math.floor(Math.random() * 5) + 8);
    
    for (const categoryTemplate of selectedCategories) {
      try {
        const category = await prisma.expenseCategory.create({
          data: {
            name: categoryTemplate.name,
            description: categoryTemplate.description,
            limit: Math.round((categoryTemplate.limit * (0.8 + Math.random() * 0.4)) * 100) / 100, // Add some variation to limits
            companyId: companyId,
          },
        });
        categories.push(category);
      } catch (error) {
        // Skip if category already exists for this company (unique constraint)
        if ((error as any).code !== 'P2002') {
          throw error;
        }
      }
    }
  }
  console.log(`✅ Created ${categories.length} expense categories`);

  // Create realistic expenses
  console.log("💰 Creating expenses...");
  let totalExpenses = 0;
  
  for (const companyId of fakeCompanyIds) {
    const companyCategories = categories.filter(cat => cat.companyId === companyId);
    
    if (companyCategories.length === 0) {
      console.log(`⚠️  No categories found for company ${companyId}, skipping expenses...`);
      continue;
    }
    
    // Create 150-400 expenses per company
    const expenseCount = Math.floor(Math.random() * 250) + 150;
    const expensesPerBatch = 50; // Create expenses in batches to avoid memory issues
    
    for (let batch = 0; batch < Math.ceil(expenseCount / expensesPerBatch); batch++) {
      const batchSize = Math.min(expensesPerBatch, expenseCount - (batch * expensesPerBatch));
      const batchExpenses = [];
      
      for (let i = 0; i < batchSize; i++) {
        const randomCategory = companyCategories[Math.floor(Math.random() * companyCategories.length)];
        const randomUserId = fakeUserIds[Math.floor(Math.random() * fakeUserIds.length)];
        
        // Generate realistic amount based on category
        let maxAmount = randomCategory.limit ? randomCategory.limit * 0.4 : 1000;
        
        // Adjust amounts based on category type
        if (randomCategory.name.includes("Technology") || randomCategory.name.includes("Equipment")) {
          maxAmount *= 1.8;
        } else if (randomCategory.name.includes("Travel")) {
          maxAmount *= 1.3;
        } else if (randomCategory.name.includes("Office Supplies") || randomCategory.name.includes("Utilities")) {
          maxAmount *= 0.4;
        } else if (randomCategory.name.includes("Marketing") || randomCategory.name.includes("R&D")) {
          maxAmount *= 1.5;
        }
        
        const amount = Math.random() * maxAmount + 15; // Minimum $15
        
        // Generate date within the last 120 days (4 months)
        const daysAgo = Math.floor(Math.random() * 120);
        const dateProduced = new Date();
        dateProduced.setDate(dateProduced.getDate() - daysAgo);
        
        batchExpenses.push({
          amount: Math.round(amount * 100) / 100, // Round to 2 decimal places
          dateProduced,
          categoryId: randomCategory.id,
          userId: randomUserId,
          companyId: companyId,
        });
      }
      
      await prisma.expense.createMany({
        data: batchExpenses,
      });
      
      totalExpenses += batchSize;
    }
  }
  
  console.log(`✅ Created ${totalExpenses} expenses`);

  // Display summary
  console.log("\n📊 Seeding Summary:");
  console.log(`   Companies: ${fakeCompanyIds.length}`);
  console.log(`   Expense Categories: ${categories.length}`);
  console.log(`   Expenses: ${totalExpenses}`);
  
  // Calculate and display some statistics
  const stats = await prisma.expense.groupBy({
    by: ['companyId'],
    _sum: {
      amount: true,
    },
    _count: {
      id: true,
    },
  });
  
  console.log("\n💼 Company Expense Statistics:");
  for (const stat of stats) {
    const companyIndex = fakeCompanyIds.indexOf(stat.companyId);
    const companyName = companyIndex === 0 ? 'Main Company (from script.js)' : `Company ${companyIndex + 1}`;
    console.log(`   ${companyName}: ${stat._count.id} expenses, $${stat._sum.amount?.toFixed(2)} total`);
  }
  
  // Display category statistics
  const categoryStats = await prisma.expenseCategory.findMany({
    include: {
      expenses: {
        select: {
          amount: true,
        },
      },
    },
  });
  
  console.log("\n📋 Top Category Statistics:");
  const topCategories = categoryStats
    .map(cat => ({
      name: cat.name,
      count: cat.expenses.length,
      total: cat.expenses.reduce((sum, exp) => sum + exp.amount, 0),
      limit: cat.limit,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);
  
  for (const cat of topCategories) {
    const utilization = cat.limit ? ((cat.total / cat.limit) * 100).toFixed(1) : 'N/A';
    console.log(`   ${cat.name}: ${cat.count} expenses, $${cat.total.toFixed(2)} (${utilization}% of limit)`);
  }
  
  console.log("\n🎉 Database seeding completed successfully!");
}

main()
  .catch((e) => {
    if (e.code === "P2002") {
      console.log("⚠️  Some data already exists, continuing with available data...");
    } else {
      console.error("❌ Seed error:", e);
      process.exit(1);
    }
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 