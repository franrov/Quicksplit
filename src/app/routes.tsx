import { createBrowserRouter } from "react-router";
import { MobileLayout } from "./components/MobileLayout";
import { HomeScreen } from "./screens/HomeScreen";
import { NewSplitScreen } from "./screens/NewSplitScreen";
import { SelectPeopleScreen } from "./screens/SelectPeopleScreen";
import { ReviewSplitScreen } from "./screens/ReviewSplitScreen";
import { SplitDetailsScreen } from "./screens/SplitDetailsScreen";
import { HouseholdExpensesScreen } from "./screens/HouseholdExpensesScreen";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: MobileLayout,
    children: [
      { index: true, Component: HomeScreen },
      { path: "new", Component: NewSplitScreen },
      { path: "new/people", Component: SelectPeopleScreen },
      { path: "new/review", Component: ReviewSplitScreen },
      { path: "split/:id", Component: SplitDetailsScreen },
      { path: "household", Component: HouseholdExpensesScreen },
    ],
  },
]);
