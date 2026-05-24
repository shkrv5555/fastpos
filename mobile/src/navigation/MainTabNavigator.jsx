import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import DashboardScreen  from '../screens/dashboard/DashboardScreen';
import ProductsScreen   from '../screens/products/ProductsScreen';
import DiscountsScreen  from '../screens/discounts/DiscountsScreen';
import EmployeesScreen  from '../screens/employees/EmployeesScreen';
import MoreScreen       from '../screens/more/MoreScreen';

const Tab = createBottomTabNavigator();

const ICONS = {
  Dashboard:  '📊',
  Products:   '🍽',
  Discounts:  '🏷',
  Employees:  '👥',
  More:       '⋯',
};

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => (
          <Text style={{ fontSize: 20, opacity: focused ? 1 : .6 }}>{ICONS[route.name]}</Text>
        ),
        tabBarActiveTintColor:   '#FF6B35',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#F3F4F6',
          paddingBottom: 4,
          height: 58,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        headerStyle: { backgroundColor: '#FF6B35' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700', fontSize: 17 },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen}  options={{ title: 'Dashboard',  tabBarLabel: 'Dashboard' }} />
      <Tab.Screen name="Products"  component={ProductsScreen}   options={{ title: 'Məhsullar',  tabBarLabel: 'Məhsullar' }} />
      <Tab.Screen name="Discounts" component={DiscountsScreen}  options={{ title: 'Endirimlər', tabBarLabel: 'Endirimlər' }} />
      <Tab.Screen name="Employees" component={EmployeesScreen}  options={{ title: 'İşçilər',    tabBarLabel: 'İşçilər' }} />
      <Tab.Screen name="More"      component={MoreScreen}       options={{ title: 'Daha çox',   tabBarLabel: 'Daha çox' }} />
    </Tab.Navigator>
  );
}
