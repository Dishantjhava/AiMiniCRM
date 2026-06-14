import Customer from '../models/Customer';
import Order from '../models/Order';

export const buildMongoQuery = async (filters: Record<string, any>): Promise<Record<string, any>> => {
  const query: Record<string, any> = {};

  // minSpend mapping
  if (filters.minSpend !== undefined) {
    query.lifetimeValue = { ...query.lifetimeValue, $gte: filters.minSpend };
  }

  // maxSpend mapping
  if (filters.maxSpend !== undefined) {
    query.lifetimeValue = { ...query.lifetimeValue, $lte: filters.maxSpend };
  }

  // inactiveDays mapping
  if (filters.inactiveDays !== undefined) {
    const cutoffDate = new Date(Date.now() - filters.inactiveDays * 86400000);
    query.lastPurchaseDate = { ...query.lastPurchaseDate, $lte: cutoffDate };
  }

  // activeDays mapping
  if (filters.activeDays !== undefined) {
    const cutoffDate = new Date(Date.now() - filters.activeDays * 86400000);
    query.lastPurchaseDate = { ...query.lastPurchaseDate, $gte: cutoffDate };
  }

  // city mapping
  if (filters.city) {
    query.city = filters.city;
  }

  // gender mapping
  if (filters.gender) {
    query.gender = filters.gender;
  }

  // Handle minOrders filter (aggregates Order collection to find customerIds with at least minOrders)
  let matchingCustomerIds: any[] | null = null;

  if (filters.minOrders !== undefined) {
    const ordersAgg = await Order.aggregate([
      { $group: { _id: '$customerId', count: { $sum: 1 } } },
      { $match: { count: { $gte: filters.minOrders } } }
    ]);
    matchingCustomerIds = ordersAgg.map(o => o._id.toString());
  }

  // Handle category filter (finds customerIds who bought from that category)
  if (filters.category) {
    const categoryOrders = await Order.find({ category: filters.category }).select('customerId');
    const categoryCustomerIds = categoryOrders.map(o => o.customerId.toString());
    const categoryUniqueIds = Array.from(new Set(categoryCustomerIds));

    if (matchingCustomerIds !== null) {
      // Intersect with minOrders results
      matchingCustomerIds = matchingCustomerIds.filter(id => categoryUniqueIds.includes(id));
    } else {
      matchingCustomerIds = categoryUniqueIds;
    }
  }

  // If we have customer ID restrictions from minOrders or category, add to query
  if (matchingCustomerIds !== null) {
    query._id = { $in: matchingCustomerIds };
  }

  return query;
};

export const getAudiencePreview = async (filters: Record<string, any>) => {
  const query = await buildMongoQuery(filters);
  const customers = await Customer.find(query).limit(10).exec();
  const totalCount = await Customer.countDocuments(query).exec();
  return {
    customers,
    totalCount,
    filters,
  };
};
