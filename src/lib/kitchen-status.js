export function isOwnKitchen(kitchen, user) {
  return Boolean(user && kitchen && kitchen.ownerUserId === user.id);
}

export function kitchenBlockReason(kitchen, errorCode, user) {
  if (errorCode === 'own_kitchen' || isOwnKitchen(kitchen, user)) return 'own_kitchen';
  if (errorCode === 'rejected' || kitchen?.verificationStatus === 'rejected') return 'rejected';
  if (errorCode === 'hidden' || errorCode === 'not_found' || kitchen?.hidden) return 'hidden';
  if (kitchen && kitchen.verificationStatus && kitchen.verificationStatus !== 'verified') return 'hidden';
  return null;
}
