export interface ValidationError {
  field: string;
  message: string;
}

export function validateCropCycleInput(data: {
  cropType?: string;
  seedingDate?: string;
  expectedHarvestDate?: string;
  landArea?: number | string;
  status?: string;
}): { isValid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  if (!data.cropType || data.cropType.trim() === '') {
    errors.push({ field: 'cropType', message: 'Crop name/type is required.' });
  }

  if (!data.seedingDate) {
    errors.push({ field: 'seedingDate', message: 'Seeding date is required.' });
  }

  if (!data.expectedHarvestDate) {
    errors.push({ field: 'expectedHarvestDate', message: 'Expected harvest date is required.' });
  }

  if (data.seedingDate && data.expectedHarvestDate) {
    const seeding = new Date(data.seedingDate).getTime();
    const harvest = new Date(data.expectedHarvestDate).getTime();
    if (isNaN(seeding) || isNaN(harvest)) {
      errors.push({ field: 'expectedHarvestDate', message: 'Invalid date format.' });
    } else if (harvest < seeding) {
      errors.push({
        field: 'expectedHarvestDate',
        message: 'Expected harvest date cannot be earlier than seeding date.',
      });
    }
  }

  if (data.landArea !== undefined && data.landArea !== '' && Number(data.landArea) <= 0) {
    errors.push({ field: 'landArea', message: 'Land area must be a positive number.' });
  }

  return { isValid: errors.length === 0, errors };
}

export function validateExpenseInput(data: {
  type?: string;
  description?: string;
  amount?: number | string;
  expenseDate?: string;
}): { isValid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  if (!data.type || data.type.trim() === '') {
    errors.push({ field: 'type', message: 'Expense type/category is required.' });
  }

  // Description is optional in the modern form (Notes optional)
  if (!data.description && !(data as any).notes && (!data.type || data.type.trim() === '')) {
    errors.push({ field: 'description', message: 'Description or expense type is required.' });
  }

  const amt = Number(data.amount);
  if (isNaN(amt) || amt <= 0) {
    errors.push({ field: 'amount', message: 'Amount must be greater than zero.' });
  }

  if (!data.expenseDate) {
    errors.push({ field: 'expenseDate', message: 'Expense date is required.' });
  }

  return { isValid: errors.length === 0, errors };
}

export function validateIncomeInput(data: {
  cropType?: string;
  quantity?: number | string;
  unitPrice?: number | string;
  saleDate?: string;
}): { isValid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  if (!data.cropType || data.cropType.trim() === '') {
    errors.push({ field: 'cropType', message: 'Crop name/type is required.' });
  }

  const qty = Number(data.quantity);
  if (isNaN(qty) || qty <= 0) {
    errors.push({ field: 'quantity', message: 'Quantity sold must be greater than zero.' });
  }

  const price = Number(data.unitPrice);
  if (isNaN(price) || price <= 0) {
    errors.push({ field: 'unitPrice', message: 'Unit selling price must be greater than zero.' });
  }

  if (!data.saleDate) {
    errors.push({ field: 'saleDate', message: 'Sale date is required.' });
  }

  return { isValid: errors.length === 0, errors };
}
