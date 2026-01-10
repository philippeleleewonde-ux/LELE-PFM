// ============================================
// SECTOR-SPECIFIC PROMPTS FOR LLM CLASSIFICATION
// Optimized prompts for 11 industry sectors
// ============================================

/**
 * Sector-specific vocabulary and keywords
 */
export const SECTOR_KEYWORDS = {
  electronics: [
    'semiconductor', 'microchip', 'circuit board', 'PCB', 'component manufacturing',
    'assembly line', 'R&D electronics', 'testing lab', 'quality control electronics',
    'embedded systems', 'IoT devices', 'consumer electronics', 'industrial electronics'
  ],
  metal: [
    'steel production', 'aluminum', 'copper', 'foundry', 'casting', 'forging',
    'metallurgy', 'smelting', 'rolling mill', 'metal fabrication', 'welding',
    'heat treatment', 'surface treatment', 'galvanization'
  ],
  glass: [
    'glass manufacturing', 'glazing', 'tempered glass', 'laminated glass',
    'float glass', 'furnace operations', 'glass cutting', 'glass processing',
    'window manufacturing', 'automotive glass', 'architectural glass'
  ],
  electrical_appliances: [
    'white goods', 'home appliances', 'refrigerator', 'washing machine',
    'air conditioning', 'heating systems', 'kitchen appliances', 'small appliances',
    'product assembly', 'after-sales service'
  ],
  food_processing: [
    'food production', 'beverage', 'packaging', 'hygiene standards', 'HACCP',
    'quality control food', 'cold chain', 'processing line', 'bottling',
    'dairy processing', 'meat processing', 'bakery', 'canning'
  ],
  banking: [
    'retail banking', 'corporate banking', 'investment banking', 'private banking',
    'wealth management', 'asset management', 'trading', 'treasury', 'risk management',
    'compliance', 'credit analysis', 'loan processing', 'back office'
  ],
  insurance: [
    'underwriting', 'claims management', 'actuarial', 'life insurance', 'non-life insurance',
    'reinsurance', 'risk assessment', 'policy administration', 'sales network',
    'loss adjustment', 'insurance broker'
  ],
  maintenance: [
    'preventive maintenance', 'corrective maintenance', 'technical support',
    'facility management', 'equipment maintenance', 'industrial maintenance',
    'building maintenance', 'HVAC maintenance', 'electrical maintenance'
  ],
  telecommunication: [
    'network operations', 'infrastructure telecom', 'customer service telecom',
    'technical support telecom', 'mobile network', 'fixed network', 'data center',
    'network engineering', 'field operations', 'installation services'
  ],
  public_sector: [
    'administration', 'public service', 'government agency', 'municipal services',
    'social services', 'education public', 'healthcare public', 'infrastructure public',
    'regulatory body', 'public safety'
  ],
  service_distribution: [
    'retail operations', 'logistics', 'supply chain', 'warehousing', 'distribution center',
    'customer service', 'sales operations', 'merchandising', 'inventory management',
    'e-commerce', 'last-mile delivery'
  ]
} as const;

/**
 * NACE codes mapping for each sector
 */
