/**
 * SuDomus Listing Verification Helper
 * 
 * IMPORTANT:
 * A listing being "published" does NOT automatically mean it is "verified".
 * This helper provides a safe default architecture.
 * 
 * FUTURE BACKEND INTEGRATION POINT:
 * When listing verification fields (e.g., `verification_status` or `is_verified`)
 * are formally introduced in the PostgreSQL database schema and administrative KYC/compliance workflow,
 * map those values directly here.
 */

export function getListingVerification(listing) {
  if (!listing) {
    return {
      status: 'pending',
      label: 'Verification Pending',
      shortLabel: 'Pending',
      badgeClass: 'badge-verification-pending',
      description: 'Under review by SuDomus compliance.',
      isVerified: false
    };
  }

  // Explicit verified check (future backend column integration)
  if (
    listing.verification_status === 'verified' ||
    listing.is_verified === true ||
    listing.verified === true
  ) {
    return {
      status: 'verified',
      label: 'Verified Property',
      shortLabel: 'Verified',
      badgeClass: 'badge-verification-verified',
      description: 'Title deeds and ownership verified by SuDomus.',
      isVerified: true
    };
  }

  // Explicit rejected check
  if (
    listing.verification_status === 'rejected'
  ) {
    return {
      status: 'rejected',
      label: 'Verification Rejected',
      shortLabel: 'Rejected',
      badgeClass: 'badge-verification-rejected',
      description: 'Listing verification was rejected.',
      isVerified: false,
      rejectionReason: listing.rejection_reason || null
    };
  }

  // Explicit unverified check
  if (
    listing.verification_status === 'unverified' ||
    listing.is_verified === false
  ) {
    return {
      status: 'unverified',
      label: 'Unverified Listing',
      shortLabel: 'Unverified',
      badgeClass: 'badge-verification-unverified',
      description: 'Listing has not undergone verification.',
      isVerified: false
    };
  }

  // Safe default: Pending Verification
  return {
    status: 'pending',
    label: 'Verification Pending',
    shortLabel: 'Verification Pending',
    badgeClass: 'badge-verification-pending',
    description: 'Under physical and compliance review by SuDomus.',
    isVerified: false
  };
}
