export const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const base = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
};