export const SECTOR_NACE_MAPPING = {
  electronics: {
    primary: ['C26', 'C27'],
    codes: {
      'C26.1': 'Manufacture of electronic components and boards',
      'C26.2': 'Manufacture of computers and peripheral equipment',
      'C26.3': 'Manufacture of communication equipment',
      'C26.4': 'Manufacture of consumer electronics',
      'C26.5': 'Manufacture of instruments and appliances for measuring, testing and navigation',
      'C27.1': 'Manufacture of electric motors, generators, transformers',
      'C27.9': 'Manufacture of other electrical equipment'
    }
  },
  metal: {
    primary: ['C24', 'C25'],
    codes: {
      'C24.1': 'Manufacture of basic iron and steel',
      'C24.2': 'Manufacture of tubes, pipes, hollow profiles',
      'C24.3': 'Manufacture of other products of first processing of steel',
      'C24.4': 'Manufacture of basic precious and other non-ferrous metals',
      'C24.5': 'Casting of metals',
      'C25.1': 'Manufacture of structural metal products',
      'C25.5': 'Forging, pressing, stamping and roll-forming of metal',
      'C25.6': 'Treatment and coating of metals'
    }
  },
  glass: {
    primary: ['C23.1'],
    codes: {
      'C23.11': 'Manufacture of flat glass',
      'C23.12': 'Shaping and processing of flat glass',
      'C23.13': 'Manufacture of hollow glass',
      'C23.14': 'Manufacture of glass fibres',
      'C23.19': 'Manufacture and processing of other glass'
    }
  },
  electrical_appliances: {
    primary: ['C27.5'],
    codes: {
      'C27.51': 'Manufacture of electric domestic appliances',
      'C27.52': 'Manufacture of non-electric domestic appliances'
    }
  },
  food_processing: {
    primary: ['C10', 'C11'],
    codes: {
      'C10.1': 'Processing and preserving of meat',
      'C10.2': 'Processing and preserving of fish',
      'C10.3': 'Processing and preserving of fruit and vegetables',
      'C10.4': 'Manufacture of vegetable and animal oils',
      'C10.5': 'Manufacture of dairy products',
      'C10.6': 'Manufacture of grain mill products',
      'C10.7': 'Manufacture of bakery products',
      'C10.8': 'Manufacture of other food products',
      'C10.9': 'Manufacture of prepared animal feeds',
      'C11.0': 'Manufacture of beverages'
    }
  },
  banking: {
    primary: ['K64'],
    codes: {
      'K64.19': 'Other monetary intermediation',
      'K64.20': 'Activities of holding companies',
      'K64.30': 'Trusts, funds and similar financial entities',
      'K64.91': 'Financial leasing',
      'K64.92': 'Other credit granting',
      'K64.99': 'Other financial service activities'
    }
  },
  insurance: {
    primary: ['K65'],
    codes: {
      'K65.11': 'Life insurance',
      'K65.12': 'Non-life insurance',
      'K65.20': 'Reinsurance',
      'K65.30': 'Pension funding'
    }
  },
  maintenance: {
    primary: ['C33', 'N81.2'],
    codes: {
      'C33.1': 'Repair of fabricated metal products, machinery and equipment',
      'C33.2': 'Installation of industrial machinery and equipment',
      'N81.21': 'General cleaning of buildings',
      'N81.22': 'Other building and industrial cleaning activities'
    }
  },
  telecommunication: {
    primary: ['J61'],
    codes: {
      'J61.10': 'Wired telecommunications activities',
      'J61.20': 'Wireless telecommunications activities',
      'J61.30': 'Satellite telecommunications activities',
      'J61.90': 'Other telecommunications activities'
    }
  },
  public_sector: {
    primary: ['O84'],
    codes: {
      'O84.11': 'General public administration activities',
      'O84.12': 'Regulation of health, education, cultural services',
      'O84.13': 'Regulation of business sectors',
      'O84.21': 'Foreign affairs',
      'O84.22': 'Defence activities',
      'O84.23': 'Justice and judicial activities',
      'O84.24': 'Public order and safety activities',
      'O84.25': 'Fire service activities'
    }
  },
  service_distribution: {
    primary: ['G46', 'G47', 'H52'],
    codes: {
      'G46.1': 'Wholesale on a fee or contract basis',
      'G46.9': 'Non-specialised wholesale trade',
      'G47.1': 'Retail sale in non-specialised stores',
      'G47.9': 'Retail sale not in stores',
      'H52.1': 'Warehousing and storage',
      'H52.2': 'Support activities for transportation'
    }
  }
} as const;

/**
 * GICS codes mapping for each sector
 */
