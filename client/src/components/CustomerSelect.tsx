import { useState } from 'react';
import { useCustomers } from '../hooks/useApi';
import type { Customer } from '../types/index';

interface CustomerSelectProps {
  onSelect: (customer: Customer) => void;
  onViewHistory?: (customerId: string, customerName: string) => void;
}

export function CustomerSelect({ onSelect, onViewHistory }: CustomerSelectProps) {
  const [search, setSearch] = useState('');
  const { data: customers, loading, error } = useCustomers(search);

  return (
    <section>
      {/* Page Header */}
      <div className="mb-10">
        <h2 className="text-headline-lg text-on-surface mb-2">Step 1: Select Customer</h2>
        <p className="text-body-lg text-on-surface-variant max-w-2xl">
          Search for the customer associated with the dispute request. You can search by name, account number, or email address.
        </p>
      </div>

      {/* Search Area */}
      <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-lg shadow-sm mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <label className="block text-label-md text-on-surface-variant mb-2 uppercase tracking-wider">
              Search Criteria
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">search</span>
              <input
                type="text"
                data-testid="customer-search-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Enter name, email or account number (e.g. ACCT-8823)"
                className="w-full pl-12 pr-4 py-3 bg-white border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-body-lg"
              />
            </div>
          </div>
          <div className="flex items-end">
            <button className="bg-primary text-on-primary px-8 py-3 rounded-lg font-bold text-body-md hover:opacity-95 active:scale-95 transition-all h-[50px] flex items-center justify-center">
              Search Database
            </button>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3 text-on-surface-variant">Searching customers...</span>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="bg-error-container border border-error/20 rounded-lg p-4">
          <p className="text-on-error-container text-body-md">{error}</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && customers && customers.length === 0 && (
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-outline text-5xl mb-4">person_search</span>
          <p className="text-on-surface-variant text-body-lg">No customers found matching your search.</p>
        </div>
      )}

      {/* Customer Grid */}
      {!loading && !error && customers && customers.length > 0 && (
        <div data-testid="customer-list" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {customers.map((customer) => (
            <div
              key={customer.id}
              data-testid={`customer-item-${customer.id}`}
              onClick={() => onSelect(customer)}
              className="bg-surface-container-lowest border border-outline-variant p-6 rounded-lg hover:shadow-lg hover:border-primary transition-all group flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-surface-container-high rounded-lg flex items-center justify-center group-hover:bg-primary-container transition-colors">
                    <span className="material-symbols-outlined text-primary group-hover:text-on-primary-container">person</span>
                  </div>
                  <span className="bg-surface-container text-on-secondary-container px-2 py-1 rounded text-[10px] font-bold uppercase">
                    Customer
                  </span>
                </div>
                <h3 className="text-headline-md text-on-surface mb-1">{customer.name}</h3>
                <p className="text-data-tabular text-on-surface-variant mb-4">{customer.accountNumber}</p>
                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-on-surface-variant">
                    <span className="material-symbols-outlined text-[18px]">mail</span>
                    <span className="text-body-md">{customer.email}</span>
                  </div>
                </div>
              </div>
              <button className="w-full border border-secondary text-secondary py-2 rounded-lg font-bold text-label-md group-hover:bg-primary group-hover:text-on-primary group-hover:border-primary transition-all">
                Select Customer
              </button>
              {onViewHistory && (
                <button
                  data-testid="view-history-link"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewHistory(customer.id, customer.name);
                  }}
                  className="w-full mt-2 border border-outline-variant text-secondary py-2 rounded-lg font-bold text-label-md hover:bg-surface-container-high transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">history</span>
                  View History
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Operational Guidance Banner */}
      <div className="mt-12 bg-surface-container-high border-l-[6px] border-secondary p-6 rounded-r-lg shadow-sm">
        <div className="flex gap-4 items-start">
          <div className="p-2 bg-white rounded-full">
            <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
          </div>
          <div>
            <h4 className="text-headline-md text-primary mb-1">Operational Guidance</h4>
            <p className="text-body-md text-on-surface-variant">
              Selecting the correct customer profile is critical for risk assessment. Ensure the account number matches the documentation exactly to prevent triage mismatch.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
