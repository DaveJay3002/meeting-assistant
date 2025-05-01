import { Colors } from './Colors';

// Define theme interface
export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  card: string;
  text: string;
  border: string;
  notification: string;
  accent: string;
  error: string;
  success: string;
  info: string;
  warning: string;
}

// Light theme
export const LightTheme: ThemeColors = {
  primary: Colors.purple,
  secondary: Colors.lightBlue,
  background: Colors.white,
  card: Colors.lightGray,
  text: Colors.black,
  border: Colors.gray,
  notification: Colors.red,
  accent: Colors.green,
  error: Colors.red,
  success: Colors.green,
  info: Colors.blue,
  warning: Colors.yellow,
};

// Dark theme
export const DarkTheme: ThemeColors = {
  primary: Colors.lightPurple,
  secondary: Colors.blue,
  background: Colors.darkGray,
  card: Colors.gray,
  text: Colors.white,
  border: Colors.lightGray,
  notification: Colors.red,
  accent: Colors.lightGreen,
  error: Colors.lightRed,
  success: Colors.lightGreen,
  info: Colors.lightBlue,
  warning: Colors.lightYellow,
}; 