/**
 * Deterministic Affordability & Move-In Cost Calculator for Nigerian Real Estate
 * Works 100% independently without requiring any external LLM / Anthropic API key.
 */

/**
 * Calculates rental affordability based on income or total budget
 * 
 * Standard Nigerian Rental Industry Conventions:
 * - Agency Fee: 10% of base annual rent
 * - Legal / Agreement Fee: 10% of base annual rent
 * - Caution Deposit: ~5% of base annual rent
 * - Move-in multiplier: Total upfront cost ≈ 1.25 * Base Annual Rent
 * - Income rule: Max annual base rent = 30% of total annual income
 */
export function calculateRentalAffordability({ monthlyIncome, annualIncome, totalBudget, serviceCharge = 0 }) {
  const income = annualIncome 
    ? Number(annualIncome) 
    : (monthlyIncome ? Number(monthlyIncome) * 12 : null);

  const budget = totalBudget ? Number(totalBudget) : null;

  if (!income && !budget) {
    return {
      error: 'Please provide either your monthly/annual income or your total available upfront budget.',
    };
  }

  let maxBaseRent = 0;
  let maxUpfrontBudget = 0;

  if (budget) {
    // If user provides total upfront cash available:
    // Total Upfront = Base Rent + 10% Agency + 10% Legal + 5% Caution + Service Charge
    // Total Upfront = Base Rent * 1.25 + Service Charge
    maxUpfrontBudget = budget;
    const availableForRent = Math.max(0, budget - Number(serviceCharge));
    maxBaseRent = Math.round(availableForRent / 1.25);
  } else if (income) {
    // 30% rule for annual rent
    maxBaseRent = Math.round((income * 0.30));
    maxUpfrontBudget = Math.round(maxBaseRent * 1.25 + Number(serviceCharge));
  }

  const agencyFee = Math.round(maxBaseRent * 0.10);
  const legalFee = Math.round(maxBaseRent * 0.10);
  const cautionFee = Math.round(maxBaseRent * 0.05);
  const estimatedMonthlyRent = Math.round(maxBaseRent / 12);

  const formattedBaseRent = maxBaseRent.toLocaleString('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 });
  const formattedUpfront = maxUpfrontBudget.toLocaleString('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 });
  const formattedMonthly = estimatedMonthlyRent.toLocaleString('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 });
  const formattedAgency = agencyFee.toLocaleString('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 });
  const formattedLegal = legalFee.toLocaleString('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 });
  const formattedCaution = cautionFee.toLocaleString('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 });

  const summary = income
    ? `Based on an annual income of ${(income).toLocaleString('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 })}, your maximum recommended annual base rent is ${formattedBaseRent} (~${formattedMonthly}/month). Including standard Nigerian move-in fees (Agency 10%, Legal 10%, Caution 5%), your estimated total upfront budget needed is ${formattedUpfront}.`
    : `With a total upfront budget of ${formattedUpfront}, your target annual base rent should be approximately ${formattedBaseRent} (~${formattedMonthly}/month), leaving room for standard Nigerian move-in fees (Agency: ${formattedAgency}, Legal: ${formattedLegal}, Caution: ${formattedCaution}).`;

  return {
    success: true,
    maxBaseRent,
    estimatedMonthlyRent,
    maxUpfrontBudget,
    breakdown: {
      baseRent: maxBaseRent,
      agencyFee,
      legalFee,
      cautionFee,
      serviceCharge: Number(serviceCharge),
    },
    formatted: {
      maxBaseRent: formattedBaseRent,
      estimatedMonthlyRent: formattedMonthly,
      maxUpfrontBudget: formattedUpfront,
      agencyFee: formattedAgency,
      legalFee: formattedLegal,
      cautionFee: formattedCaution,
    },
    summary,
  };
}

/**
 * Calculates property buying affordability based on saved capital / income
 * 
 * Standard Nigerian Outright Purchase Fees:
 * - Agency/Broker Fee: 5% of property price
 * - Legal/Conveyancing Fee: 5% of property price
 * - Stamp Duty / Perfection / Registration: ~3-5% of property price
 * - Total Additional Purchase Costs: ~13%
 */
export function calculateBuyingAffordability({ totalCapital }) {
  const capital = Number(totalCapital);
  if (!capital || isNaN(capital) || capital <= 0) {
    return {
      error: 'Please provide your total available capital for buying a property.',
    };
  }

  // Total Capital = Property Price * 1.13
  const maxPropertyPrice = Math.round(capital / 1.13);
  const agencyFee = Math.round(maxPropertyPrice * 0.05);
  const legalFee = Math.round(maxPropertyPrice * 0.05);
  const titlePerfectionEst = Math.round(maxPropertyPrice * 0.03);

  const formattedCapital = capital.toLocaleString('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 });
  const formattedPrice = maxPropertyPrice.toLocaleString('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 });

  const summary = `With total capital of ${formattedCapital}, your maximum target property purchase price is ${formattedPrice}. This leaves ~13% (${(capital - maxPropertyPrice).toLocaleString('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 })}) to cover standard Nigerian property acquisition costs (Agency 5%, Legal 5%, Title Perfection ~3%).`;

  return {
    success: true,
    totalCapital: capital,
    maxPropertyPrice,
    breakdown: {
      maxPropertyPrice,
      agencyFee,
      legalFee,
      titlePerfectionEst,
    },
    summary,
  };
}
