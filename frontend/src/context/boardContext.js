import React from 'react'

export const BoardContext = React.createContext({
  board: null,
  onMove: () => {},
})