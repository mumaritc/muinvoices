import { createContext } from 'react'
export const ValidationContext = createContext<{ path: string; message: string }[]>([])
