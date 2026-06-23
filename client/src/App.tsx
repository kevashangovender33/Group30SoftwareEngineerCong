import { useState } from 'react';
import { useReferenceData } from './hooks/useApi';
import { CustomerSelect } from './components/CustomerSelect';
import { TransactionSelect } from './components/TransactionSelect';
import { DisputeCaptureForm } from './components/DisputeCaptureForm';
import { TriageResultScreen } from './components/TriageResultScreen';
import { DisputeHistoryScreen } from './components/DisputeHistoryScreen';
import { AnalyticsDashboardScreen } from './components/AnalyticsDashboardScreen';
import type { Customer, Transaction, DisputeResponse } from './types/index';

type Screen = 'SELECT_CUSTOMER' | 'SELECT_TRANSACTION' | 'CAPTURE_DISPUTE' | 'TRIAGE_RESULT' | 'DISPUTE_HISTORY' | 'CUSTOMER_DISPUTE_HISTORY' | 'ANALYTICS_DASHBOARD';

const STEPS = [
  { label: 'Select Customer', key: 'SELECT_CUSTOMER' },
  { label: 'Select Transaction', key: 'SELECT_TRANSACTION' },
  { label: 'Capture Dispute', key: 'CAPTURE_DISPUTE' },
  { label: 'Triage Result', key: 'TRIAGE_RESULT' },
] as const;

