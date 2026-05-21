package com.psychrochart.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.*
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.psychrochart.app.ui.navigation.Screen
import com.psychrochart.app.ui.navigation.bottomNavScreens
import com.psychrochart.app.ui.screens.ChartScreen
import com.psychrochart.app.ui.screens.ProcessScreen
import com.psychrochart.app.ui.screens.StatePointScreen
import com.psychrochart.app.ui.theme.PsychroChartTheme
import com.psychrochart.app.viewmodel.MainViewModel

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            PsychroChartTheme {
                val navController = rememberNavController()
                val vm: MainViewModel = viewModel()
                val navBackStackEntry by navController.currentBackStackEntryAsState()
                val currentDestination = navBackStackEntry?.destination

                Scaffold(
                    modifier = Modifier.fillMaxSize(),
                    bottomBar = {
                        NavigationBar {
                            bottomNavScreens.forEach { screen ->
                                NavigationBarItem(
                                    icon = { Icon(screen.icon, contentDescription = screen.label) },
                                    label = { Text(screen.label) },
                                    selected = currentDestination?.hierarchy?.any { it.route == screen.route } == true,
                                    onClick = {
                                        navController.navigate(screen.route) {
                                            popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                                            launchSingleTop = true
                                            restoreState = true
                                        }
                                    }
                                )
                            }
                        }
                    }
                ) { innerPadding ->
                    NavHost(
                        navController = navController,
                        startDestination = Screen.StatePoint.route,
                        modifier = Modifier.padding(innerPadding),
                    ) {
                        composable(Screen.StatePoint.route) { StatePointScreen(vm) }
                        composable(Screen.Processes.route)  { ProcessScreen(vm) }
                        composable(Screen.Chart.route)      { ChartScreen(vm) }
                    }
                }
            }
        }
    }
}
