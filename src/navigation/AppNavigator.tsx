/**
 * AppNavigator — Bottom tab navigation with 4 tabs
 *
 * Tabs: Texto, Voz, Conversación, Ajustes
 */

import React from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { TextModeScreen } from '../screens/TextModeScreen';
import { VoiceModeScreen } from '../screens/VoiceModeScreen';
import { ConversationModeScreen } from '../screens/ConversationModeScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { colors, typography, spacing, borderRadius } from '../theme/theme';

const Tab = createBottomTabNavigator();

interface TabIconProps {
  name: React.ComponentProps<typeof Feather>['name'];
  label: string;
  focused: boolean;
  color: string;
}

function TabIcon({ name, label, focused, color }: TabIconProps) {
  return (
    <View style={styles.tabIconContainer}>
      <Feather 
        name={name} 
        size={24} 
        color={color} 
        style={{ opacity: focused ? 1 : 0.6 }} 
      />
    </View>
  );
}

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: colors.accent.primary,
          tabBarInactiveTintColor: colors.text.tertiary,
          tabBarShowLabel: false,
        }}
      >
        <Tab.Screen
          name="TextMode"
          component={TextModeScreen}
          options={{
            tabBarIcon: ({ focused, color }) => (
              <TabIcon name="file-text" label="Texto" focused={focused} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="VoiceMode"
          component={VoiceModeScreen}
          options={{
            tabBarIcon: ({ focused, color }) => (
              <TabIcon name="mic" label="Voz" focused={focused} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="ConversationMode"
          component={ConversationModeScreen}
          options={{
            tabBarIcon: ({ focused, color }) => (
              <TabIcon name="message-square" label="Chat" focused={focused} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            tabBarIcon: ({ focused, color }) => (
              <TabIcon name="settings" label="Ajustes" focused={focused} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.bg.secondary,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    height: 60,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabIcon: {
    fontSize: 22,
  },
  tabLabel: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.medium,
  },
});

export default AppNavigator;
