export function formatClientType(clientType: string): string {
  if (!clientType) return '';

  if (clientType.toLowerCase() === 'vip') {
    return 'VIP';
  }

  // Capitalize first letter, lowercase the rest
  return clientType.charAt(0).toUpperCase() + clientType.slice(1).toLowerCase();
}

export function capitalizeString(word: string): string {
  if (!word) return '';

  // Capitalize first letter, lowercase the rest
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}
