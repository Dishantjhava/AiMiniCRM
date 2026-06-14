import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Plus,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  RefreshCw,
  Check,
} from 'lucide-react';
import api from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';

interface IOrder {
  _id: string;
  customerId: {
    _id: string;
    name: string;
    email: string;
  };
  amount: number;
  category: string;
  status: string;
  orderDate: string;
}

interface ICustomerSearchOption {
  _id: string;
  name: string;
  email: string;
}

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form Fields
  const [customerSearchQuery, setCustomerSearchQuery] = useState<string>('');
  const [matchingCustomers, setMatchingCustomers] = useState<ICustomerSearchOption[]>([]);
  const [searchingCustomer, setSearchingCustomer] = useState<boolean>(false);
  const [selectedCustomer, setSelectedCustomer] = useState<ICustomerSearchOption | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('T-Shirts');
  const [orderDate, setOrderDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Debounced search for customers dropdown in creation modal
  useEffect(() => {
    if (customerSearchQuery.trim().length === 0) {
      setMatchingCustomers([]);
      return;
    }

    const handler = setTimeout(async () => {
      try {
        setSearchingCustomer(true);
        const res = await api.get('/customers', {
          params: { search: customerSearchQuery, limit: 5 },
        });
        if (res.data && res.data.success) {
          setMatchingCustomers(res.data.customers);
        }
      } catch (err) {
        console.error('Customer dropdown search failed', err);
      } finally {
        setSearchingCustomer(false);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [customerSearchQuery]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/orders', {
        params: {
          page,
          limit: 15,
        },
      });

      if (response.data && response.data.success) {
        setOrders(response.data.orders);
        setTotalPages(response.data.totalPages);
        setTotalCount(response.data.totalCount);
      } else {
        setError('Failed to fetch orders.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Server connection failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page]);

  const handleCreateOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!selectedCustomer) {
      setModalError('Please select a customer.');
      return;
    }

    if (!amount || Number(amount) <= 0) {
      setModalError('Amount must be a positive number.');
      return;
    }

    try {
      setSubmitting(true);
      const response = await api.post('/orders', {
        customerId: selectedCustomer._id,
        amount: Number(amount),
        category,
        orderDate,
      });

      if (response.data && response.data.success) {
        setIsModalOpen(false);
        // Reset state
        setSelectedCustomer(null);
        setCustomerSearchQuery('');
        setAmount('');
        setCategory('T-Shirts');
        alert('Order created successfully!');
        fetchOrders();
      } else {
        setModalError('Failed to create order.');
      }
    } catch (err: any) {
      console.error(err);
      setModalError(err.response?.data?.message || 'Error occurred while saving transaction.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-8 p-8 max-w-7xl mx-auto">
      {/* Page Title & Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight flex items-center space-x-2">
            <ShoppingBag className="w-8 h-8 text-primary" />
            <span>Orders Log</span>
          </h2>
          <p className="text-textsecondary text-sm">
            Total transactions processed: <strong className="text-textprimary">{totalCount}</strong>
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-white hover:bg-primary/95 rounded-lg transition text-sm font-semibold shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4" />
          <span>New Order</span>
        </button>
      </div>

      {/* Main orders table */}
      {loading ? (
        <LoadingSpinner message="Querying transaction histories..." />
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <p className="text-danger font-semibold">{error}</p>
          <button
            onClick={fetchOrders}
            className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry</span>
          </button>
        </div>
      ) : (
        <div className="bg-cardbg border border-borderbg rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-borderbg text-textsecondary text-xs uppercase tracking-wider bg-darkbg/35">
                  <th className="px-6 py-4 font-semibold">Order ID</th>
                  <th className="px-6 py-4 font-semibold">Customer Name</th>
                  <th className="px-6 py-4 font-semibold">Customer Email</th>
                  <th className="px-6 py-4 font-semibold">Category</th>
                  <th className="px-6 py-4 font-semibold text-right">Amount</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Order Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderbg/50">
                {orders.length > 0 ? (
                  orders.map((order) => (
                    <tr key={order._id} className="hover:bg-borderbg/20 transition-colors">
                      <td className="px-6 py-4 font-mono text-textsecondary text-xs">
                        {order._id.substring(0, 8).toUpperCase()}
                      </td>
                      <td className="px-6 py-4 font-semibold text-textprimary">
                        {order.customerId?.name || 'Deleted Customer'}
                      </td>
                      <td className="px-6 py-4 text-textsecondary">
                        {order.customerId?.email || '—'}
                      </td>
                      <td className="px-6 py-4 text-textprimary">
                        <span className="px-2 py-0.5 bg-borderbg border border-borderbg rounded text-xs">
                          {order.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-textprimary">
                        {formatCurrency(order.amount)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                            order.status === 'completed'
                              ? 'bg-success/10 text-success border-success/30'
                              : order.status === 'pending'
                              ? 'bg-warning/10 text-warning border-warning/30'
                              : 'bg-danger/10 text-danger border-danger/30'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-textsecondary">{formatDate(order.orderDate)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-textsecondary italic">
                      No order transactions found. Seeding is recommended.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-borderbg flex items-center justify-between">
              <span className="text-xs text-textsecondary">
                Page <strong className="text-textprimary">{page}</strong> of <strong className="text-textprimary">{totalPages}</strong>
              </span>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 border border-borderbg rounded bg-darkbg hover:bg-borderbg text-textsecondary disabled:opacity-40 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 border border-borderbg rounded bg-darkbg hover:bg-borderbg text-textsecondary disabled:opacity-40 transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-cardbg border border-borderbg rounded-xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-borderbg flex items-center justify-between">
              <h3 className="text-lg font-bold">Log New Transaction</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-textsecondary hover:text-textprimary transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateOrderSubmit} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 bg-danger/10 text-danger border border-danger/20 rounded-lg text-xs font-semibold">
                  {modalError}
                </div>
              )}

              {/* Customer Selector Search Dropdown */}
              <div className="space-y-1.5 relative">
                <label className="text-xs text-textsecondary font-semibold uppercase tracking-wider block">
                  Find Customer
                </label>
                
                {selectedCustomer ? (
                  <div className="flex items-center justify-between bg-darkbg border border-success/50 rounded-lg px-3 py-2 text-sm text-textprimary">
                    <div className="flex flex-col">
                      <span className="font-semibold text-success">{selectedCustomer.name}</span>
                      <span className="text-xs text-textsecondary">{selectedCustomer.email}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedCustomer(null)}
                      className="text-textsecondary hover:text-danger transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="w-4 h-4 text-textsecondary absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Type name or email to search..."
                      value={customerSearchQuery}
                      onChange={(e) => setCustomerSearchQuery(e.target.value)}
                      className="w-full bg-darkbg border border-borderbg rounded-lg pl-9 pr-3 py-2 text-sm text-textprimary focus:outline-none focus:border-primary"
                    />

                    {/* Autocomplete Dropdown */}
                    {matchingCustomers.length > 0 && (
                      <ul className="absolute z-10 w-full mt-1 bg-cardbg border border-borderbg rounded-lg overflow-hidden shadow-xl divide-y divide-borderbg">
                        {matchingCustomers.map((cust) => (
                          <li
                            key={cust._id}
                            onClick={() => {
                              setSelectedCustomer(cust);
                              setMatchingCustomers([]);
                              setCustomerSearchQuery('');
                            }}
                            className="px-4 py-2 hover:bg-primary/15 hover:text-white cursor-pointer transition text-xs flex justify-between items-center"
                          >
                            <div>
                              <span className="font-semibold block">{cust.name}</span>
                              <span className="text-[10px] text-textsecondary block">{cust.email}</span>
                            </div>
                            <Check className="w-3.5 h-3.5 opacity-0 hover:opacity-100 text-success" />
                          </li>
                        ))}
                      </ul>
                    )}

                    {searchingCustomer && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-textsecondary flex items-center space-x-1">
                        <RefreshCw className="w-3 h-3 animate-spin text-primary" />
                        <span>Searching...</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Order Amount */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-textsecondary font-semibold uppercase tracking-wider block">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="Enter spend amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-darkbg border border-borderbg rounded-lg px-3 py-2 text-sm text-textprimary focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-textsecondary font-semibold uppercase tracking-wider block">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-darkbg border border-borderbg rounded-lg px-3 py-2 text-sm text-textprimary focus:outline-none focus:border-primary"
                  >
                    <option value="Shoes">Shoes</option>
                    <option value="T-Shirts">T-Shirts</option>
                    <option value="Jeans">Jeans</option>
                    <option value="Accessories">Accessories</option>
                    <option value="Beauty">Beauty</option>
                  </select>
                </div>
              </div>

              {/* Order Date */}
              <div className="space-y-1.5">
                <label className="text-xs text-textsecondary font-semibold uppercase tracking-wider block">
                  Transaction Date
                </label>
                <input
                  type="date"
                  required
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  className="w-full bg-darkbg border border-borderbg rounded-lg px-3 py-2 text-sm text-textprimary focus:outline-none focus:border-primary"
                />
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-borderbg flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-borderbg bg-transparent hover:bg-borderbg text-textsecondary hover:text-textprimary rounded-lg text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-primary text-white hover:bg-primary/90 rounded-lg text-sm font-semibold transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Log Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
