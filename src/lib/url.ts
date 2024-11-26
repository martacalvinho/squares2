/**
 * Formats a URL string to ensure it has a proper protocol (https://)
 * @param url The URL string to format
 * @returns The formatted URL string
 */
export const formatUrl = (url: string): string => {
  if (!url) return url;
  
  // Remove any leading/trailing whitespace
  url = url.trim();
  
  // If URL is already properly formatted, return as is
  if (url.startsWith('https://') || url.startsWith('http://')) {
    return url;
  }

  // If URL starts with 'www.', add https://
  if (url.startsWith('www.')) {
    return `https://${url}`;
  }

  // If URL is just a domain (e.g., 'example.com')
  if (url.includes('.') && !url.includes('://') && !url.startsWith('www.')) {
    return `https://www.${url}`;
  }

  // If URL doesn't have any protocol, www, or domain format, assume it needs both https:// and www.
  return `https://www.${url}`;
};
