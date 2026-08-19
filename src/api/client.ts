// Re-exports request from src/lib/request.ts.
// Mock-based modules still import from here; new real-API modules use @/lib/request directly.
export {request} from '@/lib/request';
