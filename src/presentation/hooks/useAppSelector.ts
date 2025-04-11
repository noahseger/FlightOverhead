import { TypedUseSelectorHook, useSelector } from 'react-redux';
import { RootState } from '../store';

/**
 * Custom hook for accessing store state with correct typing
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;