export const SECTOR_GICS_MAPPING = {
  electronics: {
    sector: '45',
    codes: {
      '45201010': 'Semiconductors',
      '45202010': 'Electronic Equipment & Instruments',
      '45202020': 'Electronic Components',
      '45203010': 'Electronic Manufacturing Services',
      '45203015': 'Technology Distributors'
    }
  },
  metal: {
    sector: '15',
    codes: {
      '15104010': 'Aluminum',
      '15104020': 'Diversified Metals & Mining',
      '15104025': 'Copper',
      '15104030': 'Gold',
      '15104040': 'Precious Metals & Minerals',
      '15104045': 'Silver',
      '15104050': 'Steel'
    }
  },
  glass: {
    sector: '15',
    codes: {
      '15102010': 'Construction Materials',
      '15103010': 'Metal & Glass Containers'
    }
  },
  electrical_appliances: {
    sector: '25',
    codes: {
      '25201010': 'Household Appliances',
      '25201020': 'Home Furnishings',
      '25201030': 'Homebuilding',
      '25201040': 'Household Products'
    }
  },
  food_processing: {
    sector: '30',
    codes: {
      '30201010': 'Brewers',
      '30201020': 'Distillers & Vintners',
      '30201030': 'Soft Drinks',
      '30202010': 'Agricultural Products',
      '30202030': 'Packaged Foods & Meats'
    }
  },
  banking: {
    sector: '40',
    codes: {
      '40101010': 'Diversified Banks',
      '40101015': 'Regional Banks',
      '40102010': 'Thrifts & Mortgage Finance',
      '40201020': 'Other Diversified Financial Services',
      '40201030': 'Multi-Sector Holdings',
      '40201040': 'Specialized Finance',
      '40202010': 'Consumer Finance',
      '40203010': 'Asset Management & Custody Banks',
      '40203020': 'Investment Banking & Brokerage'
    }
  },
  insurance: {
    sector: '40',
    codes: {
      '40301010': 'Insurance Brokers',
      '40301020': 'Life & Health Insurance',
      '40301030': 'Multi-line Insurance',
      '40301040': 'Property & Casualty Insurance',
      '40301050': 'Reinsurance'
    }
  },
  maintenance: {
    sector: '20',
    codes: {
      '20301010': 'Building Products',
      '20302010': 'Construction & Engineering',
      '20304010': 'Electrical Components & Equipment',
      '20305010': 'Industrial Conglomerates',
      '20305020': 'Industrial Machinery'
    }
  },
  telecommunication: {
    sector: '50',
    codes: {
      '50101010': 'Alternative Carriers',
      '50101020': 'Integrated Telecommunication Services',
      '50102010': 'Wireless Telecommunication Services'
    }
  },
  public_sector: {
    sector: '55',
    codes: {
      '55101010': 'Electric Utilities',
      '55102010': 'Gas Utilities',
      '55103010': 'Multi-Utilities',
      '55104010': 'Water Utilities',
      '55105010': 'Independent Power Producers & Energy Traders'
    }
  },
  service_distribution: {
    sector: '25',
    codes: {
      '25501010': 'Distributors',
      '25502010': 'Internet & Direct Marketing Retail',
      '25503010': 'Department Stores',
      '25503020': 'General Merchandise Stores',
      '25504010': 'Apparel Retail',
      '25504020': 'Computer & Electronics Retail',
      '25504030': 'Home Improvement Retail',
      '25504040': 'Specialty Stores',
      '25504050': 'Automotive Retail'
    }
  }
} as const;

/**
 * Sector-specific LLM prompts
 */
