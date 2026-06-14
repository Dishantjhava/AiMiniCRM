import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Database,
  X,
  RefreshCw,
} from 'lucide-react';
import api from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';

interface ICustomer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  gender?: string;
  lifetimeValue: number;
  lastPurchaseDate?: string;
  createdAt: string;
}

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [seeding, setSeeding] = useState<boolean>(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    city: 'Delhi',
    gender: 'Male',
  });
  const [modalError, setModalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Debouncing Search Input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset page to 1 when search changes
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [search]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/customers', {
        params: {
          search: debouncedSearch,
          page,
          limit: 15,
        },
      });

      if (response.data && response.data.success) {
        setCustomers(response.data.customers);
        setTotalPages(response.data.totalPages);
        setTotalCount(response.data.totalCount);
      } else {
        setError('Failed to fetch customers list.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Server connection failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [debouncedSearch, page]);

  const handleSeedData = async () => {
    try {
      setSeeding(true);
      const response = await api.get('/seed');
      if (response.data && response.data.success) {
        alert(`Database seeded successfully! Created ${response.data.customers} Customers.`);
        fetchCustomers();
      } else {
        alert('Seeding operation failed.');
      }
    } catch (err: any) {
      console.error(err);
      alert('Error seeding data: ' + (err.message || err));
    } finally {
      setSeeding(false);
    }
  };

  const handleAddCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!newCustomer.name || !newCustomer.email) {
      setModalError('Name and Email fields are required.');
      return;
    }

    try {
      setSubmitting(true);
      const response = await api.post('/customers', newCustomer);
      if (response.data && response.data.success) {
        setIsModalOpen(false);
        // Reset customer form
        setNewCustomer({
          name: '',
          email: '',
          phone: '',
          city: 'Delhi',
          gender: 'Male',
        });
        alert('Customer added successfully!');
        fetchCustomers();
      } else {
        setModalError('Failed to create customer record.');
      }
    } catch (err: any) {
      console.error(err);
      setModalError(err.response?.data?.message || 'Error occurred while saving customer.');
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-8 p-8 max-w-7xl mx-auto">
      {/* Page Title & Actions Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight flex items-center space-x-2">
            <Users className="w-8 h-8 text-primary" />
            <span>Customers Registry</span>
          </h2>
          <p className="text-textsecondary text-sm">
            Total active shoppers: <strong className="text-textprimary">{totalCount}</strong>
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleSeedData}
            disabled={seeding}
            className="flex items-center space-x-2 px-4 py-2 border border-borderbg bg-cardbg hover:bg-borderbg text-textprimary rounded-lg transition text-sm font-semibold disabled:opacity-50"
          >
            <Database className={`w-4 h-4 ${seeding ? 'animate-spin' : ''}`} />
            <span>{seeding ? 'Seeding...' : 'Seed Data'}</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-primary text-white hover:bg-primary/95 rounded-lg transition text-sm font-semibold shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-cardbg border border-borderbg rounded-xl p-4 flex items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="w-5 h-5 text-textsecondary absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-darkbg border border-borderbg rounded-lg pl-10 pr-4 py-2 text-sm text-textprimary placeholder-textsecondary focus:outline-none focus:border-primary transition"
          />
        </div>
      </div>

      {/* Main Customers List */}
      {loading ? (
        <LoadingSpinner message="Searching customer registry..." />
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <p className="text-danger font-semibold">{error}</p>
          <button
            onClick={fetchCustomers}
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
                  <th className="px-6 py-4 font-semibold">Name</th>
                  <th className="px-6 py-4 font-semibold">Email</th>
                  <th className="px-6 py-4 font-semibold">Phone</th>
                  <th className="px-6 py-4 font-semibold">City</th>
                  <th className="px-6 py-4 font-semibold">Gender</th>
                  <th className="px-6 py-4 font-semibold text-right">LTV</th>
                  <th className="px-6 py-4 font-semibold">Last Purchase</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderbg/50">
                {customers.length > 0 ? (
                  customers.map((customer) => (
                    <tr key={customer._id} className="hover:bg-borderbg/20 transition-colors">
                      <td className="px-6 py-4 font-semibold text-textprimary">{customer.name}</td>
                      <td className="px-6 py-4 text-textsecondary">{customer.email}</td>
                      <td className="px-6 py-4 text-textsecondary">{customer.phone || '—'}</td>
                      <td className="px-6 py-4 text-textprimary">{customer.city || '—'}</td>
                      <td className="px-6 py-4 text-textsecondary">{customer.gender || '—'}</td>
                      <td className="px-6 py-4 text-right font-bold text-success">
                        {formatCurrency(customer.lifetimeValue)}
                      </td>
                      <td className="px-6 py-4 text-textsecondary">{formatDate(customer.lastPurchaseDate)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-textsecondary italic">
                      No customer records found matching your query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination bar */}
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

      {/* Add Customer Modal popup */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-cardbg border border-borderbg rounded-xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-borderbg flex items-center justify-between">
              <h3 className="text-lg font-bold">New Shopper Profile</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-textsecondary hover:text-textprimary transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddCustomerSubmit} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 bg-danger/10 text-danger border border-danger/20 rounded-lg text-xs font-semibold">
                  {modalError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-textsecondary font-semibold uppercase tracking-wider block">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter shopper name"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                    className="w-full bg-darkbg border border-borderbg rounded-lg px-3 py-2 text-sm text-textprimary focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-textsecondary font-semibold uppercase tracking-wider block">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="name@domain.com"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                    className="w-full bg-darkbg border border-borderbg rounded-lg px-3 py-2 text-sm text-textprimary focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-textsecondary font-semibold uppercase tracking-wider block">Phone Number</label>
                <input
                  type="text"
                  placeholder="10-digit mobile number"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  className="w-full bg-darkbg border border-borderbg rounded-lg px-3 py-2 text-sm text-textprimary focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-textsecondary font-semibold uppercase tracking-wider block">City</label>
                  <select
                    value={newCustomer.city}
                    onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })}
                    className="w-full bg-darkbg border border-borderbg rounded-lg px-3 py-2 text-sm text-textprimary focus:outline-none focus:border-primary"
                  >
                    <option value="Delhi">Delhi</option>
                    <option value="Mumbai">Mumbai</option>
                    <option value="Bangalore">Bangalore</option>
                    <option value="Chandigarh">Chandigarh</option>
                    <option value="Pune">Pune</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-textsecondary font-semibold uppercase tracking-wider block">Gender</label>
                  <select
                    value={newCustomer.gender}
                    onChange={(e) => setNewCustomer({ ...newCustomer, gender: e.target.value })}
                    className="w-full bg-darkbg border border-borderbg rounded-lg px-3 py-2 text-sm text-textprimary focus:outline-none focus:border-primary"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              {/* Submit Buttons */}
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
                  {submitting ? 'Creating...' : 'Create Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
