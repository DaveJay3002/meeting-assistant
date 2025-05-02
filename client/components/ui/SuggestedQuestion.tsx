import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface SuggestedQuestionProps {
  text: string;
  onPress: () => void;
}

const SuggestedQuestion: React.FC<SuggestedQuestionProps> = ({ text, onPress }) => {
  const { theme } = useTheme();
  
  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: theme.card, borderColor: theme.border }]} 
      onPress={onPress}
    >
      <Text style={[styles.text, { color: theme.text }]} numberOfLines={2}>
        {text}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    marginRight: 12,
    marginBottom: 12,
    borderWidth: 1,
    maxWidth: 200,
  },
  text: {
    fontSize: 14,
  },
});

export default SuggestedQuestion; 