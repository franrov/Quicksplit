import { createBrowserRouter } from "react-router";
import { MobileLayout } from "./components/MobileLayout";
import { HomeScreen } from "./screens/HomeScreen";
import { NewSplitScreen } from "./screens/NewSplitScreen";
import { ScanReceiptScreen } from "./screens/ScanReceiptScreen";
import { SelectPeopleScreen } from "./screens/SelectPeopleScreen";
import { SplitMethodScreen } from "./screens/SplitMethodScreen";
import { AssignAmountsScreen } from "./screens/AssignAmountsScreen";
import { WhoPaidScreen } from "./screens/WhoPaidScreen";
import { ReviewSplitScreen } from "./screens/ReviewSplitScreen";
import { ConfirmationScreen } from "./screens/ConfirmationScreen";
import { SplitDetailsScreen } from "./screens/SplitDetailsScreen";
import { HouseholdExpensesScreen } from "./screens/HouseholdExpensesScreen";
import { HouseholdExpenseDetailScreen } from "./screens/HouseholdExpenseDetailScreen";
import { AddRecurringExpenseScreen } from "./screens/AddRecurringExpenseScreen";
import { NotificationsScreen } from "./screens/NotificationsScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { AddPaymentMethodScreen } from "./screens/AddPaymentMethodScreen";
import { LoginScreen } from "./screens/LoginScreen";
import { SignupScreen } from "./screens/SignupScreen";
import { ChangePasswordScreen } from "./screens/ChangePasswordScreen";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: MobileLayout,
    children: [
      { index: true, Component: LoginScreen },
      { path: "signup", Component: SignupScreen },
      { path: "home", Component: HomeScreen },
      { path: "new", Component: NewSplitScreen },
      { path: "new/scan", Component: ScanReceiptScreen },
      { path: "new/people", Component: SelectPeopleScreen },
      { path: "new/method", Component: SplitMethodScreen },
      { path: "new/assign", Component: AssignAmountsScreen },
      { path: "new/who-paid", Component: WhoPaidScreen },
      { path: "new/review", Component: ReviewSplitScreen },
      { path: "confirmation", Component: ConfirmationScreen },
      { path: "split/:id", Component: SplitDetailsScreen },
      { path: "household", Component: HouseholdExpensesScreen },
      { path: "household/new", Component: AddRecurringExpenseScreen },
      { path: "household/:id", Component: HouseholdExpenseDetailScreen },
      { path: "notifications", Component: NotificationsScreen },
      { path: "profile", Component: ProfileScreen },
      { path: "profile/change-password", Component: ChangePasswordScreen },
      { path: "payment-method/new", Component: AddPaymentMethodScreen },
    ],
  },
]);
