import { Ionicons } from "@expo/vector-icons";

import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Platform, StyleSheet, View } from "react-native";

type IconName = "home" | "home-outline" | "trophy" | "trophy-outline" | "person" | "person-outline";

export default function TabsLayout() {
    return (
        <>
            <StatusBar style="light" backgroundColor="transparent" translucent />
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarShowLabel: false,
                    tabBarActiveTintColor: "#FFFFFF",
                    tabBarInactiveTintColor: "#6B6B80",
                    tabBarStyle: styles.tabBar,
                    tabBarItemStyle: styles.tabBarItem,
                }}
            >
                <Tabs.Screen
                    name="index"
                    options={{
                        title: "Home",
                        tabBarIcon: ({ focused, color }) => (
                            <View style={styles.iconContainer}>
                                <Ionicons
                                    name={focused ? "home" : "home-outline"}
                                    size={24}
                                    color={color}
                                />

                            </View>
                        ),
                    }}
                />
                <Tabs.Screen
                    name="leaderboard"
                    options={{
                        title: "Leaderboard",
                        tabBarIcon: ({ focused, color }) => (
                            <View style={styles.iconContainer}>
                                <Ionicons
                                    name={focused ? "trophy" : "trophy-outline"}
                                    size={24}
                                    color={color}
                                />

                            </View>
                        ),
                    }}
                />
                <Tabs.Screen
                    name="profile"
                    options={{
                        title: "Profile",
                        tabBarIcon: ({ focused, color }) => (
                            <View style={styles.iconContainer}>
                                <Ionicons
                                    name={focused ? "person" : "person-outline"}
                                    size={24}
                                    color={color}
                                />

                            </View>
                        ),
                    }}
                />
            </Tabs>
        </>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        height: Platform.OS === 'ios' ? 80 : 70,
        backgroundColor: '#12121C',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.08)',
        elevation: 0,
        paddingBottom: Platform.OS === 'ios' ? 20 : 0,
    },
    tabBarItem: {
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 10,
    },
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        width: 60,
    },

});
