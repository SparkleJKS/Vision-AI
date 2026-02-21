import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ScreenNames } from "@/configs/navigation";
import type { IExploreStackParamList } from "@/screens/screens.types";
import ExploreScreen from "./ExploreScreen";
import ObjectDetectionScreen from "./ObjectDetectionScreen";
import ExploreOcrScreen from "./ExploreOcrScreen";
import ExploreTtsScreen from "./ExploreTtsScreen";

const Stack = createNativeStackNavigator<IExploreStackParamList>();

const ExploreStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      animation: "slide_from_right",
      gestureEnabled: true,
    }}
  >
    <Stack.Screen name={ScreenNames.Explore} component={ExploreScreen} />
    <Stack.Screen
      name={ScreenNames.ExploreObjectDetection}
      component={ObjectDetectionScreen}
    />
    <Stack.Screen name={ScreenNames.ExploreOcr} component={ExploreOcrScreen} />
    <Stack.Screen name={ScreenNames.ExploreTts} component={ExploreTtsScreen} />
  </Stack.Navigator>
);

export default ExploreStack;
