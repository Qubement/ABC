import React from 'react';
import { Text } from 'react-native';

// This component handles global CFI text replacement
export const replaceCFIText = (text: string): string => {
  return text.replace(/\bcfi\b/gi, 'CFI');
};

// Updated text components that automatically replace CFI
export const CFIText = ({ children, style, ...props }: any) => {
  const processedText = typeof children === 'string' ? replaceCFIText(children) : children;
  return <Text style={style} {...props}>{processedText}</Text>;
};

export default CFIText;