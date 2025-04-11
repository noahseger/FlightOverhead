import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store';

/**
 * Custom hook for accessing dispatch with correct typing
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();