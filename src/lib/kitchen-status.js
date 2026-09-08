export function kitchenBlockReason(kitchen, errorCode) {
  if (errorCode === 'rejected' || kitchen?.verificationStatus === 'rejected') return 'rejected';
  if (errorCode === 'hidden' || errorCode === 'not_found' || kitchen?.hidden) return 'hidden';
  if (kitchen && kitchen.verificationStatus && kitchen.verificationStatus !== 'verified') return 'hidden';
  return null;
}