export const SECTOR_PROMPTS = {
  electronics: `You are an expert in the electronics industry classification.
Analyze the following business line and classify it according to NACE and GICS standards.

Common business lines in electronics:
- Component Manufacturing (semiconductors, PCBs, capacitors)
- R&D and Design (circuit design, testing)
- Assembly and Production
- Quality Control and Testing
- Supply Chain and Logistics

Consider: technology level, product type, value chain position.`,

  metal: `You are an expert in the metal industry classification.
Analyze the following business line and classify it according to NACE and GICS standards.

Common business lines in metal industry:
- Steel Production and Processing
- Non-ferrous Metals (aluminum, copper)
- Foundry and Casting
- Forging and Metal Forming
- Surface Treatment and Finishing
- Scrap and Recycling

Consider: metal type, processing stage, end-use application.`,

  glass: `You are an expert in the glass industry classification.
Analyze the following business line and classify it according to NACE and GICS standards.

Common business lines in glass industry:
- Flat Glass Manufacturing
- Glass Processing and Shaping
- Hollow Glass Production
- Automotive Glass
- Architectural Glass
- Special Glass Applications

Consider: glass type, processing level, application sector.`,

  electrical_appliances: `You are an expert in the electrical appliances industry classification.
Analyze the following business line and classify it according to NACE and GICS standards.

Common business lines in electrical appliances:
- White Goods Manufacturing (refrigerators, washing machines)
- Small Appliances Production
- Product Assembly and Testing
- After-Sales Service
- Spare Parts Management
- Distribution and Logistics

Consider: product category, value chain position, service vs manufacturing.`,

  food_processing: `You are an expert in the food processing industry classification.
Analyze the following business line and classify it according to NACE and GICS standards.

Common business lines in food processing:
- Raw Material Processing
- Production and Manufacturing
- Quality Control and Food Safety
- Packaging and Labeling
- Cold Chain and Storage
- Distribution and Logistics
- R&D and Innovation

Consider: food category, processing level, safety standards, value chain position.`,

  banking: `You are an expert in the banking sector classification.
Analyze the following business line and classify it according to NACE and GICS standards.

Common business lines in banking:
- Retail Banking (deposits, loans, mortgages)
- Corporate Banking (business loans, treasury)
- Investment Banking (M&A, capital markets)
- Private Banking / Wealth Management
- Asset Management
- Trading (equity, fixed income, FX, commodities)
- Risk Management and Compliance
- Operations and Technology
- Back Office and Support

Consider: customer segment, product type, revenue model, regulatory environment.`,

  insurance: `You are an expert in the insurance sector classification.
Analyze the following business line and classify it according to NACE and GICS standards.

Common business lines in insurance:
- Life Insurance
- Non-Life Insurance (property, casualty, auto)
- Health Insurance
- Reinsurance
- Underwriting
- Claims Management
- Actuarial Services
- Sales and Distribution Network
- Risk Assessment

Consider: insurance type, value chain position, customer segment.`,

  maintenance: `You are an expert in the maintenance sector classification.
Analyze the following business line and classify it according to NACE and GICS standards.

Common business lines in maintenance:
- Preventive Maintenance
- Corrective Maintenance
- Industrial Maintenance
- Building and Facility Maintenance
- HVAC Systems Maintenance
- Electrical Systems Maintenance
- Technical Support
- Emergency Services

Consider: maintenance type, industry served, technical complexity.`,

  telecommunication: `You are an expert in the telecommunication sector classification.
Analyze the following business line and classify it according to NACE and GICS standards.

Common business lines in telecommunication:
- Network Operations and Management
- Infrastructure Deployment
- Customer Service and Support
- Technical Support
- Sales and Marketing
- Network Engineering
- Data Center Operations
- Field Operations and Installation

Consider: network type (mobile/fixed), service type, value chain position.`,

  public_sector: `You are an expert in the public sector classification.
Analyze the following business line and classify it according to NACE and GICS standards.

Common business lines in public sector:
- General Administration
- Public Services Delivery
- Regulatory and Oversight
- Social Services
- Public Education
- Public Healthcare
- Infrastructure and Public Works
- Public Safety and Security

Consider: government level, service type, regulatory function.`,

  service_distribution: `You are an expert in the service and distribution sector classification.
Analyze the following business line and classify it according to NACE and GICS standards.

Common business lines in service and distribution:
- Retail Operations
- Wholesale Distribution
- Supply Chain Management
- Warehousing and Logistics
- Customer Service
- E-commerce Operations
- Last-Mile Delivery
- Inventory Management
- Merchandising

Consider: distribution channel, product category, service model.`
} as const;

/**
 * Detect sector from business line name
 */
export function detectSector(businessLineName: string): keyof typeof SECTOR_PROMPTS | 'unknown' {
  const normalized = businessLineName.toLowerCase();

  // Check keywords for each sector
  for (const [sector, keywords] of Object.entries(SECTOR_KEYWORDS)) {
    if (keywords.some(keyword => normalized.includes(keyword.toLowerCase()))) {
      return sector as keyof typeof SECTOR_PROMPTS;
    }
  }

  return 'unknown';
}

/**
 * Get sector-specific prompt
 */
export function getSectorPrompt(sector: keyof typeof SECTOR_PROMPTS): string {
  return SECTOR_PROMPTS[sector];
}