function getStepIndex(screen: Screen): number {
  return STEPS.findIndex((s) => s.key === screen);
}

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('SELECT_CUSTOMER');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [disputeResult, setDisputeResult] = useState<DisputeResponse | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedCustomerName, setSelectedCustomerName] = useState<string | null>(null);

  const { data: referenceData } = useReferenceData();

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCurrentScreen('SELECT_TRANSACTION');
  };

  const handleTransactionSelect = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setCurrentScreen('CAPTURE_DISPUTE');
  };

  const handleTransactionBack = () => {
    setCurrentScreen('SELECT_CUSTOMER');
  };

  const handleDisputeSubmit = (result: DisputeResponse) => {
    setDisputeResult(result);
    setCurrentScreen('TRIAGE_RESULT');
  };

  const handleDisputeBack = () => {
    setCurrentScreen('SELECT_TRANSACTION');
  };

  const handleNewDispute = () => {
    setSelectedCustomer(null);
    setSelectedTransaction(null);
    setDisputeResult(null);
    setCurrentScreen('SELECT_CUSTOMER');
  };

  const handleNavigateToHistory = () => {
    setSelectedCustomerId(null);
    setSelectedCustomerName(null);
    setCurrentScreen('DISPUTE_HISTORY');
  };

  const handleNavigateToNewDispute = () => {
    setSelectedCustomer(null);
    setSelectedTransaction(null);
    setDisputeResult(null);
    setSelectedCustomerId(null);
    setSelectedCustomerName(null);
    setCurrentScreen('SELECT_CUSTOMER');
  };

  const handleNavigateToCustomerHistory = (customerId: string, customerName: string) => {
    setSelectedCustomerId(customerId);
    setSelectedCustomerName(customerName);
    setCurrentScreen('CUSTOMER_DISPUTE_HISTORY');
  };

  void handleNavigateToCustomerHistory; // Will be used in task 7.4 (View History link on CustomerSelect)

  const handleHistoryBack = () => {
    setSelectedCustomerId(null);
    setSelectedCustomerName(null);
    setCurrentScreen('SELECT_CUSTOMER');
  };

  const handleHistoryProceed = () => {
    if (selectedCustomerId && selectedCustomerName) {
      setSelectedCustomer({ id: selectedCustomerId, name: selectedCustomerName, email: '', accountNumber: '' });
      setCurrentScreen('SELECT_TRANSACTION');
    }
  };

  const handleNavigateToDashboard = () => {
    setCurrentScreen('ANALYTICS_DASHBOARD');
  };

  const currentStepIndex = getStepIndex(currentScreen);

  const isCaptureFlow = ['SELECT_CUSTOMER', 'SELECT_TRANSACTION', 'CAPTURE_DISPUTE', 'TRIAGE_RESULT'].includes(currentScreen);
  const isHistoryScreen = currentScreen === 'DISPUTE_HISTORY' || currentScreen === 'CUSTOMER_DISPUTE_HISTORY';
  const isDashboardScreen = currentScreen === 'ANALYTICS_DASHBOARD';

  const renderScreen = () => {
    switch (currentScreen) {
      case 'SELECT_CUSTOMER':
        return <CustomerSelect onSelect={handleCustomerSelect} />;
      case 'SELECT_TRANSACTION':
        return (
          <TransactionSelect
            customerId={selectedCustomer!.id}
            customerName={selectedCustomer!.name}
            onSelect={handleTransactionSelect}
            onBack={handleTransactionBack}
          />
        );
      case 'CAPTURE_DISPUTE':
        return (
          <DisputeCaptureForm
            customer={selectedCustomer!}
            transaction={selectedTransaction!}
            referenceData={referenceData}
            onSubmit={handleDisputeSubmit}
            onBack={handleDisputeBack}
          />
        );
      case 'TRIAGE_RESULT':
        return (
          <TriageResultScreen
            disputeId={disputeResult!.disputeId}
            onNewDispute={handleNewDispute}
          />
        );
      case 'DISPUTE_HISTORY':
        return (
          <DisputeHistoryScreen />
        );
      case 'CUSTOMER_DISPUTE_HISTORY':
        return (
          <DisputeHistoryScreen
            customerId={selectedCustomerId || undefined}
            customerName={selectedCustomerName || undefined}
            onBack={handleHistoryBack}
            onProceed={handleHistoryProceed}
          />
        );
      case 'ANALYTICS_DASHBOARD':
        return <AnalyticsDashboardScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-surface font-inter flex">
      {/* Side Navigation (Desktop) */}
      <aside className="hidden md:flex flex-col h-screen w-64 bg-surface-container-lowest border-r border-outline-variant fixed left-0 top-0 z-50">
        <div className="p-6 flex flex-col items-center border-b border-outline-variant">
          <div className="w-12 h-12 bg-primary-container rounded-lg flex items-center justify-center mb-3">
            <span className="text-white font-black text-lg">T</span>
          </div>
          <h1 className="text-headline-md font-black text-primary">Ops Portal</h1>
          <p className="text-label-md text-on-surface-variant">Internal Triage</p>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
          <div
            onClick={handleNavigateToNewDispute}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-bold cursor-pointer transition-transform active:scale-95 ${
              isCaptureFlow
                ? 'bg-secondary-container text-on-secondary-container'
                : 'text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined">add_box</span>
            <span className="text-label-md">New Dispute</span>
          </div>
          <div
            onClick={handleNavigateToHistory}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all ${
              isHistoryScreen
                ? 'bg-secondary-container text-on-secondary-container font-bold'
                : 'text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined">history</span>
            <span className="text-label-md">Dispute History</span>
          </div>
          <div
            onClick={handleNavigateToDashboard}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all ${
              isDashboardScreen
                ? 'bg-secondary-container text-on-secondary-container font-bold'
                : 'text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined">dashboard</span>
            <span className="text-label-md">Dashboard</span>
          </div>
          <div className="pt-6 pb-2">
            <p className="px-4 text-[10px] font-bold uppercase tracking-widest text-outline">Support</p>
          </div>
          <div className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high transition-all rounded-lg cursor-pointer">
            <span className="material-symbols-outlined">settings</span>
            <span className="text-label-md">Settings</span>
          </div>
          <div className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high transition-all rounded-lg cursor-pointer">
            <span className="material-symbols-outlined">contact_support</span>
            <span className="text-label-md">Support</span>
          </div>
        </nav>
        <div className="p-4 mt-auto border-t border-outline-variant">
          <div className="flex items-center gap-3 px-3">
            <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-white font-bold text-xs">
              OP
            </div>
            <div className="flex flex-col">
              <span className="text-on-surface font-bold text-xs">Ops User</span>
              <span className="text-on-surface-variant text-[10px]">Operations Officer</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 flex flex-col min-w-0">
        {/* Top Navigation Bar */}
        <header className="bg-surface-container-lowest border-b border-outline-variant h-16 flex justify-between items-center px-8 sticky top-0 z-40">
          <div className="flex items-center gap-8">
            <span className="text-headline-md font-bold text-primary">TRIAGE</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors relative">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full"></span>
            </button>
            <button className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors">
              <span className="material-symbols-outlined">help</span>
            </button>
            <div className="h-8 w-px bg-outline-variant mx-2"></div>
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-bold text-label-md">
                OP
              </div>
              <span className="hidden sm:inline text-body-md text-on-surface font-medium">Ops User</span>
            </div>
          </div>
        </header>

        {/* Journey Canvas */}
        <div className="flex-1 p-8 max-w-container-max mx-auto w-full">
          {/* Breadcrumb Stepper (capture flow only) */}
          {isCaptureFlow && (
          <nav className="flex items-center gap-4 mb-8 py-2 overflow-x-auto whitespace-nowrap">
            {STEPS.map((step, i) => {
              const isCompleted = i < currentStepIndex;
              const isActive = i === currentStepIndex;
              return (
                <div key={step.key} className="flex items-center gap-4">
                  {i > 0 && (
                    <span className="material-symbols-outlined text-outline-variant text-sm">chevron_right</span>
                  )}
                  <div
                    className={`flex items-center gap-2 px-2 pb-1 ${
                      isActive
                        ? 'border-b-2 border-primary text-primary font-bold'
                        : isCompleted
                          ? 'text-primary/60'
                          : 'text-on-surface-variant opacity-60'
                    }`}
                  >
                    {isCompleted ? (
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                    ) : (
                      <span className="text-label-md">{String(i + 1).padStart(2, '0')}</span>
                    )}
                    <span className="text-body-md">{step.label}</span>
                  </div>
                </div>
              );
            })}
          </nav>
          )}

          {/* Screen Content */}
          {renderScreen()}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface-container-lowest border-t border-outline-variant flex justify-around items-center z-50">
        <div
          onClick={handleNavigateToNewDispute}
          className={`flex flex-col items-center cursor-pointer ${
            isCaptureFlow ? 'text-primary' : 'text-on-surface-variant opacity-60'
          }`}
        >
          <span className="material-symbols-outlined" style={isCaptureFlow ? { fontVariationSettings: "'FILL' 1" } : undefined}>add_box</span>
          <span className="text-[10px] font-bold">New</span>
        </div>
        <div
          onClick={handleNavigateToHistory}
          className={`flex flex-col items-center cursor-pointer ${
            isHistoryScreen ? 'text-primary' : 'text-on-surface-variant opacity-60'
          }`}
        >
          <span className="material-symbols-outlined" style={isHistoryScreen ? { fontVariationSettings: "'FILL' 1" } : undefined}>history</span>
          <span className="text-[10px] font-bold">History</span>
        </div>
        <div
          onClick={handleNavigateToDashboard}
          className={`flex flex-col items-center cursor-pointer ${
            isDashboardScreen ? 'text-primary' : 'text-on-surface-variant opacity-60'
          }`}
        >
          <span className="material-symbols-outlined" style={isDashboardScreen ? { fontVariationSettings: "'FILL' 1" } : undefined}>dashboard</span>
          <span className="text-[10px] font-bold">Dash</span>
        </div>
        <div className="flex flex-col items-center text-on-surface-variant opacity-60">
          <span className="material-symbols-outlined">settings</span>
          <span className="text-[10px] font-medium">Tools</span>
        </div>
      </nav>
    </div>
  );
}

export default App;
