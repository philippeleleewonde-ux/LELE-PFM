'use client';

import { CompanyInfo, BUSINESS_SECTORS, Currency } from '@/modules/module1/types';
import { CURRENCIES } from '@/modules/module1/utils/formatting';
import { Building2, Mail, Briefcase, Factory, DollarSign } from 'lucide-react';

interface CompanyInfoSectionProps {
  companyInfo: CompanyInfo;
  selectedCurrency: Currency;
  onCompanyInfoChange: (data: CompanyInfo) => void;
  onCurrencyChange: (currency: Currency) => void;
}

export function CompanyInfoSection({
  companyInfo,
  selectedCurrency,
  onCompanyInfoChange,
  onCurrencyChange,
}: CompanyInfoSectionProps) {
  const handleChange = (field: keyof CompanyInfo, value: string) => {
    onCompanyInfoChange({ ...companyInfo, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="form-grid">
        {/* Email */}
        <div className="form-field">
          <label className="form-label flex items-center space-x-2">
            <Mail className="w-4 h-4 text-cfo-accent" />
            <span>Email Address *</span>
          </label>
          <input
            type="email"
            className="form-input"
            placeholder="Enter your email address"
            value={companyInfo.email}
            onChange={(e) => handleChange('email', e.target.value)}
            required
          />
        </div>

        {/* Company Name */}
        <div className="form-field">
          <label className="form-label flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-cfo-accent" />
            <span>Company Name *</span>
          </label>
          <input
            type="text"
            className="form-input"
            placeholder="Enter your company name"
            value={companyInfo.companyName}
            onChange={(e) => handleChange('companyName', e.target.value)}
            required
          />
        </div>

        {/* Activity */}
        <div className="form-field">
          <label className="form-label flex items-center space-x-2">
            <Briefcase className="w-4 h-4 text-cfo-accent" />
            <span>Main Activity</span>
          </label>
          <input
            type="text"
            className="form-input"
            placeholder="Describe your main business activity"
            value={companyInfo.activity}
            onChange={(e) => handleChange('activity', e.target.value)}
          />
        </div>

        {/* Business Sector */}
        <div className="form-field">
          <label className="form-label flex items-center space-x-2">
            <Factory className="w-4 h-4 text-cfo-accent" />
            <span>Business Sector</span>
          </label>
          <select
            className="form-select"
            value={companyInfo.businessSector}
            onChange={(e) => handleChange('businessSector', e.target.value)}
          >
            {BUSINESS_SECTORS.map((sector) => (
              <option key={sector} value={sector}>
                {sector}
              </option>
            ))}
          </select>
        </div>

        {/* Currency Selector */}
        <div className="form-field">
          <label className="form-label flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-cfo-accent" />
            <span>Select your currency</span>
          </label>
          <select
            className="form-select"
            value={selectedCurrency}
            onChange={(e) => {
              const val = e.target.value;
              // If user picks the placeholder (empty), keep a safe default (EUR)
              onCurrencyChange((val ? (val as Currency) : 'EUR'));
            }}
          >
            {/* Placeholder option as first choice */}
            <option value="">No choice</option>
            {CURRENCIES.map((currency) => (
              <option key={currency.code} value={currency.code}>
                {currency.name} ({currency.symbol})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Info Panel */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
        <h3 className="text-blue-400 font-medium mb-2">Company Information</h3>
        <p className="text-blue-300 text-sm">
          This information will be used to personalize your financial analysis and ensure 
          sector-specific calculations are applied correctly. Your email will be used for 
          report delivery and account management.
        </p>
      </div>
    </div>
  );
}