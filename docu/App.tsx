import SearchProduct from "./screens/products/SearchProduct";
import SearchResultScreen from "./screens/products/SearchResultScreen";
import VerifyStudentScreen from "./screens/profile/VerifyStudentScreen";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList } from "./types";

import HomeScreen from "./screens/home/HomeScreen";
import CategoryIndex from "./screens/categories/CategoryIndex";
import ProductDetail from "./screens/products/ProductDetailScreen";
import LoginScreen from "./screens/auth/LoginScreen";
import RegisterScreen from "./screens/auth/RegisterScreen";
import VerifyAccountScreen from "./screens/auth/VerifyAccountScreen";
import ForgotPasswordScreen from "./screens/auth/ForgotPasswordScreen";
import NewPasswordScreen from "./screens/auth/NewPasswordScreen";
import ChatListScreen from "./screens/chat/ChatListScreen";
import SearchScreen from "./screens/chat/SearchScreen";
import OTPVerifyScreen from "./screens/auth/OTPVerifyScreen";
import ChatRoomScreen from "./screens/chat/ChatRoomScreen";
import ArchivedChatsScreen from "./screens/chat/ArchivedChatsScreen";
import UnreadMessageScreen from "./screens/chat/UnreadMessageScreen";
import ManagePostsScreen from "./screens/post/ManagePostsScreen";
import ChooseCategoryScreen from "./screens/post/ChooseCategoryScreen";
import ChooseSubCategoryScreen from "./screens/post/ChooseSubCategoryScreen";
import PostFormScreen from "./screens/post/PostFormScreen";
import ViewHistory from "./screens/profile/ViewHistory";
import FeedbackScreen from "./screens/profile/FeedbackScreen";
import UserScreen from "./screens/profile/UserScreen";
import ChooseExchangeCategoryScreen from "./screens/post/ChooseExchangeCategoryScreen";
import ChooseExchangeSubCategoryScreen from "./screens/post/ChooseExchangeSubCategoryScreen";
import HomeAdminScreen from "./screens/admin/HomeAdminScreen";
import ManagerGroupsScreen from "./screens/groups/ManagerGroupsScreen";
import UserInforScreen from "./screens/profile/UserInforScreen";
import EditProfileScreen from "./screens/profile/EditProfileScreen";
import PurchaseRequestScreen from "./screens/products/PurchaseRequestScreen";
import SellProductScreen from "./screens/products/SellProductScreen";
import CreateGroupScreen from "./screens/groups/CreateGroupScreen";
import GroupDetailScreen from "./screens/groups/GroupDetailScreen";
import NotificationScreen from "./screens/Notification/NotificationScreen";
import { NotificationProvider } from "./screens/Notification/NotificationContext";
import SavedPostsScreen from "./screens/profile/SavedPostsScreen";
import { StatusBar } from "expo-status-bar";
import ManageProductsUserScreen from "./screens/admin/ManageProductsUserScreen";
import PostGroupFormScreen from "./screens/groups/PostGroupFormScreen";
import MyGroupPostsScreen from "./screens/groups/crud/MyGroupPostsScreen";
import GroupMembersScreen from "./screens/groups/crud/GroupMembersScreen";
import ApprovePostsScreen from "./screens/groups/crud/ApprovePostsScreen";
import EditGroupScreen from "./screens/groups/crud/EditGroupScreen";
import InviteMembersScreen from "./screens/groups/crud/InviteMembersScreen";
import QRInviteScreen from "./screens/groups/crud/QRInviteScreen";
import DeepLinkHandlerScreen from "./screens/groups/crud/DeepLinkHandlerScreen";
import React, { useEffect } from "react";
import ManageGroupPostsScreen from "./screens/admin/ManageGroupPostsScreen";
import EditProductScreen from "./screens/products/EditProductScreen";
import SuggestionScreen from "./screens/products/SuggestionScreen";
import ManageCategoriesScreen from "./screens/admin/category/ManageCategoriesScreen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { setupDeepLink } from "./src/navigation/DeepLinkHandler";
import { ChatProvider } from "./components/ChatContext";
import AdminVerificationScreen from "./screens/admin/user/AdminVerificationScreen";
import AdminDashboardScreen from "./screens/admin/AdminDashboardScreen";
import ManageReportsScreen from "./screens/admin/ManageReportsScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const navigationRef = React.createRef<any>();
  useEffect(() => {
    const cleanup = setupDeepLink(navigationRef);
    return cleanup;
  }, []);
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NotificationProvider>
        <ChatProvider>
          <NavigationContainer ref={navigationRef}>
            <StatusBar hidden />
            <Stack.Navigator
              initialRouteName="Home"
              screenOptions={{ headerShown: false }}
            >
              {/* <Stack.Screen name="TestApi" component={TestApi} /> */}
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen name="CategoryIndex" component={CategoryIndex} />
              <Stack.Screen name="ProductDetail" component={ProductDetail} />
              <Stack.Screen name="LoginScreen" component={LoginScreen} />
              <Stack.Screen name="RegisterScreen" component={RegisterScreen} />
              <Stack.Screen
                name="VerifyAccountScreen"
                component={VerifyAccountScreen}
              />
              <Stack.Screen
                name="ForgotPasswordScreen"
                component={ForgotPasswordScreen}
              />
              <Stack.Screen
                name="NewPasswordScreen"
                component={NewPasswordScreen}
              />
              <Stack.Screen name="ChatListScreen" component={ChatListScreen} />
              <Stack.Screen name="SearchScreen" component={SearchScreen} />
              <Stack.Screen
                name="OTPVerifyScreen"
                component={OTPVerifyScreen}
              />
              <Stack.Screen name="ChatRoomScreen" component={ChatRoomScreen} />
              <Stack.Screen name="ArchivedChatsScreen" component={ArchivedChatsScreen} />
              <Stack.Screen
                name="UnreadMessageScreen"
                component={UnreadMessageScreen}
              />
              <Stack.Screen
                name="ManagePostsScreen"
                component={ManagePostsScreen}
              />
              <Stack.Screen
                name="ChooseCategoryScreen"
                component={ChooseCategoryScreen}
              />
              <Stack.Screen
                name="ChooseSubCategoryScreen"
                component={ChooseSubCategoryScreen}
              />
              <Stack.Screen name="PostFormScreen" component={PostFormScreen} />
              <Stack.Screen name="ViewHistory" component={ViewHistory} />
              <Stack.Screen name="FeedbackScreen" component={FeedbackScreen} />
              <Stack.Screen name="UserScreen" component={UserScreen} />
              <Stack.Screen
                name="ChooseExchangeCategoryScreen"
                component={ChooseExchangeCategoryScreen}
              />
              <Stack.Screen
                name="ChooseExchangeSubCategoryScreen"
                component={ChooseExchangeSubCategoryScreen}
              />
              <Stack.Screen
                name="HomeAdminScreen"
                component={HomeAdminScreen}
              />
              <Stack.Screen
                name="ManageProductsUserScreen"
                component={ManageProductsUserScreen}
              />
              <Stack.Screen
                name="ManagerGroupsScreen"
                component={ManagerGroupsScreen}
              />
              <Stack.Screen
                name="UserInforScreen"
                component={UserInforScreen}
              />
              <Stack.Screen
                name="EditProfileScreen"
                component={EditProfileScreen}
              />
              <Stack.Screen
                name="SellProductScreen"
                component={SellProductScreen}
              />
              <Stack.Screen
                name="PurchaseRequestScreen"
                component={PurchaseRequestScreen}
              />
              <Stack.Screen
                name="CreateGroupScreen"
                component={CreateGroupScreen}
              />
              <Stack.Screen
                name="SavedPostsScreen"
                component={SavedPostsScreen}
              />
              <Stack.Screen
                name="GroupDetailScreen"
                component={GroupDetailScreen}
              />
              <Stack.Screen
                name="NotificationScreen"
                component={NotificationScreen}
              />
              <Stack.Screen
                name="PostGroupFormScreen"
                component={PostGroupFormScreen}
              />
              <Stack.Screen
                name="MyGroupPostsScreen"
                component={MyGroupPostsScreen}
              />
              <Stack.Screen
                name="GroupMembersScreen"
                component={GroupMembersScreen}
              />
              <Stack.Screen
                name="ApprovePostsScreen"
                component={ApprovePostsScreen}
              />
              <Stack.Screen
                name="EditGroupScreen"
                component={EditGroupScreen}
              />
              <Stack.Screen
                name="InviteMembersScreen"
                component={InviteMembersScreen}
              />
              <Stack.Screen name="QRInviteScreen" component={QRInviteScreen} />
              <Stack.Screen
                name="DeepLinkHandler"
                component={DeepLinkHandlerScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen name="SearchProduct" component={SearchProduct} />
              <Stack.Screen
                name="SearchResultScreen"
                component={SearchResultScreen}
              />
              <Stack.Screen
                name="VerifyStudentScreen"
                component={VerifyStudentScreen}
              />
              <Stack.Screen
                name="ManageGroupPostsScreen"
                component={ManageGroupPostsScreen}
              />
              <Stack.Screen
                name="EditProductScreen"
                component={EditProductScreen}
              />
              <Stack.Screen
                name="SuggestionScreen"
                component={SuggestionScreen}
              />
              <Stack.Screen
                name="ManageCategoriesScreen"
                component={ManageCategoriesScreen}
              />
              <Stack.Screen name="AdminVerification" component={AdminVerificationScreen} />
              <Stack.Screen name="AdminDashboardScreen" component={AdminDashboardScreen} />
              <Stack.Screen name="ManageReportsScreen" component={ManageReportsScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </ChatProvider>
      </NotificationProvider>
    </GestureHandlerRootView>
  );
}