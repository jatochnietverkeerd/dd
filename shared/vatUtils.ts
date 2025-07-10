// VAT and BPM calculation utilities for Dutch automotive industry

export type VatType = "21%" | "marge" | "geen_btw";

export interface PurchaseCalculation {
  purchasePrice: number; // Excl. BTW
  vatType: VatType;
  vatAmount: number;
  bpmAmount: number;
  transportCost: number;
  maintenanceCost: number;
  cleaningCost: number;
  guaranteeCost: number;
  otherCosts: number;
  totalCostInclVat: number;
}

export interface SaleCalculation {
  salePrice: number; // Excl. BTW
  vatType: VatType;
  vatAmount: number;
  salePriceInclVat: number;
  discount: number;
  finalPrice: number;
  profitExclVat: number;
  profitInclVat: number;
}

export function calculatePurchaseTotal(
  purchasePrice: number,
  vatType: VatType,
  bpmAmount: number = 0,
  transportCost: number = 0,
  maintenanceCost: number = 0,
  cleaningCost: number = 0,
  guaranteeCost: number = 0,
  otherCosts: number = 0
): PurchaseCalculation {
  let vatAmount = 0;
  
  // Calculate VAT based on type
  switch (vatType) {
    case "21%":
      vatAmount = purchasePrice * 0.21;
      break;
    case "marge":
    case "geen_btw":
      vatAmount = 0;
      break;
  }
  
  // Additional costs VAT (transport, maintenance, etc. usually have 21% VAT)
  const additionalCosts = transportCost + maintenanceCost + cleaningCost + guaranteeCost + otherCosts;
  const additionalCostsVat = additionalCosts * 0.21;
  
  const totalCostInclVat = purchasePrice + vatAmount + bpmAmount + additionalCosts + additionalCostsVat;
  
  return {
    purchasePrice,
    vatType,
    vatAmount: vatAmount + additionalCostsVat,
    bpmAmount,
    transportCost,
    maintenanceCost,
    cleaningCost,
    guaranteeCost,
    otherCosts,
    totalCostInclVat
  };
}

export function calculateSaleTotal(
  salePrice: number,
  vatType: VatType,
  discount: number = 0,
  purchaseData?: PurchaseCalculation
): SaleCalculation {
  let vatAmount = 0;
  let salePriceInclVat = salePrice;
  
  // Calculate VAT based on type
  switch (vatType) {
    case "21%":
      vatAmount = salePrice * 0.21;
      salePriceInclVat = salePrice + vatAmount;
      break;
    case "marge":
      // Voor marge-auto's wordt BTW alleen berekend over de winst
      if (purchaseData) {
        const profit = salePrice - purchaseData.purchasePrice;
        vatAmount = Math.max(0, profit * 0.21);
        salePriceInclVat = salePrice + vatAmount;
      }
      break;
    case "geen_btw":
      vatAmount = 0;
      salePriceInclVat = salePrice;
      break;
  }
  
  const finalPrice = salePriceInclVat - discount;
  
  // Calculate profit
  let profitExclVat = 0;
  let profitInclVat = 0;
  
  if (purchaseData) {
    profitExclVat = salePrice - purchaseData.purchasePrice;
    profitInclVat = finalPrice - purchaseData.totalCostInclVat;
  }
  
  return {
    salePrice,
    vatType,
    vatAmount,
    salePriceInclVat,
    discount,
    finalPrice,
    profitExclVat,
    profitInclVat
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2
  }).format(amount);
}

export function validateVatType(vatType: string): VatType {
  if (vatType === "21%" || vatType === "marge" || vatType === "geen_btw") {
    return vatType as VatType;
  }
  return "21%"; // Default fallback
}

export function getVatTypeLabel(vatType: VatType): string {
  switch (vatType) {
    case "21%":
      return "21% BTW";
    case "marge":
      return "Marge regeling";
    case "geen_btw":
      return "Geen BTW";
    default:
      return "21% BTW";
  }
}