import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createStackNavigator } from '@react-navigation/stack';
import { restoreSession } from '../store/slices/authSlice';
import LoginScreen          from '../screens/auth/LoginScreen';
import MainTabNavigator     from './MainTabNavigator';
import ProductEditScreen    from '../screens/products/ProductEditScreen';
import AnalyticsScreen      from '../screens/analytics/AnalyticsScreen';
import EditRequestsScreen   from '../screens/editRequests/EditRequestsScreen';
import ChatbotScreen        from '../screens/chatbot/ChatbotScreen';
import StockHistoryScreen   from '../screens/stock/StockHistoryScreen';

const Stack = createStackNavigator();

const HEADER_STYLE = {
  headerStyle: { backgroundColor: '#FF6B35' },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: '700' },
};

export default function AppNavigator() {
  const dispatch = useDispatch();
  const user     = useSelector(s => s.auth.user);

  useEffect(() => {
    dispatch(restoreSession());
  }, []);

  if (user?.role !== 'owner') {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator screenOptions={HEADER_STYLE}>
      <Stack.Screen name="Main"         component={MainTabNavigator}  options={{ headerShown: false }} />
      <Stack.Screen name="ProductEdit"  component={ProductEditScreen} options={{ title: 'Məhsul Redaktəsi' }} />
      <Stack.Screen name="Analytics"    component={AnalyticsScreen}   options={{ title: 'Analitika' }} />
      <Stack.Screen name="EditRequests" component={EditRequestsScreen} options={{ title: 'Redaktə Sorğuları' }} />
      <Stack.Screen name="Chatbot"      component={ChatbotScreen}     options={{ title: '🤖 AI Köməkçi' }} />
      <Stack.Screen name="StockHistory" component={StockHistoryScreen} options={{ title: 'Stok Tarixçəsi' }} />
    </Stack.Navigator>
  );
}
