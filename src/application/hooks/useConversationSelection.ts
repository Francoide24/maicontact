import { useState } from 'react';

export const useConversationSelection = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleSelect = (index: number) => {
    setActiveIndex(index);
  };

  return {
    activeIndex,
    handleSelect
  };
};