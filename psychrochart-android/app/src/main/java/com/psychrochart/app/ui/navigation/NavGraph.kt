package com.psychrochart.app.ui.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Analytics
import androidx.compose.material.icons.filled.CompareArrows
import androidx.compose.material.icons.filled.Thermostat
import androidx.compose.ui.graphics.vector.ImageVector

sealed class Screen(val route: String, val label: String, val icon: ImageVector) {
    data object StatePoint : Screen("state_point", "Calculator", Icons.Default.Thermostat)
    data object Processes  : Screen("processes",   "Processes",  Icons.Default.CompareArrows)
    data object Chart      : Screen("chart",       "Chart",      Icons.Default.Analytics)
}

val bottomNavScreens = listOf(Screen.StatePoint, Screen.Processes, Screen.Chart)
