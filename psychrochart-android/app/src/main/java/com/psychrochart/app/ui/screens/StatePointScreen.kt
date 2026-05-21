package com.psychrochart.app.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Calculate
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.psychrochart.app.domain.SecondaryInput
import com.psychrochart.app.ui.components.StateResultCard
import com.psychrochart.app.viewmodel.MainViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StatePointScreen(vm: MainViewModel) {
    val stateResult by vm.stateResult.collectAsState()
    val stateError  by vm.stateError.collectAsState()

    var dbtText  by remember { mutableStateOf("25") }
    var secValue by remember { mutableStateOf("50") }
    var selected by remember { mutableStateOf(SecondaryInput.RH) }
    var expanded by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Text("State Point Calculator", style = MaterialTheme.typography.headlineMedium)

        OutlinedTextField(
            value = dbtText,
            onValueChange = { dbtText = it },
            label = { Text("Dry-Bulb Temperature (°C)") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
        )

        ExposedDropdownMenuBox(expanded = expanded, onExpandedChange = { expanded = it }) {
            OutlinedTextField(
                value = secondaryLabel(selected),
                onValueChange = {},
                readOnly = true,
                label = { Text("Second Input") },
                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded) },
                modifier = Modifier.menuAnchor().fillMaxWidth(),
            )
            ExposedDropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
                SecondaryInput.entries.forEach { opt ->
                    DropdownMenuItem(
                        text = { Text(secondaryLabel(opt)) },
                        onClick = {
                            selected = opt
                            secValue = defaultValue(opt)
                            expanded = false
                        }
                    )
                }
            }
        }

        OutlinedTextField(
            value = secValue,
            onValueChange = { secValue = it },
            label = { Text(secondaryLabel(selected) + " — " + secondaryUnit(selected)) },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
        )

        Button(
            onClick = {
                val dbt = dbtText.toDoubleOrNull() ?: return@Button
                val sec = secValue.toDoubleOrNull() ?: return@Button
                vm.calculateState(dbt, selected, sec)
            },
            modifier = Modifier.fillMaxWidth(),
        ) {
            Icon(Icons.Default.Calculate, contentDescription = null)
            Spacer(Modifier.width(8.dp))
            Text("Calculate")
        }

        stateError?.let {
            Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer)) {
                Text(it, modifier = Modifier.padding(12.dp), color = MaterialTheme.colorScheme.onErrorContainer)
            }
        }

        stateResult?.let { state ->
            StateResultCard(state)
        }
    }
}

private fun secondaryLabel(input: SecondaryInput) = when (input) {
    SecondaryInput.WBT -> "Wet-Bulb Temperature"
    SecondaryInput.DPT -> "Dew-Point Temperature"
    SecondaryInput.RH  -> "Relative Humidity"
    SecondaryInput.W   -> "Humidity Ratio"
    SecondaryInput.V   -> "Specific Volume"
}

private fun secondaryUnit(input: SecondaryInput) = when (input) {
    SecondaryInput.WBT -> "°C"
    SecondaryInput.DPT -> "°C"
    SecondaryInput.RH  -> "%"
    SecondaryInput.W   -> "kg/kg"
    SecondaryInput.V   -> "m³/kg"
}

private fun defaultValue(input: SecondaryInput) = when (input) {
    SecondaryInput.RH  -> "50"
    SecondaryInput.WBT -> "18"
    SecondaryInput.DPT -> "13"
    SecondaryInput.W   -> "0.0099"
    SecondaryInput.V   -> "0.855"
}
