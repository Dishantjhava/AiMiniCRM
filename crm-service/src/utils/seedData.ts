import Customer from '../models/Customer';
import Order from '../models/Order';
import Campaign from '../models/Campaign';
import Communication from '../models/Communication';
import CommunicationEvent from '../models/CommunicationEvent';

const FIRST_NAMES_MALE = [
  'Aarav', 'Amit', 'Arjun', 'Aditya', 'Vikram', 'Rohan', 'Rahul', 'Vijay', 'Suresh', 'Rajesh',
  'Sai', 'Harpreet', 'Gurpreet', 'Karan', 'Sanjay', 'Nikhil', 'Pranav', 'Siddharth', 'Vivek', 'Ishaan'
];

const FIRST_NAMES_FEMALE = [
  'Ananya', 'Deepika', 'Priyanka', 'Pooja', 'Sneha', 'Aditi', 'Kavita', 'Priya', 'Neha', 'Simran',
  'Sunita', 'Divya', 'Meera', 'Shreya', 'Harini', 'Lakshmi', 'Preeti', 'Riya', 'Nisha', 'Tanvi'
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Gupta', 'Singh', 'Kumar', 'Patel', 'Reddy', 'Nair', 'Joshi', 'Malhotra',
  'Gill', 'Kapoor', 'Sen', 'Rao', 'Mehta', 'Iyer', 'Bhat', 'Patil', 'Choudhury', 'Banerjee'
];

const CITIES = ['Delhi', 'Mumbai', 'Bangalore', 'Chandigarh', 'Pune'] as const;

const getRandomItem = <T>(arr: readonly T[] | T[]): T => arr[Math.floor(Math.random() * arr.length)];

const generatePhoneNumber = (): string => {
  const prefix = getRandomItem(['9', '8', '7']);
  let rest = '';
  for (let i = 0; i < 9; i++) {
    rest += Math.floor(Math.random() * 10).toString();
  }
  return prefix + rest;
};

const getRandomDateAgo = (minDays: number, maxDays: number): Date => {
  const daysAgo = Math.floor(Math.random() * (maxDays - minDays + 1)) + minDays;
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date;
};

export const seedDatabase = async () => {
  console.log('Clearing database collections...');
  await Customer.deleteMany({});
  await Order.deleteMany({});

  console.log('Generating 100 customers...');
  const customersData = [];
  const emailSet = new Set<string>();

  for (let i = 0; i < 100; i++) {
    const gender = getRandomItem(['Male', 'Female'] as const);
    const firstName = gender === 'Male' ? getRandomItem(FIRST_NAMES_MALE) : getRandomItem(FIRST_NAMES_FEMALE);
    const lastName = getRandomItem(LAST_NAMES);
    const name = `${firstName} ${lastName}`;
    
    // Ensure email uniqueness
    let email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;
    let counter = 1;
    while (emailSet.has(email)) {
      email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${counter}@example.com`;
      counter++;
    }
    emailSet.add(email);

    const phone = generatePhoneNumber();
    const city = getRandomItem(CITIES);
    const lastPurchaseDate = getRandomDateAgo(1, 180);
    // Temp lifetime value, will be updated based on orders
    const lifetimeValue = 0;

    customersData.push({
      name,
      email,
      phone,
      city,
      gender,
      lastPurchaseDate,
      lifetimeValue,
    });
  }

  const insertedCustomers = await Customer.insertMany(customersData);
  console.log(`Successfully inserted ${insertedCustomers.length} customers.`);

  console.log('Generating 500 orders...');
  const ordersData = [];
  const categories = ['Shoes', 'T-Shirts', 'Jeans', 'Accessories', 'Beauty'] as const;

  for (let i = 0; i < 500; i++) {
    const randomCustomer = getRandomItem(insertedCustomers);
    const amount = Math.floor(Math.random() * (8000 - 200 + 1)) + 200;
    const category = getRandomItem(categories);
    const orderDate = getRandomDateAgo(1, 365);
    const status = 'completed'; // default

    ordersData.push({
      customerId: randomCustomer._id,
      amount,
      category,
      orderDate,
      status,
    });
  }

  const insertedOrders = await Order.insertMany(ordersData);
  console.log(`Successfully inserted ${insertedOrders.length} orders.`);

  console.log('Recalculating customer lifetime value and updating last purchase dates...');
  // Group orders by customerId to aggregate totals
  const customerTotals: Record<string, { totalAmount: number; latestDate: Date }> = {};

  for (const order of insertedOrders) {
    const custId = order.customerId.toString();
    if (!customerTotals[custId]) {
      customerTotals[custId] = { totalAmount: 0, latestDate: order.orderDate };
    } else {
      customerTotals[custId].totalAmount += order.amount;
      if (order.orderDate > customerTotals[custId].latestDate) {
        customerTotals[custId].latestDate = order.orderDate;
      }
    }
  }

  // Update customers in DB
  const updatePromises = insertedCustomers.map(async (customer) => {
    const totals = customerTotals[customer._id.toString()];
    if (totals) {
      customer.lifetimeValue = totals.totalAmount;
      customer.lastPurchaseDate = totals.latestDate;
      await customer.save();
    }
  });

  await Promise.all(updatePromises);
  console.log('Customer lifetimeValues and lastPurchaseDates updated successfully.');

  return {
    customersCount: insertedCustomers.length,
    ordersCount: insertedOrders.length,
  };
};
