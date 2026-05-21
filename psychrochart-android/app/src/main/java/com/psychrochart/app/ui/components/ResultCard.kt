package com.psychrochart.app.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.psychrochart.app.domain.PsychroState

@Composable
fun StateResultCard(state: PsychroState, title: String = "Calculated State", modifier: Modifier = Modifier) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(title, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            HorizontalDivider()
            PropertyRow("Dry-Bulb Temp (DBT)",  "%.2f °C".format(state.dbt))
            PropertyRow("Wet-Bulb Temp (WBT)",  "%.2f °C".format(state.wbt))
            PropertyRow("Dew-Point Temp (DPT)", "%.2f °C".format(state.dpt))
            PropertyRow("Relative Humidity",    "%.1f %%".format(state.rh))
            PropertyRow("Humidity Ratio (W)",   "%.6f kg/kg".format(state.w))
            PropertyRow("Enthalpy (h)",         "%.3f kJ/kg".format(state.h))
            PropertyRow("Specific Volume (v)",  "%.4f m³/kg".format(state.v))
            PropertyRow("Vapor Pressure (Pv)",  "%.4f kPa".format(state.pv))
            PropertyRow("Degree of Saturation", "%.4f".format(state.mu))
        }
    }
}

@Composable
fun MetricsCard(metrics: Map<String, String>, title: String, modifier: Modifier = Modifier) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(title, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            HorizontalDivider()
            metrics.forEach { (key, value) -> PropertyRow(key, value) }
        }
    }
}

@Composable
private fun PropertyRow(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Text(
            label,
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.weight(1f),
        )
        Text(
            value,
            style = MaterialTheme.typography.bodyLarge,
            fontWeight = FontWeight.Medium,
            color = MaterialTheme.colorScheme.onSurface,
        )
    }
}
